import h from '../h';

export default function Year({
  styles, months, unit, offsetY, minTime, maxTime, maxTextWidth, width, viewModeSliderHeight, height
}) {
  const years = months.filter((v) => (new Date(v)).getMonth() === 0);

  years.unshift(minTime);
  years.push(maxTime);

  const ticks = [];
  const x0 = maxTextWidth;
  let y1 = viewModeSliderHeight;
  const y2 = height;
  const len = years.length - 1;
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      y1 = viewModeSliderHeight + offsetY / 2;
    }
    const cur = new Date(years[i]);
    const x = x0 + (years[i] - minTime) / unit;
    const t = (years[i + 1] - years[i]) / unit;
    ticks.push((
      <g>
        <line x1={x} x2={x} y1={y1} y2={y2} style={styles.line} />
        {t > 35 ? (
          <text x={x + t / 2} y={viewModeSliderHeight + offsetY * 0.25} style={styles.text3}>{cur.getFullYear()}</text>
        ) : null}
      </g>
    ));
  }
  return (
    <g>
      {ticks}
      <line x1={x0} x2={width} y1={viewModeSliderHeight + offsetY} y2={viewModeSliderHeight + offsetY} style={styles.line} />
      <line x1={x0} x2={width} y1={y2} y2={y2} style={styles.line} />
      <line x1={width} x2={width} y1={viewModeSliderHeight + offsetY / 2} y2={y2} style={styles.line} />
    </g>
  );
}
