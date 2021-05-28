/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import h from './h';
import Gantt from './gantt';
import render from './render/svg';
import { getFont } from './gantt/styles';
import {
  minDate, maxDate, textWidth, max, getTranslation
} from './utils';

export default class SVGGantt {
  constructor(element, data, options = {}) {
    this.dom = typeof element === 'string' ? document.querySelector(element) : element;
    this.format(data);
    this.options = options;
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
  addScrollBar(scrollBarThickness, headerHeight, rowHeight, barHeight, maxTextWidth, zoomSliderHeight, viewModeSliderHeight, width, styleOptions) {
    let verticalScrollDistance = 0;
    let horizontalScrollDistance = 0;

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
      // .attr('transform', `translate(${rootBBox.x},${rootBBox.y})`);
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
      // .attr('transform', `translate(${rootBBox.x + rootBBox.width},${rootBBox.y})`);
      .attr('transform', `translate(${rootBBox.x + rootBBox.width},${rootBBox.y + headerHeight})`);

    const outerZoomSlider = parent.append('rect')
      .attr('width', width)
      .attr('x', '0')
      .attr('y', viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness)
      .attr('height', scrollBarThickness)
      .attr('rx', scrollBarThickness / 4)
      .attr('ry', scrollBarThickness / 4)
      .attr('fill', '#F0F1F2');

    const horizontalScrollBar = parent.append('rect')
      .attr('style', 'cursor:pointer')
      .attr('height', scrollBarThickness)
      .attr('rx', scrollBarThickness / 2)
      .attr('ry', scrollBarThickness / 2)
      .attr('opacity', 0)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      // .attr('transform', `translate(${rootBBox.x},${rootBBox.y + rootBBox.height})`);
      .attr('transform', `translate(${0},${viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness})`);

    const thumbWidth = 16;

    const rightThumb = parent.append('rect')
      .attr('style', 'cursor:pointer; stroke:#8F9299')
      .attr('width', thumbWidth)
      .attr('height', thumbWidth)
      .attr('rx', thumbWidth / 4)
      .attr('ry', thumbWidth / 4)
      .attr('fill', '#F8F8F8')
      .attr('transform', `translate(${0},${viewModeSliderHeight + zoomSliderHeight / 2 - scrollBarThickness - thumbWidth / 4})`);

    const contentBBox = content.node().getBBox();
    const absoluteContentWidth = contentBBox.x + contentBBox.width;
    const absoluteContentHeight = contentBBox.y + contentBBox.height;

    // const scrollbarHeight = rootBBox.height * rootBBox.height / absoluteContentHeight;
    const scrollbarHeight = rootBBox.height * rootBBox.height / absoluteContentHeight - headerHeight;
    // const scrollbarWidth = rootBBox.width * rootBBox.width / absoluteContentWidth;
    const scrollbarWidth = rootBBox.width * rootBBox.width / absoluteContentWidth;
    verticalScrollBar.attr('height', scrollbarHeight);
    horizontalScrollBar.attr('width', scrollbarWidth);

    // const maxVerticalScroll = Math.max(absoluteContentHeight - rootBBox.height + (rowHeight - barHeight) / 2, 0);
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

    function updateHorizontalScrollPosition(diff) {
      horizontalScrollDistance += diff;
      horizontalScrollDistance = Math.max(0, horizontalScrollDistance);
      horizontalScrollDistance = Math.min(maxHorizontalScroll, horizontalScrollDistance);

      const yValue = getTranslation(content.attr('transform'))[1];

      // content.attr('transform', `translate(${rootBBox.x - horizontalScrollDistance},${yValue})`);
      content.attr('transform', `translate(${-horizontalScrollDistance},${yValue})`);
      // header.attr('transform', `translate(${rootBBox.x - horizontalScrollDistance},${0})`);
      header.attr('transform', `translate(${-horizontalScrollDistance},${0})`);
      // const scrollBarPosition = horizontalScrollDistance / maxHorizontalScroll * (rootBBox.width - scrollbarWidth);
      const scrollBarPosition = horizontalScrollDistance / maxHorizontalScroll * (rootBBox.width - scrollbarWidth);
      if (!Number.isNaN(scrollBarPosition)) horizontalScrollBar.attr('x', scrollBarPosition);
    }

    root.on('wheel', () => {
      // eslint-disable-next-line no-restricted-globals
      updateVerticalScrollPosition(event.deltaY);
    });

    let isVerticalDragging = false;
    let isHorizontalDragging = false;
    parent.on('mouseenter', () => {
      verticalScrollBar.attr('opacity', 1);
      horizontalScrollBar.attr('opacity', 1);
    });
    parent.on('mouseleave', () => {
      if (!isVerticalDragging && !isHorizontalDragging) {
        verticalScrollBar.attr('opacity', 0);
        horizontalScrollBar.attr('opacity', 0);
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

    const horizontalDragBehaviour = d3.drag()
      .on('drag', (event) => {
        updateHorizontalScrollPosition(event.dx * maxHorizontalScroll / (rootBBox.width - scrollbarWidth));
      })
      .on('start', (event) => {
        isHorizontalDragging = true;
      })
      .on('end', (event) => {
        isHorizontalDragging = false;
      });

    verticalScrollBar.call(verticalDragBehaviour);
    horizontalScrollBar.call(horizontalDragBehaviour);
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
      data, start, end, options
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
    const props = { ...options, start, end };
    this.tree = render(<Gantt data={data} {...props} />);
    this.dom.appendChild(this.tree);
    this.addScrollBar(options.scrollBarThickness, options.headerHeight, options.rowHeight, options.barHeight, options.maxTextWidth,
      options.zoomSliderHeight, options.viewModeSliderHeight, options.maxWidth, options.styleOptions);
    this.addThumbDragBehaviour(options.sliderWidth);
    this.addRectangularSelection();
  }
}
