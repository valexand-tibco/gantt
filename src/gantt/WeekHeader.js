import h from '../h';
import { getDates, DAY } from '../utils';
import YearMonth from './YearMonth';

export default function WeekHeader({
  styles, unit, minTime, maxTime, offsetY, maxTextWidth, width, height, viewModeSliderHeight
}) {
  const dates = getDates(minTime, maxTime);
  const weeks = dates.filter((v) => (new Date(v)).getDay() === 0);
  weeks.push(maxTime);
  const ticks = [];
  const x0 = maxTextWidth;
  const y0 = viewModeSliderHeight + offsetY / 2;
  const RH = height - offsetY / 2 - viewModeSliderHeight;
  const d = DAY / unit;
  const len = weeks.length - 1;
  let weekWidth = d * 7;
  for (let i = 0; i < len; i++) {
    const cur = new Date(weeks[i]);
    const x = x0 + (weeks[i] - minTime) / unit;
    const curDay = cur.getDate();
    const weekStyle = i % 2 === 0 ? styles.weekEven : styles.weekOdd;
    if (x + weekWidth > width) {
      weekWidth = width - x;
    }
    ticks.push((
      <g>
        <rect x={x} y={y0} width={weekWidth} height={RH} style={weekStyle} />
        <text x={x + 3} y={viewModeSliderHeight + offsetY * 0.75} style={styles.text2}>{curDay}</text>
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
