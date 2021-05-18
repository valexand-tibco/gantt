import h from '../h';

export default function CurrentLine({
  styles, unit, height, minTime, maxTextWidth, current, offsetY, viewModeSliderHeight, onMouseOver, onMouseOut
}) {
  const x0 = maxTextWidth;
  const cur = x0 + (current - minTime) / unit;
  const mouseOverHandler = () => onMouseOver();
  const mouseOutHandler = () => onMouseOut();
  return (
    <g>
      {current > minTime ? ([
        <line x1={cur} x2={cur} y1={viewModeSliderHeight + offsetY / 2} y2={height} style={styles.cline} />,
        <line
          x1={cur}
          x2={cur}
          y1={viewModeSliderHeight + offsetY / 2}
          y2={height}
          style={styles.thickLine}
          onMouseOver={mouseOverHandler}
          onMouseOut={mouseOutHandler}
        />
      ]) : null}
    </g>
  );
}
