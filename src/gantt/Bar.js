import * as d3 from 'd3';
import h from '../h';
import { formatDay, getDatesStrict } from '../utils';

export default function Bar({
  styles, data, unit, minTime, showDelay, rowHeight, barHeight, maxTextWidth, current, onClick, maxTime,
  onMouseOver, onMouseOut, offsetY, unitWidth, chartMinDate, chartMaxDate, initialMinDate, initialMaxDate
}) {
  const lines = [];
  // const dates = getDates(minTime, maxTime);
  const dates = getDatesStrict(chartMinDate, chartMaxDate);
  const len = dates.length - 1;
  const x0 = maxTextWidth;
  const y0 = (rowHeight - barHeight) / 2;
  const cur = x0 + (current - minTime) / unit;
  const markExists = data.find((r) => r.marked[0]);
  const RH = offsetY / 2;
  let lineX = x0;
  for (let i = 0; i <= len; i++) {
    const currentDay = new Date(dates[i]);
    const day = currentDay.getDay();
    if (i === 0) {
      lineX = x0;
    } else {
      lineX += unitWidth;
    }
    lines.push((
      <g>
        {day === 0 || day === 6 ? (
          <rect class="chart-weekend-day" x={lineX} y={offsetY} width={unitWidth} height={data.length * rowHeight} style={styles.weekEven} />
        ) : null}
        {i !== 0 ? (
          <line class="chart-line" x1={lineX} x2={lineX} y1={offsetY} y2={data.length * rowHeight + offsetY} style={styles.line} />
        ) : null}
      </g>
    ));
  }
  return (
    <g>
      {lines}
      {data.map((v, i) => {
        if (!v.end || !v.start) {
          return null;
        }
        const handler = (evt) => onClick(v, evt);
        // const x = x0 + (v.start - minTime) / unit;
        const x = x0 + (v.start - minTime) / (1000 * 3600 * 24) * unitWidth;
        const y = offsetY + y0 + i * rowHeight;
        const cy = y + barHeight / 2;
        if (v.type === 'milestone') {
          const size = barHeight / 2;
          const points = [
            [x, cy - size],
            [x + size, cy],
            [x, cy + size],
            [x - size, cy]
          ].map((p) => `${p[0]},${p[1]}`).join(' ');
          return (
            <g key={i} class="gantt-bar" style={{ cursor: 'pointer' }} onClick={handler}>
              <polygon points={points} style={styles.milestone} onClick={handler} />
              <circle class="gantt-ctrl-start" data-id={v.id} cx={x} cy={cy} r={6} style={styles.ctrl} />
            </g>
          );
        }
        // let w1 = (v.end - v.start) / unit;
        const days = (v.end - v.start) / (1000 * 3600 * 24);
        let w1 = days * unitWidth;
        if (w1 === 0) {
          w1 = unitWidth / 2;
        }
        const w2 = w1 * v.percent;
        const bar = v.type === 'group' ? {
          back: styles.groupBack,
          front: styles.groupFront
        } : {
          back: styles.taskBack,
          front: styles.taskFront
        };
        if (showDelay) {
          if ((x + w2) < cur && v.percent < 0.999999) {
            // bar.front = styles.warning;
          }
          if ((x + w1) < cur && v.percent < 0.999999) {
            // bar.front = styles.danger;
          }
        }
        const mouseOverHandler = () => {
          const currentBar = d3.select(`#bar${i}`);
          currentBar
            .style('stroke-width', '1px');
          onMouseOver(v);
        };
        const mouseOutHandler = () => {
          const currentBar = d3.select(`#bar${i}`);
          currentBar
            .style('stroke-width', '0px');
          onMouseOut(v);
        };
        const barRect = (
          <rect
            class="bar-hover"
            x={x - 3}
            y={y - 3}
            width={w1 + 6}
            height={barHeight + 6}
            style={styles.taskHover}
            id={`bar${i}`}
            onClick={handler}
            onMouseOver={mouseOverHandler}
            onMouseOut={mouseOutHandler}
          />
        );
        return (
          <g key={i} class="gantt-bar" style={{ cursor: 'pointer' }} onClick={handler} onMouseOver={mouseOverHandler} onMouseOut={mouseOutHandler}>
            <text class="bar-start-date" x={x - 4} y={cy} style={styles.text1}>{formatDay(v.start)}</text>
            <text class="bar-end-date" x={x + w1 + 4} y={cy} style={styles.text2}>{formatDay(v.end)}</text>
            <rect
              class="back-bar"
              x={x}
              y={y}
              width={w1}
              height={barHeight}
              style={bar.back}
              onClick={handler}
              opacity={(markExists && !v.marked[0]) ? '0.5' : '1'}
              stroke={(markExists && v.marked[0]) ? '#8F7769' : 'none'}
            />

            {w2 > 0.000001 ? (
              <rect
                class="front-bar"
                x={x}
                y={y}
                width={w2}
                height={barHeight}
                style={bar.front}
                opacity={(markExists && !v.marked[0]) ? '0.5' : '1'}
              />
            ) : null}
            {barRect}
            {v.type === 'group' ? null : (
              <g>
                <circle class="gantt-ctrl-start" data-id={v.id} cx={x - 12} cy={cy} r={6} style={styles.ctrl} />
                <circle class="gantt-ctrl-finish" data-id={v.id} cx={x + w1 + 12} cy={cy} r={6} style={styles.ctrl} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
