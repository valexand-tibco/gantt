import h from '../h';
import { getDatesStrict } from '../utils';
import YearMonth from './YearMonth';

export default function DayHeader({
  styles, unit, height, offsetY, maxTextWidth, width, viewModeSliderHeight, zoomSliderHeight,
  unitWidth, initialMinDate, initialMaxDate
}) {
  const dates = getDatesStrict(initialMinDate, initialMaxDate);
  const ticks = [];
  const x0 = maxTextWidth;
  const y0 = viewModeSliderHeight + zoomSliderHeight + offsetY / 2;
  const RH = offsetY / 2;
  let x = x0;
  const len = dates.length - 1;
  const minDate = dates[0];
  const maxDate = dates[len];
  const dayWidth = unitWidth;
  for (let i = 0; i <= len; i++) {
    const cur = new Date(dates[i]);
    const day = cur.getDay();
    if (i === 0) {
      x = x0;
    } else {
      x += dayWidth;
    }
    ticks.push((
      <g>
        {day === 0 || day === 6 ? (
          <rect class="weekend-days" x={x} y={y0} width={dayWidth} height={RH} style={styles.weekEven} />
        ) : null}
        {i !== 0 ? (
          <line class="day-lines" x1={x} x2={x} y1={y0} y2={y0 + RH} style={styles.line} />
        ) : null}
        <text class="day-text" x={x + dayWidth / 2} y={viewModeSliderHeight + zoomSliderHeight + offsetY * 0.75} style={styles.text3}>{cur.getDate()}</text>
      </g>
    ));
  }
  return (
    <g id="DayHeader">
      <rect x={maxTextWidth} y={0} width={maxTextWidth + dayWidth * len} height={offsetY + viewModeSliderHeight + zoomSliderHeight} fill="white" />
      {ticks}
      <YearMonth
        styles={styles}
        unit={unit}
        dates={dates}
        offsetY={offsetY}
        minTime={minDate}
        maxTime={maxDate}
        maxTextWidth={maxTextWidth}
        height={height}
        width={width}
        viewModeSliderHeight={viewModeSliderHeight}
        zoomSliderHeight={zoomSliderHeight}
      />
    </g>
  );
}
