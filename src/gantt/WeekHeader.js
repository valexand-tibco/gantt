import moment from 'moment';
import h from '../h';
import { getDates, DAY, addDays } from '../utils';
import YearMonth from './YearMonth';

export default function WeekHeader({
  styles, unit, minTime, maxTime, offsetY, maxTextWidth, width, height, viewModeSliderHeight
}) {
  // const lang = navigator.language;
  // console.log(lang);
  // console.log(moment().weekday(0));
  // moment.locale(lang);
  // console.log(moment().weekday(0));
  const dates = getDates(minTime, maxTime);
  const minDate = dates[0];
  const weeks = dates.filter((v) => (new Date(v)).getDay() === 0);
  weeks.push(maxTime);
  const ticks = [];
  const x0 = maxTextWidth;
  const y0 = viewModeSliderHeight + offsetY / 2;
  const RH = height - offsetY / 2 - viewModeSliderHeight;
  const d = DAY / unit;
  // let weekWidth = d * 7;

  let weekWidth = 60;
  while (weekWidth * weeks.length < width) {
    const nextWeek = addDays(weeks[weeks.length - 1], 7);
    weeks.push(nextWeek.getTime());
  }
  const len = weeks.length - 1;
  for (let i = 0; i < len; i++) {
    const cur = new Date(weeks[i]);
    const x = x0 + (weeks[i] - minDate) / unit;
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
        maxTime={weeks[len]}
        maxTextWidth={maxTextWidth}
        height={height}
        width={width}
        viewModeSliderHeight={viewModeSliderHeight}
      />
    </g>
  );
}
