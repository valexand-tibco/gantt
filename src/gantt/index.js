import h from '../h';
import { DAY } from '../utils';
import DayHeader from './DayHeader';
import WeekHeader from './WeekHeader';
import MonthHeader from './MonthHeader';
import Labels from './Labels';
import LinkLine from './LinkLine';
import Bar from './Bar';
import CurrentLine from './CurrentLine';
import getStyles from './styles';
import ViewModeSlider from './ViewModeSlider';

const UNIT = {
  day: DAY / 28,
  week: (7 * DAY) / 56,
  month: (30 * DAY) / 56
};
function NOOP() {}

export default function Gantt({
  data = [],
  onClick = NOOP,
  onMouseOver = NOOP,
  onMouseOut = NOOP,
  onMouseOverLine = NOOP,
  onMouseOutLine = NOOP,
  viewMode = 'week',
  maxTextWidth = 140,
  sliderWidth = 200,
  offsetY = 60,
  rowHeight = 40,
  barHeight = 16,
  maxHeight = 800,
  scrollBarWidth = 8,
  styleOptions = {},
  showLinks = true,
  showDelay = true,
  start,
  end
}) {
  const unit = UNIT[viewMode];
  const minTime = start.getTime() - unit * 32;
  const maxTime = end.getTime() + unit * 32;

  const viewModeSliderHeight = 40;

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

  return (
    // eslint-disable-next-line no-unused-vars
    <svg width={svgWidth} height={height} viewBox={box}>
      <ViewModeSlider sliderWidth={sliderWidth} styles={styles} width={width} maxTextWidth={maxTextWidth} viewMode={viewMode} />
      {viewMode === 'day' ? (
        <DayHeader
          styles={styles}
          unit={unit}
          height={height}
          offsetY={offsetY}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
          width={width}
          viewModeSliderHeight={viewModeSliderHeight}
        />
      ) : null}
      {viewMode === 'week' ? (
        <WeekHeader
          styles={styles}
          unit={unit}
          offsetY={offsetY}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
          width={width}
          height={height}
          viewModeSliderHeight={viewModeSliderHeight}
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
          width={width}
          height={height}
          viewModeSliderHeight={viewModeSliderHeight}
        />
      ) : null}
      <g id="scrollgroup" width={width} height={height - offsetY - viewModeSliderHeight} x="0" y={offsetY + viewModeSliderHeight}>
        {maxTextWidth > 0 ? (
          <Labels
            styles={styles}
            data={data}
            onClick={onClick}
            rowHeight={rowHeight}
            width={width}
            maxTextWidth={maxTextWidth}
            offsetY={0}
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
          current={current}
          minTime={minTime}
          onClick={onClick}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
          showDelay={showDelay}
          rowHeight={rowHeight}
          barHeight={barHeight}
          maxTextWidth={maxTextWidth}
          offsetY={0}
        />
      </g>
      <CurrentLine
        styles={styles}
        unit={unit}
        height={height}
        current={current}
        minTime={minTime}
        maxTextWidth={maxTextWidth}
        offsetY={offsetY}
        viewModeSliderHeight={viewModeSliderHeight}
        onMouseOver={onMouseOverLine}
        onMouseOut={onMouseOutLine}
      />
    </svg>
  );
}
