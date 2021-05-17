import h from '../h';

export default function CurrentLine({
  styles, unit, height, minTime, maxTextWidth, current, offsetY, viewModeSliderHeight
}) {
  const x0 = maxTextWidth;
  const cur = x0 + (current - minTime) / unit;
  return (
    <g>
      {current > minTime ? (
        <line x1={cur} x2={cur} y1={viewModeSliderHeight + offsetY / 2} y2={height} style={styles.cline} />
      ) : null}
    </g>
  );
}
