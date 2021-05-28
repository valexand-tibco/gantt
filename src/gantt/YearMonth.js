import h from '../h';
import { formatMonth } from '../utils';

export default function YearMonth({
  styles, dates, unit, offsetY, minTime, maxTime, maxTextWidth, viewModeSliderHeight, zoomSliderHeight
}) {
  const months = dates.filter((v) => (new Date(v)).getDate() === 1);

  months.unshift(minTime);
  months.push(maxTime);

  const ticks = [];
  const x0 = maxTextWidth;
  const y1 = viewModeSliderHeight + zoomSliderHeight;
  // const y2 = height;
  const y2 = viewModeSliderHeight + zoomSliderHeight + offsetY / 2;
  const len = months.length - 1;
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      // y1 = viewModeSliderHeight + offsetY / 2;
    }
    const cur = new Date(months[i]);
    const str = formatMonth(cur);
    const x = x0 + (months[i] - minTime) / unit;
    const t = (months[i + 1] - months[i]) / unit;
    ticks.push((
      <g>
        <line x1={x} x2={x} y1={y1} y2={y2} style={styles.line} />
        {t > 50 ? <text x={x + t / 2} y={viewModeSliderHeight + zoomSliderHeight + offsetY * 0.25} style={styles.text3}>{str}</text> : null}
      </g>
    ));
  }
  return (
    <g>
      {ticks}
    </g>
  );
}
