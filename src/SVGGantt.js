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

    // Move all children of scrollgroup
    // to a content sub-group
    // I'm doing this because otherwise clip path gets glitchy
    const contentItems = root.selectAll('*');
    const content = root.append('g')
      .attr('transform', `translate(${rootBBox.x},${rootBBox.y})`);
    const contenItemsNodes = contentItems.nodes();
    for (let i = 0; i < contenItemsNodes.length; i++) {
      content.node().appendChild(contenItemsNodes[i]);
    }

    // Add a clip path and a rect within it
    // everything inside the scrollgroup group that does not overlap this rectangle
    // will be hidden
    const clipRect = parent.append('clipPath').attr('id', 'scrollbox-clip-path').append('rect');
    clipRect
      .attr('x', rootBBox.x)
      .attr('y', rootBBox.y)
      .attr('width', rootBBox.width)
      .attr('height', rootBBox.height);

    // Insert an invisible rect
    // that will catch scroll events
    // as group element itself can't do it.
    root
      .insert('rect', 'g')
      .attr('x', rootBBox.x)
      .attr('y', rootBBox.y)
      .attr('width', rootBBox.width)
      .attr('height', rootBBox.height)
      .attr('opacity', 0);

    // Position the scroll indicator
    const scrollBar = parent.append('rect')
      .attr('width', scrollBarWidth)
      .attr('rx', scrollBarWidth / 2)
      .attr('ry', scrollBarWidth / 2)
      .attr('opacity', 0)
      .attr('fill', 'rgba(0, 0, 0, 0.3)')
      .attr('transform', `translate(${rootBBox.x + rootBBox.width},${rootBBox.y})`);

    // Calculate maximum scrollable amount
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

    // Set up scroll events
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

    // Set up scrollbar drag events
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
        } else if (currentPossition + thumbWidth / 2 >= (sliderLineX + sliderWidth / 4)
        && currentPossition + thumbWidth / 2 <= sliderLineX + ((sliderWidth * 3) / 4)) {
          thumbElement.attr('x', sliderLineX + sliderWidth / 2 - thumbWidth / 2);
        } else if (currentPossition + thumbWidth / 2 > (sliderLineX + (sliderWidth * 3) / 4)
        && currentPossition + thumbWidth / 2 <= sliderLineX + sliderWidth) {
          thumbElement.attr('x', sliderLineX + sliderWidth - thumbWidth / 2);
        }
      });
    thumbElement.call(dragBehaviour);
  }
  render() {
    const {
      data, start, end, options
    } = this;
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
  }
}
