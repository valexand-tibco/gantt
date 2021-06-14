/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import h from './h';
import Gantt from './gantt';
import render from './render/svg';
import { getFont } from './gantt/styles';
import {
  minDate, maxDate, textWidth, max, getTranslation, DAY, getDatesStrict
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
    const days = (chartMaxDate - chartMinDate) / (1000 * 3600 * 24) + 1;

    this.scaleFactor = 1;
    this.totalDays = days;

    const visibleDataWidth = this.options.maxWidth - this.options.maxTextWidth;
    const dataWidth = visibleDataWidth / this.scaleFactor;
    this.unitWidth = dataWidth / days;
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
  addScrollBar(scrollBarThickness, headerHeight, rowHeight, barHeight, maxTextWidth, zoomSliderHeight,
    viewModeSliderHeight, width, styleOptions, data, start, end) {
    let verticalScrollDistance = 0;

    const styles = styleOptions;

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
    const absoluteContentWidth = contentBBox.x + contentBBox.width;
    const absoluteContentHeight = contentBBox.y + contentBBox.height;

    const scrollbarHeight = rootBBox.height * rootBBox.height / absoluteContentHeight - headerHeight;
    verticalScrollBar.attr('height', scrollbarHeight);

    const maxVerticalScroll = Math.max(absoluteContentHeight - rootBBox.height + (rowHeight - barHeight) / 2 - viewModeSliderHeight - zoomSliderHeight - 8, 0);
    const maxHorizontalScroll = Math.max(absoluteContentWidth - rootBBox.width, 0);

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
  addZoomSlider(scrollBarThickness, headerHeight, rowHeight, barHeight, maxTextWidth, zoomSliderHeight,
    viewModeSliderHeight, width, styleOptions, data, start, end) {
    const horizontalScrollDistance = 0;
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

    const horizontalScrollBar = parent.append('rect')
      .attr('class', 'HorizontalScrollBar')
      .attr('style', 'cursor:pointer')
      .attr('height', scrollBarThickness)
      .attr('rx', scrollBarThickness / 2)
      .attr('ry', scrollBarThickness / 2)
      .attr('opacity', 1)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      // .attr('transform', `translate(${rootBBox.x},${rootBBox.y + rootBBox.height})`);
      .attr('x', horizontalXOffset)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness);
      // .attr('transform', `translate(${horizontalXOffset},${viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness})`);

    const thumbWidth = 16;

    let scrollbarWidth = (width - horizontalXOffset) / (1 / this.scaleFactor);
    horizontalScrollBar.attr('width', scrollbarWidth);

    const leftThumb = parent.append('rect')
      .attr('style', 'cursor:pointer; stroke:#8F9299')
      .attr('width', thumbWidth)
      .attr('height', thumbWidth)
      .attr('rx', thumbWidth / 4)
      .attr('ry', thumbWidth / 4)
      .attr('fill', '#F8F8F8')
      .attr('x', horizontalXOffset)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness - thumbWidth / 4);

    const rightThumb = parent.append('rect')
      .attr('style', 'cursor:pointer; stroke:#8F9299')
      .attr('width', thumbWidth)
      .attr('height', thumbWidth)
      .attr('rx', thumbWidth / 4)
      .attr('ry', thumbWidth / 4)
      .attr('fill', '#F8F8F8')
      .attr('x', horizontalXOffset + scrollbarWidth - thumbWidth)
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness - thumbWidth / 4);

    let isHorizontalDragging = false;

    const outerWidth = parseFloat(outerZoomSlider.attr('width'));
    const outerX = parseFloat(outerZoomSlider.attr('x'));

    const visibleDataWidth = width - maxTextWidth;

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

          const oneDayWidth = outerWidth / this.totalDays;
          const daysToModify = Math.floor((currentSliderX + event.dx - outerX) / oneDayWidth);
          const newMinDate = new Date(this.initialMinDate);
          const newMaxDate = new Date(this.initialMaxDate);
          newMinDate.setDate(newMinDate.getDate() + daysToModify);
          newMaxDate.setDate(newMaxDate.getDate() + daysToModify);
          if (newMinDate.getTime() !== this.chartMaxDate.getTime()) {
            this.chartMinDate = newMinDate;
            this.chartMaxDate = newMaxDate;
            this.update();
          }
        }

        // const scrollBarPosition = horizontalScrollDistance / maxHorizontalScroll * (rootBBox.width - scrollbarWidth);
        // if (!Number.isNaN(scrollBarPosition)) {
        //   const horizontalFactor = horizontalXOffset * scrollBarPosition / (width - scrollbarWidth);
        //   horizontalScrollBar.attr('x', horizontalXOffset + scrollBarPosition - horizontalFactor);
        //   leftThumb.attr('x', horizontalXOffset + scrollBarPosition - horizontalFactor);
        //   rightThumb.attr('x', horizontalXOffset + scrollBarPosition + scrollbarWidth - thumbWidth - horizontalFactor);
        // }
      })
      .on('start', (event) => {
        isHorizontalDragging = true;
      })
      .on('end', (event) => {
        isHorizontalDragging = false;
      });

    const leftThumbDragBehaviour = d3.drag()
      .on('drag', (event) => {
        const currentX = parseFloat(leftThumb.attr('x'));
        const leftMargin = parseFloat(outerZoomSlider.attr('x'));
        const rightMargin = parseFloat(rightThumb.attr('x')) - thumbWidth;
        if (currentX + event.dx > leftMargin && currentX + event.dx < rightMargin) {
          leftThumb.attr('x', currentX + event.dx);
          scrollbarWidth -= event.dx;
          let curretnScrollX = parseFloat(horizontalScrollBar.attr('x'));
          curretnScrollX += event.dx;
          horizontalScrollBar.attr('width', scrollbarWidth);
          horizontalScrollBar.attr('x', curretnScrollX);

          const oneDayWidth = outerWidth / this.totalDays;
          const daysToModify = Math.floor((outerWidth - scrollbarWidth) / oneDayWidth);
          const newMinDate = new Date(this.initialMinDate);
          newMinDate.setDate(newMinDate.getDate() + daysToModify);
          if (newMinDate.getTime() !== this.chartMinDate.getTime()) {
            const days = this.totalDays - daysToModify;

            this.chartMinDate = newMinDate;
            this.unitWidth = visibleDataWidth / days;

            this.update();
          }
        }
      })
      .on('start', (event) => {
      })
      .on('end', (event) => {
      });

    const rightThumbDragBehaviour = d3.drag()
      .on('drag', (event) => {
        const currentX = parseFloat(rightThumb.attr('x'));
        const rightMargin = parseFloat(outerZoomSlider.attr('x')) + outerWidth - thumbWidth;
        const leftMargin = parseFloat(leftThumb.attr('x')) + thumbWidth;
        if (currentX + event.dx > leftMargin && currentX + event.dx < rightMargin) {
          rightThumb.attr('x', currentX + event.dx);
          scrollbarWidth += event.dx;
          horizontalScrollBar.attr('width', scrollbarWidth);

          this.scaleFactor = scrollbarWidth / outerWidth;

          const oneDayWidth = outerWidth / this.totalDays;
          const daysToModify = Math.floor((outerWidth - scrollbarWidth) / oneDayWidth);
          const newMaxDate = new Date(this.initialMaxDate);
          newMaxDate.setDate(newMaxDate.getDate() - daysToModify);
          if (newMaxDate.getTime() !== this.chartMaxDate.getTime()) {
            const days = this.totalDays - daysToModify;

            this.chartMaxDate = newMaxDate;
            this.unitWidth = visibleDataWidth / days;

            this.update();
          }
        }
      })
      .on('start', (event) => {
      })
      .on('end', (event) => {

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

    this.addScrollBar(options.scrollBarThickness, options.headerHeight, options.rowHeight, options.barHeight, options.maxTextWidth,
      options.zoomSliderHeight, options.viewModeSliderHeight, options.maxWidth, options.styleOptions, data, start, end);
    this.addZoomSlider(options.scrollBarThickness, options.headerHeight, options.rowHeight, options.barHeight, options.maxTextWidth,
      options.zoomSliderHeight, options.viewModeSliderHeight, options.maxWidth, options.styleOptions, data, start, end);
    this.addThumbDragBehaviour(options.sliderWidth);
    this.addRectangularSelection();

    const dayHeader = d3.select('#DayHeader');
    this.dayTexts = dayHeader.selectAll('.day-text');
    this.dayLines = dayHeader.selectAll('.day-lines');
    this.weekendDays = dayHeader.selectAll('.weekend-days');

    const scrollgroup = d3.select('#scrollgroup');
    this.chartLines = scrollgroup.selectAll('.chart-line');
    this.chartWeekendDays = scrollgroup.selectAll('.chart-weekend-day');
    this.backBars = scrollgroup.selectAll('.back-bar');
    this.frontBars = scrollgroup.selectAll('.front-bar');
    this.barStartDate = scrollgroup.selectAll('.bar-start-date');
    this.barEndDate = scrollgroup.selectAll('.bar-end-date');
    this.barHover = scrollgroup.selectAll('.bar-hover');
  }

  // eslint-disable-next-line class-methods-use-this
  update() {
    const dates = getDatesStrict(this.initialMinDate, this.initialMaxDate);
    const leftOffset = (this.chartMinDate - this.initialMinDate) / DAY * this.unitWidth;
    const len = dates.length - 1;
    let x = this.options.maxTextWidth - leftOffset;
    let j = 0;
    for (let i = 0; i <= len; i++) {
      const cur = new Date(dates[i]);
      const day = cur.getDay();
      d3.select(this.dayTexts.nodes()[i]).attr('x', x + this.unitWidth / 2);
      if (day === 0 || day === 6) {
        d3.select(this.weekendDays.nodes()[j]).attr('x', x);
        d3.select(this.weekendDays.nodes()[j]).attr('width', this.unitWidth);
        d3.select(this.chartWeekendDays.nodes()[j]).attr('x', x);
        d3.select(this.chartWeekendDays.nodes()[j]).attr('width', this.unitWidth);
        j += 1;
      }
      x += this.unitWidth;
      d3.select(this.dayLines.nodes()[i]).attr('x1', x);
      d3.select(this.dayLines.nodes()[i]).attr('x2', x);
      d3.select(this.chartLines.nodes()[i]).attr('x1', x);
      d3.select(this.chartLines.nodes()[i]).attr('x2', x);
    }

    for (let i = 0; i < this.data.length; i++) {
      const currentBar = this.data[i];
      const newX = this.options.maxTextWidth + (currentBar.start - this.chartMinDate) / DAY * this.unitWidth;
      let barWidth = (currentBar.end - currentBar.start) / DAY * this.unitWidth;

      if (barWidth === 0) {
        barWidth = this.unitWidth / 2;
      }

      d3.select(this.backBars.nodes()[i]).attr('x', newX);
      d3.select(this.backBars.nodes()[i]).attr('width', barWidth);

      d3.select(this.frontBars.nodes()[i]).attr('x', newX);
      d3.select(this.frontBars.nodes()[i]).attr('width', barWidth * currentBar.percent);

      d3.select(this.barHover.nodes()[i]).attr('x', newX - 3);
      d3.select(this.barHover.nodes()[i]).attr('width', barWidth + 6);

      d3.select(this.barStartDate.nodes()[i]).attr('x', newX - 4);
      d3.select(this.barEndDate.nodes()[i]).attr('x', newX + barWidth + 4);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  updateChart() {
    const content = d3.select('#GanttContent');
    content.selectAll('*').remove();

    const dates = getDatesStrict(this.chartMinDate, this.chartMaxDate);
    const len = dates.length - 1;
    let x = this.options.maxTextWidth;

    const offsetY = this.options.viewModeSliderHeight + this.options.zoomSliderHeight + this.options.headerHeight;

    for (let i = 0; i <= len; i++) {
      const cur = new Date(dates[i]);
      const day = cur.getDay();

      content.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', offsetY)
        .attr('y2', this.data.length * this.options.rowHeight + offsetY)
        .style('stroke', '#DCDFE8')
        .style('stroke-width', '1px');

      x += this.unitWidth;

      // d3.select(this.chartLines.nodes()[i]).attr('x1', x);
      // d3.select(this.chartLines.nodes()[i]).attr('x2', x);
    }
  }
}
