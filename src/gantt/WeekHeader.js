import h from '../h';
import { getDates, addDays, DAY } from '../utils';
import YearMonth from './YearMonth';

export default function WeekHeader({
  styles, unit, minTime, maxTime, width, height, offsetY, maxTextWidth, thickWidth
}) {
  const dates = getDates(minTime, maxTime);
  const weeks = dates.filter((v) => (new Date(v)).getDay() === 0);
  weeks.push(maxTime);
  const ticks = [];
  const x0 = maxTextWidth;
  const y0 = offsetY / 2;
  const RH = height - y0;
  const d = DAY / unit;
  const len = weeks.length - 1;
  for (let i = 0; i < len; i++) {
    const cur = new Date(weeks[i]);
    const x = x0 + (weeks[i] - minTime) / unit;
    const curDay = cur.getDate();
    const prevDay = addDays(cur, -1).getDate();
    const weekStyle = i % 2 === 0 ? styles.weekEven : styles.weekOdd;
    ticks.push((
      <g>
        <rect x={x} y={y0} width={d * 7} height={RH} style={weekStyle} />
        <text x={x + 3} y={offsetY * 0.75} style={styles.text2}>{curDay}</text>
        {x - x0 > 28 ? (
          <text x={x - 3} y={offsetY * 0.75} style={styles.text1}>{prevDay}</text>
        ) : null}
      </g>
    ));
  }
  const lineX0 = thickWidth / 2;
  return (
    <g>
      <YearMonth
        styles={styles}
        unit={unit}
        dates={dates}
        offsetY={offsetY}
        minTime={minTime}
        maxTime={maxTime}
        maxTextWidth={maxTextWidth}
      />
      {ticks}
      <line x1={0} x2={width} y1={offsetY - lineX0} y2={offsetY - lineX0} style={styles.bline} />
    </g>
  );
}
