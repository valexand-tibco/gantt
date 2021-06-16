/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import h from './h';
import Gantt from './gantt';
import render from './render/svg';
import { getFont } from './gantt/styles';
import {
  minDate, maxDate, textWidth, max, getTranslation, DAY, getDatesStrict, formatDay, getNumberOfDays
} from './utils';

export default class SVGGantt {
  constructor(element, data, options = {}) {
    this.dom = typeof element === 'string' ? document.querySelector(element) : element;
    this.format(data);
    this.options = options;

    if (this.options.maxTextWidth === undefined) {
      const font = getFont(options.styleOptions || {});
      const w = (v) => textWidth(v.text, font, 20);
      this.options.maxTextWidth = max(data.map(w), 0);
    }

    const chartMinDate = new Date(this.start);
    const chartMaxDate = new Date(this.end);
    chartMinDate.setDate(chartMinDate.getDate() - 1);
    chartMaxDate.setDate(chartMaxDate.getDate() + 1);
    this.chartMinDate = chartMinDate;
    this.chartMaxDate = chartMaxDate;
    this.initialMinDate = chartMinDate;
    this.initialMaxDate = chartMaxDate;
    this.dates = getDatesStrict(this.initialMinDate, this.initialMaxDate);
    this.leftIndex = 0;
    this.rightIndex = this.dates.length - 1;

    this.scaleFactor = 1;
    this.totalDays = this.dates.length;
    this.visibleDates = this.dates.length;

    this.visibleDataWidth = this.options.maxWidth - this.options.maxTextWidth;
    const dataWidth = this.visibleDataWidth / this.scaleFactor;
    this.unitWidth = dataWidth / this.visibleDates;

    this.thumbWidth = 16;
    this.headerUnitWidth = (this.options.maxWidth - this.options.maxTextWidth - 2 * this.thumbWidth) / this.totalDays;
    this.daysScale = d3.scaleLinear().domain([this.options.maxTextWidth,
      this.options.maxWidth - 2 * this.thumbWidth - this.headerUnitWidth]).range([0, this.totalDays - 1]);
    this.dataScale = d3.scaleLinear().domain([0, this.totalDays - 1]).range([this.options.maxTextWidth, this.options.maxWidth]);

    this.zoomSlider = {
      x: this.options.maxTextWidth,
      width: this.options.maxWidth - this.options.maxTextWidth
    };

    this.render();
  }
  format(data) {
    this.data = data;
    let start = null;
    let end = null;
    data.forEach((v) => {
      start = minDate(start, v.start);
      end = maxDate(end, v.end);
    });
    this.start = start || new Date();
    this.end = end || new Date();
  }
  setData(data) {
    this.format(data);
    this.render();
  }
  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.render();
  }
  setRanderState(state) {
    this.options.renderState.preventRender = state;
    this.render();
  }

  // eslint-disable-next-line class-methods-use-this
  addScrollBar(scrollBarThickness, headerHeight, rowHeight, barHeight, zoomSliderHeight, viewModeSliderHeight) {
    let verticalScrollDistance = 0;

    const root = d3.select('#scrollgroup')
      .attr('clip-path', 'url(#scrollbox-clip-path)');
    const parent = d3.select(root.node().parentNode);

    const rootBBox = {
      x: parseFloat(root.attr('x')),
      y: parseFloat(root.attr('y')),
      width: parseFloat(root.attr('width')),
      height: parseFloat(root.attr('height'))
    };

    const header = d3.select('#DayHeader').attr('transform', `translate(${rootBBox.x},${0})`);
    const labels = d3.select('#Labels').attr('transform', `translate(${0},${0})`);

    const contentItems = root.selectAll('*');
    const content = root.append('g')
      .attr('id', 'GanttContent')
      .attr('transform', `translate(${0},${0})`);
    const contenItemsNodes = contentItems.nodes();
    for (let i = 0; i < contenItemsNodes.length; i++) {
      content.node().appendChild(contenItemsNodes[i]);
    }

    const clipRect = parent.append('clipPath').attr('id', 'scrollbox-clip-path').append('rect');
    clipRect
      .attr('x', rootBBox.x)
      .attr('y', rootBBox.y)
      .attr('width', rootBBox.width)
      .attr('height', rootBBox.height);

    root
      .insert('rect', 'g')
      .attr('x', rootBBox.x)
      .attr('y', rootBBox.y)
      .attr('width', rootBBox.width)
      .attr('height', rootBBox.height)
      .attr('opacity', 0);

    const verticalScrollBar = parent.append('rect')
      .attr('width', scrollBarThickness)
      .attr('rx', scrollBarThickness / 2)
      .attr('ry', scrollBarThickness / 2)
      .attr('opacity', 0)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      .attr('transform', `translate(${rootBBox.x + rootBBox.width},${rootBBox.y + headerHeight})`);

    const contentBBox = content.node().getBBox();
    const absoluteContentHeight = contentBBox.y + contentBBox.height;

    const scrollbarHeight = rootBBox.height * rootBBox.height / absoluteContentHeight - headerHeight;
    verticalScrollBar.attr('height', scrollbarHeight);

    const maxVerticalScroll = Math.max(absoluteContentHeight - rootBBox.height + (rowHeight - barHeight) / 2 - viewModeSliderHeight - zoomSliderHeight - 8, 0);

    function updateVerticalScrollPosition(diff) {
      verticalScrollDistance += diff;
      verticalScrollDistance = Math.max(0, verticalScrollDistance);
      verticalScrollDistance = Math.min(maxVerticalScroll, verticalScrollDistance);

      const xValue = getTranslation(content.attr('transform'))[0];

      // content.attr('transform', `translate(${xValue}, ${rootBBox.y - verticalScrollDistance})`);
      content.attr('transform', `translate(${xValue}, ${-verticalScrollDistance})`);
      // labels.attr('transform', `translate(${xValue},${rootBBox.y - verticalScrollDistance})`);
      labels.attr('transform', `translate(${0},${-verticalScrollDistance})`);
      // const scrollBarPosition = verticalScrollDistance / maxVerticalScroll * (rootBBox.height - scrollbarHeight);
      const scrollBarPosition = verticalScrollDistance / maxVerticalScroll * (rootBBox.height - scrollbarHeight)
       - (verticalScrollDistance * headerHeight / maxVerticalScroll);
      if (!Number.isNaN(scrollBarPosition)) verticalScrollBar.attr('y', scrollBarPosition);
    }

    root.on('wheel', () => {
      // eslint-disable-next-line no-restricted-globals
      updateVerticalScrollPosition(event.deltaY);
    });

    let isVerticalDragging = false;
    parent.on('mouseenter', () => {
      verticalScrollBar.attr('opacity', 1);
    });
    parent.on('mouseleave', () => {
      if (!isVerticalDragging) {
        verticalScrollBar.attr('opacity', 0);
      }
    });

    const verticalDragBehaviour = d3.drag()
      .on('drag', (event) => {
        updateVerticalScrollPosition(event.dy * maxVerticalScroll / (rootBBox.height - scrollbarHeight));
      })
      .on('start', (event) => {
        isVerticalDragging = true;
      })
      .on('end', (event) => {
        isVerticalDragging = false;
      });

    verticalScrollBar.call(verticalDragBehaviour);
  }

  // eslint-disable-next-line class-methods-use-this
  addZoomSlider(scrollBarThickness, maxTextWidth, zoomSliderHeight, viewModeSliderHeight, width) {
    const horizontalXOffset = maxTextWidth;

    const root = d3.select('#scrollgroup');
    const parent = d3.select(root.node().parentNode);

    const outerZoomSlider = parent.append('rect')
      .attr('id', 'OuterZoomSlider')
      .attr('width', width - horizontalXOffset)
      .attr('x', horizontalXOffset)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness)
      .attr('height', scrollBarThickness)
      // .attr('rx', scrollBarThickness / 4)
      // .attr('ry', scrollBarThickness / 4)
      .attr('rx', scrollBarThickness)
      .attr('ry', scrollBarThickness)
      .attr('fill', '#F0F1F2');

    const thumbWidth = 16;
    const outerWidth = parseFloat(outerZoomSlider.attr('width'));
    const one = (outerWidth - 2 * thumbWidth) / this.totalDays;
    let scrollbarWidth = this.zoomSlider.width;

    const horizontalScrollBar = parent.append('rect')
      .attr('class', 'HorizontalScrollBar')
      .attr('style', 'cursor:pointer')
      .attr('height', scrollBarThickness)
      .attr('rx', scrollBarThickness / 2)
      .attr('ry', scrollBarThickness / 2)
      .attr('opacity', 1)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      .attr('x', this.zoomSlider.x)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness);

    horizontalScrollBar.attr('width', scrollbarWidth);

    const leftThumb = parent.append('rect')
      .attr('style', 'cursor:pointer; stroke:#8F9299')
      .attr('width', thumbWidth)
      .attr('height', thumbWidth)
      .attr('rx', thumbWidth / 4)
      .attr('ry', thumbWidth / 4)
      .attr('fill', '#F8F8F8')
      .attr('x', this.zoomSlider.x)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness - thumbWidth / 4);

    const rightThumb = parent.append('rect')
      .attr('style', 'cursor:pointer; stroke:#8F9299')
      .attr('width', thumbWidth)
      .attr('height', thumbWidth)
      .attr('rx', thumbWidth / 4)
      .attr('ry', thumbWidth / 4)
      .attr('fill', '#F8F8F8')
      .attr('x', this.zoomSlider.x + scrollbarWidth - thumbWidth)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness - thumbWidth / 4);

    const horizontalDragBehaviour = d3.drag()
      .on('drag', (event) => {
        const currentSliderX = parseFloat(horizontalScrollBar.attr('x'));
        const currentLeftThumbX = parseFloat(leftThumb.attr('x'));
        const currentRightThumbX = parseFloat(rightThumb.attr('x'));
        const rightMargin = parseFloat(outerZoomSlider.attr('x')) + outerWidth;
        const leftMargin = parseFloat(outerZoomSlider.attr('x'));

        if (currentSliderX + event.dx > leftMargin && currentSliderX + scrollbarWidth + event.dx < rightMargin) {
          horizontalScrollBar.attr('x', currentSliderX + event.dx);
          leftThumb.attr('x', currentLeftThumbX + event.dx);
          rightThumb.attr('x', currentRightThumbX + event.dx);
          this.zoomSlider.x = currentSliderX + event.dx;
          this.leftIndex = Math.round(this.daysScale(currentLeftThumbX + event.dx));
          this.rightIndex = Math.round(this.daysScale(currentRightThumbX + event.dx - thumbWidth - one));
          const newMinDate = new Date(this.dates[this.leftIndex]);
          const newMaxDate = new Date(this.dates[this.rightIndex]);
          if (newMinDate.getTime() !== this.chartMinDate.getTime() && newMaxDate.getTime() !== this.chartMaxDate.getTime()) {
            this.chartMinDate = newMinDate;
            this.chartMaxDate = newMaxDate;
            this.visibleDates = this.rightIndex - this.leftIndex + 1;
            this.unitWidth = this.visibleDataWidth / this.visibleDates;
            this.buildChart();
          }
        }
      });

    const leftThumbDragBehaviour = d3.drag()
      .on('drag', (event) => {
        const currentX = parseFloat(leftThumb.attr('x'));
        const leftMargin = parseFloat(outerZoomSlider.attr('x'));
        const rightMargin = parseFloat(rightThumb.attr('x')) - thumbWidth - one;
        if (currentX + event.dx > leftMargin && currentX + event.dx < rightMargin) {
          leftThumb.attr('x', currentX + event.dx);
          this.leftIndex = Math.round(this.daysScale(currentX + event.dx));
          scrollbarWidth -= event.dx;
          let currentScrollX = parseFloat(horizontalScrollBar.attr('x'));
          currentScrollX += event.dx;
          horizontalScrollBar.attr('width', scrollbarWidth);
          horizontalScrollBar.attr('x', currentScrollX);
          this.zoomSlider.x = currentScrollX;
          this.zoomSlider.width = scrollbarWidth;

          const newMinDate = new Date(this.dates[this.leftIndex]);
          if (newMinDate.getTime() !== this.chartMinDate.getTime()) {
            this.chartMinDate = newMinDate;
            this.visibleDates = this.rightIndex - this.leftIndex + 1;
            this.unitWidth = this.visibleDataWidth / this.visibleDates;
            this.buildChart();
          }
        }
      });

    const rightThumbDragBehaviour = d3.drag()
      .on('drag', (event) => {
        const currentX = parseFloat(rightThumb.attr('x'));
        const rightMargin = parseFloat(outerZoomSlider.attr('x')) + outerWidth - thumbWidth;
        const leftMargin = parseFloat(leftThumb.attr('x')) + thumbWidth + one;
        if (currentX + event.dx > leftMargin && currentX + event.dx < rightMargin) {
          rightThumb.attr('x', currentX + event.dx);
          this.rightIndex = Math.round(this.daysScale(currentX + event.dx - thumbWidth - one));
          scrollbarWidth += event.dx;
          horizontalScrollBar.attr('width', scrollbarWidth);
          this.zoomSlider.width = scrollbarWidth;

          this.scaleFactor = scrollbarWidth / outerWidth;

          const newMaxDate = new Date(this.dates[this.rightIndex]);
          if (newMaxDate.getTime() !== this.chartMaxDate.getTime()) {
            this.chartMaxDate = newMaxDate;
            this.visibleDates = this.rightIndex - this.leftIndex + 1;
            this.unitWidth = this.visibleDataWidth / this.visibleDates;

            this.buildChart();
          }
        }
      });

    horizontalScrollBar.call(horizontalDragBehaviour);
    leftThumb.call(leftThumbDragBehaviour);
    rightThumb.call(rightThumbDragBehaviour);
  }

  // eslint-disable-next-line class-methods-use-this
  addThumbDragBehaviour(sliderWidth) {
    const thumbElement = d3.select('#thumb');
    const thumbWidth = parseFloat(thumbElement.attr('width'));
    const sliderLine = d3.select('#sliderLine');
    const sliderLineX = parseFloat(sliderLine.attr('x1'));
    let isDragStarted = false;
    let offset;
    const dragBehaviour = d3.drag()
      .on('drag', (event) => {
        if (isDragStarted) {
          offset = event.dx;
          const newPossition = parseFloat(thumbElement.attr('x')) + offset;
          if (newPossition + thumbWidth / 2 >= sliderLineX && newPossition + thumbWidth / 2 <= sliderLineX + sliderWidth) {
            thumbElement.attr('x', newPossition);
          }
        }
      })
      .on('start', () => {
        isDragStarted = true;
      })
      .on('end', () => {
        isDragStarted = false;
        const currentPossition = parseFloat(thumbElement.attr('x'));
        if (currentPossition + thumbWidth / 2 >= sliderLineX && currentPossition + thumbWidth / 2 < sliderLineX + (sliderWidth / 4)) {
          thumbElement.attr('x', sliderLineX - thumbWidth / 2);
          const viewMode = 'month';
          this.setOptions({ viewMode });
        } else if (currentPossition + thumbWidth / 2 >= (sliderLineX + sliderWidth / 4)
        && currentPossition + thumbWidth / 2 <= sliderLineX + ((sliderWidth * 3) / 4)) {
          thumbElement.attr('x', sliderLineX + sliderWidth / 2 - thumbWidth / 2);
          const viewMode = 'week';
          this.setOptions({ viewMode });
        } else if (currentPossition + thumbWidth / 2 > (sliderLineX + (sliderWidth * 3) / 4)
        && currentPossition + thumbWidth / 2 <= sliderLineX + sliderWidth) {
          thumbElement.attr('x', sliderLineX + sliderWidth - thumbWidth / 2);
          const viewMode = 'day';
          this.setOptions({ viewMode });
        }
      });
    thumbElement.call(dragBehaviour);
  }

  addRectangularSelection() {
    function drawRectangle(x, y, wi, hi) {
      return `M${[x, y]} l${[wi, 0]} l${[0, hi]} l${[-wi, 0]}z`;
    }

    const rectangle = d3.select('svg').append('path').attr('class', 'rectangle').attr('visibility', 'hidden');

    const startSelection = (start) => {
      rectangle.attr('d', drawRectangle(start[0], start[0], 0, 0)).attr('visibility', 'visible');
    };

    const moveSelection = (start, moved) => {
      rectangle.attr('d', drawRectangle(start[0], start[1], moved[0] - start[0], moved[1] - start[1]));
    };

    const endSelection = (start, end, event) => {
      rectangle.attr('visibility', 'hidden');

      // Ignore rectangular markings that were just a click.
      if (Math.abs(start[0] - end[0]) < 2 || Math.abs(start[1] - end[1]) < 2) {
        this.options.onClickCancelMerking(event);
        return;
      }

      const selectionBox = rectangle.node().getBoundingClientRect();
      const svgRadarMarkedCircles = d3.selectAll("[id^='bar']").filter((d) => (
        this.x.baseVal.value >= selectionBox.x &&
        this.y.baseVal.value >= selectionBox.y &&
        this.x.baseVal.value + this.width.baseVal.value <= selectionBox.x + selectionBox.width &&
        this.y.baseVal.value + this.height.baseVal.value <= selectionBox.y + selectionBox.height
      ));

      if (svgRadarMarkedCircles.size() === 0) {
        this.options.onClickCancelMerking(event);
        return;
      }

      svgRadarMarkedCircles.each(this.mark());
    };

    d3.select('svg').on('mousedown', (event) => {
      this.setRanderState(true);
      if (event.which === 3) {
        return;
      }
      const subject = d3.select(window);
      const start = d3.pointer(event);
      startSelection(start);
      subject
        .on('mousemove.rectangle', () => {
          moveSelection(start, d3.pointer(event, d3.select('svg').node()));
        })
        .on('mouseup.rectangle', () => {
          endSelection(start, d3.pointer(event, d3.select('svg').node()), event);
          subject.on('mousemove.rectangle', null).on('mouseup.rectangle', null);
        });
    });
    d3.select('svg').on('mouseup', () => {
      this.setRanderState(false);
    });
  }

  render() {
    const {
      data, start, end, options, chartMinDate, chartMaxDate, initialMinDate, initialMaxDate
    } = this;
    if (options.renderState.preventRender) {
      // Early return if the state currently disallows rendering.
      return;
    }
    if (this.tree) {
      this.dom.removeChild(this.tree);
    }
    if (options.maxTextWidth === undefined) {
      const font = getFont(options.styleOptions || {});
      const w = (v) => textWidth(v.text, font, 20);
      options.maxTextWidth = max(data.map(w), 0);
    }
    options.unitWidth = this.unitWidth;

    const props = {
      ...options, start, end, chartMinDate, chartMaxDate, initialMinDate, initialMaxDate
    };
    this.tree = render(<Gantt data={data} {...props} />);
    this.dom.appendChild(this.tree);

    this.addScrollBar(options.scrollBarThickness, options.headerHeight, options.rowHeight,
      options.barHeight, options.zoomSliderHeight, options.viewModeSliderHeight);
    this.addZoomSlider(options.scrollBarThickness, options.maxTextWidth, options.zoomSliderHeight, options.viewModeSliderHeight, options.maxWidth);
    // this.addThumbDragBehaviour(options.sliderWidth);
    this.addRectangularSelection();

    this.buildChart();
  }

  buildChart() {
    const dayHeader = d3.select('#DayHeader');
    dayHeader.selectAll('*').remove();
    const content = d3.select('#GanttContent');
    content.selectAll('*').remove();

    const dates = getDatesStrict(this.chartMinDate, this.chartMaxDate);
    const len = dates.length - 1;
    let x = this.options.maxTextWidth;
    const y0 = (this.options.rowHeight - this.options.barHeight) / 2;

    const headerY0 = this.options.viewModeSliderHeight + this.options.zoomSliderHeight + this.options.headerHeight / 2;

    const offsetY = this.options.viewModeSliderHeight + this.options.zoomSliderHeight + this.options.headerHeight;

    dayHeader.append('rect')
      .attr('x', x)
      .attr('y', 0)
      .attr('width', x + this.unitWidth * len)
      .attr('height', this.options.headerHeight + this.options.viewModeSliderHeight + this.options.zoomSliderHeight)
      .style('fill', 'white');

    for (let i = 0; i <= len; i++) {
      const currentDate = new Date(dates[i]);
      const day = currentDate.getDay();

      dayHeader.append('rect')
        .attr('x', x)
        .attr('y', headerY0)
        .attr('width', this.unitWidth)
        .attr('height', this.options.headerHeight / 2)
        .style('fill', () => (day === 0 || day === 6 ? 'rgb(247,249,255)' : 'white'))
        .classed('day-background', true);

      if (i !== 0) {
        dayHeader.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', headerY0)
          .attr('y2', headerY0 + this.options.headerHeight / 2)
          .style('stroke', '#DCDFE8')
          .style('stroke-width', '1px');
      }

      dayHeader.append('text')
        .attr('x', x + this.unitWidth / 2)
        .attr('y', this.options.viewModeSliderHeight + this.options.zoomSliderHeight + this.options.headerHeight * 0.75)
        .classed('header-text', true)
        .text(currentDate.getDate());

      content.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', offsetY)
        .attr('y2', this.data.length * this.options.rowHeight + offsetY)
        .style('stroke', '#DCDFE8')
        .style('stroke-width', '1px');

      x += this.unitWidth;
    }

    for (let i = 0; i < this.data.length; i++) {
      const currentBar = this.data[i];
      const newX = this.options.maxTextWidth + (getNumberOfDays(this.chartMinDate, currentBar.start) - 1) * this.unitWidth;
      let barWidth = (getNumberOfDays(currentBar.start, currentBar.end)) * this.unitWidth;

      if (barWidth === 0) {
        barWidth = this.unitWidth / 2;
      }

      const y = offsetY + y0 + i * this.options.rowHeight;

      // eslint-disable-next-line no-loop-func
      const onClickHandler = () => this.options.onClick(currentBar);
      const onMouseOverHandler = () => {
        const barElement = d3.select(`#bar${i}`);
        barElement
          .style('stroke-width', '1px');
        this.options.onMouseOver(currentBar);
      };
      const onMouseOutHandler = () => {
        const barElement = d3.select(`#bar${i}`);
        barElement
          .style('stroke-width', '0px');
        this.options.onMouseOut(currentBar);
      };

      this.buildGanttBar(content, i, newX, y, barWidth, this.options.barHeight, currentBar, onClickHandler, onMouseOverHandler, onMouseOutHandler);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  buildGanttBar(parent, index, x, y, width, height, currentBar, onClickHandler, onMouseOverHandler, onMouseOutHandler) {
    const barContainer = parent.append('g')
      .attr('key', index)
      .attr('class', 'gantt-bar');

    barContainer.append('text')
      .attr('x', x - 4)
      .attr('y', y + height / 2)
      .classed('bar-start-date', true)
      .text(formatDay(currentBar.start));

    barContainer.append('text')
      .attr('x', x + width + 4)
      .attr('y', y + height / 2)
      .classed('bar-end-date', true)
      .text(formatDay(currentBar.end));

    let backFill = '#9CFCC8';
    let frontFill = '#6ADB7F';
    if (currentBar.type === 'group') {
      backFill = '#9CFCC8';
      frontFill = '#6ADB7F';
    } else {
      backFill = '#9EB6FF';
      frontFill = '#6489FA';
    }

    barContainer.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .style('fill', backFill)
      .style('opacity', currentBar.isMarked ? '0.5' : '1')
      .style('stroke', currentBar.isMarked ? '#8F7769' : 'none')
      .classed('back-bar', true);

    barContainer.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width * currentBar.percent)
      .attr('height', height)
      .style('fill', frontFill)
      .style('opacity', currentBar.isMarked ? '0.5' : '1')
      .classed('front-bar', true);

    barContainer.append('rect')
      .attr('x', x - 3)
      .attr('y', y - 3)
      .attr('width', width + 6)
      .attr('height', height + 6)
      .attr('id', `bar${index}`)
      .style('fill', '#fff')
      .style('fill-opacity', '0')
      .style('stroke', '#333')
      .style('stroke-width', '0px')
      .on('click', onClickHandler)
      .on('mouseover', onMouseOverHandler)
      .on('mouseout', onMouseOutHandler)
      .classed('hover-bar', true);
  }
}
