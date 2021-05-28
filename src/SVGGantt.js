/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import h from './h';
import Gantt from './gantt';
import render from './render/svg';
import { getFont } from './gantt/styles';
import {
  minDate, maxDate, textWidth, max
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
  addScrollBar(scrollBarWidth, offsetY, rowHeight, barHeight) {
    let scrollDistance = 0;

    const root = d3.select('#scrollgroup')
      .attr('clip-path', 'url(#scrollbox-clip-path)');
    const parent = d3.select(root.node().parentNode);

    const rootBBox = {
      x: parseFloat(root.attr('x')),
      y: parseFloat(root.attr('y')),
      width: parseFloat(root.attr('width')),
      height: parseFloat(root.attr('height'))
    };

    const contentItems = root.selectAll('*');
    const content = root.append('g')
      .attr('transform', `translate(${rootBBox.x},${rootBBox.y})`);
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

    const scrollBar = parent.append('rect')
      .attr('width', scrollBarWidth)
      .attr('rx', scrollBarWidth / 2)
      .attr('ry', scrollBarWidth / 2)
      .attr('opacity', 0)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      .attr('transform', `translate(${rootBBox.x + rootBBox.width},${rootBBox.y})`);

    const contentBBox = content.node().getBBox();
    const absoluteContentHeight = contentBBox.y + contentBBox.height;

    const scrollbarHeight = rootBBox.height * rootBBox.height / absoluteContentHeight;
    scrollBar.attr('height', scrollbarHeight);

    const maxScroll = Math.max(absoluteContentHeight - rootBBox.height + (rowHeight - barHeight) / 2, 0);

    function updateScrollPosition(diff) {
      scrollDistance += diff;
      scrollDistance = Math.max(0, scrollDistance);
      scrollDistance = Math.min(maxScroll, scrollDistance);

      content.attr('transform', `translate(${rootBBox.x},${rootBBox.y - scrollDistance})`);
      const scrollBarPosition = scrollDistance / maxScroll * (rootBBox.height - scrollbarHeight);
      if (!Number.isNaN(scrollBarPosition)) scrollBar.attr('y', scrollBarPosition);
    }

    root.on('wheel', () => {
      // eslint-disable-next-line no-restricted-globals
      updateScrollPosition(event.deltaY);
    });

    let isDragging = false;
    parent.on('mouseenter', () => {
      scrollBar.attr('opacity', 1);
    });
    parent.on('mouseleave', () => {
      if (!isDragging) {
        scrollBar.attr('opacity', 0);
      }
    });

    const dragBehaviour = d3.drag()
      .on('drag', (event) => {
        updateScrollPosition(event.dy * maxScroll / (rootBBox.height - scrollbarHeight));
      })
      .on('start', (event) => {
        isDragging = true;
      })
      .on('end', (event) => {
        isDragging = false;
      });
    scrollBar.call(dragBehaviour);
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
    this.addScrollBar(options.scrollBarWidth, options.offsetY, options.rowHeight, options.barHeight);
    this.addThumbDragBehaviour(options.sliderWidth);
    this.addRectangularSelection();
  }
}
