import h from '../h';
import { DAY } from '../utils';
import DayHeader from './DayHeader';
import WeekHeader from './WeekHeader';
import MonthHeader from './MonthHeader';
import Grid from './Grid';
import Labels from './Labels';
import LinkLine from './LinkLine';
import Bar from './Bar';
import getStyles from './styles';

const UNIT = {
  day: DAY / 28,
  week: 7 * DAY / 56,
  month: 30 * DAY / 56
};
function NOOP() {}

export default function Gantt({
  data = [],
  onClick = NOOP,
  viewMode = 'week',
  maxTextWidth = 140,
  offsetY = 60,
  rowHeight = 40,
  barHeight = 16,
  maxHeight = 800,
  scrollBarWidth = 8,
  thickWidth = 1.4,
  styleOptions = {},
  showLinks = true,
  showDelay = true,
  start,
  end
}) {
  const unit = UNIT[viewMode];
  const minTime = start.getTime() - unit * 48;
  const maxTime = end.getTime() + unit * 48;

  const width = (maxTime - minTime) / unit + maxTextWidth;
  let svgWidth = width;
  let height = data.length * rowHeight + offsetY;
  if (height > maxHeight) {
    height = maxHeight;
    svgWidth += scrollBarWidth;
  }
  const box = `0 0 ${svgWidth} ${height}`;
  const current = Date.now();
  const styles = getStyles(styleOptions);

  const dataHeight = rowHeight * data.length;

  return (
    // eslint-disable-next-line no-unused-vars
    <svg width={svgWidth} height={height} viewBox={box}>
      {viewMode === 'day' ? (
        <DayHeader
          styles={styles}
          unit={unit}
          height={height}
          offsetY={offsetY}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
        />
      ) : null}
      {viewMode === 'week' ? (
        <WeekHeader
          styles={styles}
          unit={unit}
          dataHeight={dataHeight}
          offsetY={offsetY}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
          width={width}
        />
      ) : null}
      {viewMode === 'month' ? (
        <MonthHeader
          styles={styles}
          unit={unit}
          offsetY={offsetY}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
        />
      ) : null}
      <g id="scrollgroup" width={width} height={height} x="0" y={offsetY}>
        {/* <Grid
          styles={styles}
          data={data}
          width={width}
          rowHeight={rowHeight}
        /> */}
        {maxTextWidth > 0 ? (
          <Labels
            styles={styles}
            data={data}
            onClick={onClick}
            rowHeight={rowHeight}
            width={width}
          />
        ) : null}
        {showLinks ? (
          <LinkLine
            styles={styles}
            data={data}
            unit={unit}
            current={current}
            minTime={minTime}
            rowHeight={rowHeight}
            barHeight={barHeight}
            maxTextWidth={maxTextWidth}
          />
        ) : null}
        <Bar
          styles={styles}
          data={data}
          unit={unit}
          height={dataHeight}
          current={current}
          minTime={minTime}
          onClick={onClick}
          showDelay={showDelay}
          rowHeight={rowHeight}
          barHeight={barHeight}
          maxTextWidth={maxTextWidth}
          offsetY={offsetY}
        />
      </g>
    </svg>
  );
}
