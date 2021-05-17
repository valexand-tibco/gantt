import h from '../h';
import { getFont } from './styles';
import {
  textWidth
} from '../utils';

export default function ViewModeSlider({
  sliderWidth, styles, width, maxTextWidth
}) {
  const labels = [{
    title: 'Month',
    position: 0
  }, {
    title: 'Week',
    position: 0
  }, {
    title: 'Day',
    position: 0
  }];
  let offset;

  function updateThumbPosition(position) {
    const target = document.getElementById('thumb');
    target.setAttributeNS(null, 'x', position);
  }

  function getMousePosition(evt) {
    const CTM = evt.target.getScreenCTM();
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function lineClick(evt) {
    offset = getMousePosition(evt);
    if (offset.x >= 0 && offset.x < (sliderWidth / 4)) {
      updateThumbPosition(0);
    } else if (offset.x >= (sliderWidth / 4) && offset.x <= ((sliderWidth * 3) / 4)) {
      updateThumbPosition(sliderWidth / 2);
    } else if (offset.x > ((sliderWidth * 3) / 4) && offset.x <= sliderWidth) {
      updateThumbPosition(sliderWidth);
    }
  }

  const font = getFont(styles || {});
  const monthWidth = textWidth(labels[0].title, font, 0);
  const weekWidth = textWidth(labels[1].title, font, 0);
  const dayWidth = textWidth(labels[2].title, font, 0);
  const thumbWidth = 10;
  const thumbHeight = 12;

  const lineX1 = maxTextWidth + (width - maxTextWidth) / 2 - sliderWidth / 2;
  const lineX2 = maxTextWidth + (width - maxTextWidth) / 2 + sliderWidth / 2;

  labels[0].position = lineX1 - monthWidth / 2;
  labels[1].position = maxTextWidth + (width - maxTextWidth) / 2 - weekWidth / 2;
  labels[2].position = lineX2 - dayWidth / 2;

  const labelY = 10;
  const lineY = labelY + 20;
  const thumbY = lineY - 3;

  return (
    <g>
      {labels.map((v, i) => (
        <text
          key={i}
          y={labelY}
          style={styles.label}
          x={labels[i].position}
        >
          {v.title}
        </text>
      ))}
      <line
        x1={lineX1}
        x2={lineX2}
        y1={lineY}
        y2={lineY}
        style={styles.line}
      />
      <line
        id="sliderLine"
        x1={lineX1}
        x2={lineX2}
        y1={lineY}
        y2={lineY}
        style={styles.sliderLine}
        onClick={(evt) => lineClick(evt)}
      />
      <svg
        id="thumb"
        y={thumbY}
        x={maxTextWidth + (width - maxTextWidth) / 2 - thumbWidth / 2}
        width={thumbWidth}
        height={thumbHeight}
        style={styles.thumb}
      >
        <g>
          <g fill="currentColor">
            <path d="M7,0H2C0.895,0,0,0.923,0,2.062v4.156c0,0.709,0.228,1.037,0.876,1.705L4.5,12l3.624-4.078
          C8.772,7.255,9,6.926,9,6.218V2.062C9,0.923,8.105,0,7,0z"
            />
          </g>
          <g fill="currentColor">
            <path d="M7,1H2C1.449,1,1,1.477,1,2.062V6.22c0,0.313,0,0.397,0.594,1.009L4.5,10.5l2.877-3.239
          C8,6.617,8,6.533,8,6.22V2.062C8,1.477,7.551,1,7,1z"
            />
          </g>
        </g>
      </svg>
    </g>
  );
}
