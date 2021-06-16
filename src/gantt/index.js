import h from '../h';
import { DAY } from '../utils';
import WeekHeader from './WeekHeader';
import MonthHeader from './MonthHeader';
import Labels from './Labels';
import LinkLine from './LinkLine';
import Bar from './Bar';
import CurrentLine from './CurrentLine';
import getStyles from './styles';

const UNIT = {
  day: DAY / 28,
  week: (7 * DAY) / 56,
  month: (30 * DAY) / 56
};
function NOOP() {}

export default function Gantt({
  data = [],
  onClick = NOOP,
  onClickCancelMerking = NOOP,
  onMouseOver = NOOP,
  onMouseOut = NOOP,
  onMouseOverLine = NOOP,
  onMouseOutLine = NOOP,
  // eslint-disable-next-line no-unused-vars
  renderState = { preventRender: false },
  viewMode = 'week',
  maxTextWidth = 140,
  headerHeight = 60,
  rowHeight = 40,
  barHeight = 16,
  maxHeight = 800,
  maxWidth = 1200,
  scrollBarThickness = 8,
  styleOptions = {},
  showLinks = true,
  showDelay = true,
  start,
  end,
  chartMinDate,
  chartMaxDate,
  viewModeSliderHeight = 40,
  zoomSliderHeight = 40,
  unitWidth = 16
}) {
  const unit = UNIT[viewMode];
  const minTime = start.getTime() - unit * 28;
  const maxTime = end.getTime() + unit * 28;

  // const width = (maxTime - minTime) / unit + maxTextWidth;
  const width = maxWidth;
  let svgWidth = width;
  let height = data.length * rowHeight + headerHeight;
  let svgHeight = height + viewModeSliderHeight + zoomSliderHeight;
  if (svgHeight > maxHeight) {
    height = maxHeight - viewModeSliderHeight - zoomSliderHeight;
    svgHeight = maxHeight;
    svgWidth += scrollBarThickness;
  }
  const box = `0 0 ${svgWidth} ${svgHeight}`;
  const current = Date.now();
  const styles = getStyles(styleOptions);

  const handler = (evt) => onClickCancelMerking(evt);

  return (
    // eslint-disable-next-line no-unused-vars
    <svg viewBox={box}>
      <g id="scrollgroup" width={width} height={height} x="0" y={viewModeSliderHeight + zoomSliderHeight} onClick={handler}>
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
          offsetY={viewModeSliderHeight + zoomSliderHeight + headerHeight}
          height={height}
          headerHeight={headerHeight}
          chartMinDate={chartMinDate}
          chartMaxDate={chartMaxDate}
          unitWidth={unitWidth}
        />
      </g>
      <CurrentLine
        styles={styles}
        unit={unit}
        height={height}
        current={current}
        minTime={minTime}
        maxTextWidth={maxTextWidth}
        offsetY={headerHeight}
        viewModeSliderHeight={viewModeSliderHeight}
        zoomSliderHeight={zoomSliderHeight}
        onMouseOver={onMouseOverLine}
        onMouseOut={onMouseOutLine}
      />
      {viewMode === 'day' ? (
        <g id="DayHeader" />
        // <DayHeader
        //   styles={styles}
        //   unit={unit}
        //   height={height}
        //   offsetY={headerHeight}
        //   minTime={minTime}
        //   maxTime={maxTime}
        //   maxTextWidth={maxTextWidth}
        //   width={width}
        //   viewModeSliderHeight={viewModeSliderHeight}
        //   zoomSliderHeight={zoomSliderHeight}
        //   chartMinDate={chartMinDate}
        //   chartMaxDate={chartMaxDate}
        //   unitWidth={unitWidth}
        //   initialMinDate={initialMinDate}
        //   initialMaxDate={initialMaxDate}
        // />
      ) : null}
      {viewMode === 'week' ? (
        <WeekHeader
          styles={styles}
          unit={unit}
          offsetY={headerHeight}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
          width={width}
          height={height}
          viewModeSliderHeight={viewModeSliderHeight}
          zoomSliderHeight={zoomSliderHeight}
        />
      ) : null}
      {viewMode === 'month' ? (
        <MonthHeader
          styles={styles}
          unit={unit}
          offsetY={headerHeight}
          minTime={minTime}
          maxTime={maxTime}
          maxTextWidth={maxTextWidth}
          width={width}
          height={height}
          viewModeSliderHeight={viewModeSliderHeight}
          zoomSliderHeight={zoomSliderHeight}
        />
      ) : null}
      {maxTextWidth > 0 ? (
        <Labels
          styles={styles}
          data={data}
          onClick={onClick}
          rowHeight={rowHeight}
          width={width}
          maxTextWidth={maxTextWidth}
          offsetY={viewModeSliderHeight + zoomSliderHeight + headerHeight}
          height={height}
          headerHeight={headerHeight}
        />
      ) : null}
      {/* <ViewModeSlider sliderWidth={sliderWidth} styles={styles} width={width} maxTextWidth={maxTextWidth} viewMode={viewMode} /> */}
      <g>
        <rect x={0} y={0} width={maxTextWidth} height={headerHeight + viewModeSliderHeight + zoomSliderHeight} fill="white" />
        <rect x={width} y={0} width={scrollBarThickness} height={headerHeight + viewModeSliderHeight + zoomSliderHeight} fill="white" />
        <line
          x1={0}
          x2={width}
          y1={viewModeSliderHeight + headerHeight + zoomSliderHeight}
          y2={viewModeSliderHeight + headerHeight + zoomSliderHeight}
          style={styles.line}
        />
        <line x1={maxTextWidth} x2={maxTextWidth} y1={viewModeSliderHeight + zoomSliderHeight} y2={svgHeight} style={styles.line} />
        <line x1={maxTextWidth} x2={width} y1={svgHeight} y2={svgHeight} style={styles.line} />
        <line x1={width} x2={width} y1={viewModeSliderHeight + zoomSliderHeight} y2={svgHeight} style={styles.line} />
      </g>
    </svg>
  );
}
