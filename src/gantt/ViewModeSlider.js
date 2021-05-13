import h from '../h';

export default function ViewModeSlider({
  sliderWidth, styles, height
}) {
  const labels = ['Month', 'Week', 'Day'];
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

  return (
    <g>
      {labels.map((v, i) => (
        <text
          key={i}
          y={height - 40}
          style={styles.text3}
          x={(sliderWidth * i) / 2}
        >
          {v}
        </text>
      ))}
      <line x1={0} x2={sliderWidth} y1={height - 20} y2={height - 20} style={styles.line} />
      <line
        x1={0}
        x2={sliderWidth}
        y1={height - 20}
        y2={height - 20}
        style={styles.sliderLine}
        onClick={(evt) => lineClick(evt)}
      />
      <svg
        id="thumb"
        y={height - 24}
        x={sliderWidth / 2}
        width={9}
        height={12}
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
