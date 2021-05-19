import h from '../h';
import { getDates, DAY } from '../utils';
import YearMonth from './YearMonth';

export default function DayHeader({
  styles, unit, minTime, maxTime, height, offsetY, maxTextWidth, width, viewModeSliderHeight
}) {
  const dates = getDates(minTime, maxTime);
  const ticks = [];
  const x0 = maxTextWidth;
  const y0 = viewModeSliderHeight + offsetY / 2;
  const RH = height - offsetY / 2 - viewModeSliderHeight;
  const len = dates.length - 1;
  let dayWidth = DAY / unit;
  for (let i = 0; i < len; i++) {
    const cur = new Date(dates[i]);
    const day = cur.getDay();
    const x = x0 + (dates[i] - minTime) / unit;
    if (x + dayWidth > width) {
      dayWidth = width - x;
    }
    ticks.push((
      <g>
        {day === 0 || day === 6 ? (
          <rect x={x} y={y0} width={dayWidth} height={RH} style={styles.weekEven} />
        ) : null}
        {i !== 0 ? (
          <line x1={x} x2={x} y1={y0} y2={height} style={styles.line} />
        ) : null}
        <text x={x + dayWidth / 2} y={viewModeSliderHeight + offsetY * 0.75} style={styles.text3}>{cur.getDate()}</text>
      </g>
    ));
  }
  return (
    <g>
      {ticks}
      <YearMonth
        styles={styles}
        unit={unit}
        dates={dates}
        offsetY={offsetY}
        minTime={minTime}
        maxTime={maxTime}
        maxTextWidth={maxTextWidth}
        height={height}
        width={width}
        viewModeSliderHeight={viewModeSliderHeight}
      />
    </g>
  );
}
