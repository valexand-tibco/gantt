import h from '../h';
import { formatDay } from '../utils';

export default function Bar({
  styles, data, unit, minTime, showDelay, rowHeight, barHeight, maxTextWidth, current, onClick, onMouseOver, onMouseOut, offsetY
}) {
  const x0 = maxTextWidth;
  const y0 = (rowHeight - barHeight) / 2;
  const cur = x0 + (current - minTime) / unit;
  return (
    <g>
      {data.map((v, i) => {
        if (!v.end || !v.start) {
          return null;
        }
        const handler = () => onClick(v);
        const mouseOverHandler = () => onMouseOver(v);
        const mouseOutHandler = () => onMouseOut(v);
        const x = x0 + (v.start - minTime) / unit;
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
            <g key={i} class="gantt-bar" style={{ cursor: 'pointer' }} onClick={handler} onMouseOver={mouseOverHandler} onMouseOut={mouseOutHandler}>
              <polygon points={points} style={styles.milestone} onClick={handler} onMouseOver={mouseOverHandler} onMouseOut={mouseOutHandler} />
              <circle class="gantt-ctrl-start" data-id={v.id} cx={x} cy={cy} r={6} style={styles.ctrl} />
            </g>
          );
        }
        let w1 = (v.end - v.start) / unit;
        if (w1 === 0) {
          w1 = 4;
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
        return (
          <g key={i} class="gantt-bar" style={{ cursor: 'pointer' }} onClick={handler} onMouseOver={mouseOverHandler} onMouseOut={mouseOutHandler}>
            <text x={x - 4} y={cy} style={styles.text1}>{formatDay(v.start)}</text>
            <text x={x + w1 + 4} y={cy} style={styles.text2}>{formatDay(v.end)}</text>
            <rect
              x={x}
              y={y}
              width={w1}
              height={barHeight}
              rx={1.8}
              ry={1.8}
              style={bar.back}
              onClick={handler}
              onMouseOver={mouseOverHandler}
              onMouseOut={mouseOutHandler}
            />
            {w2 > 0.000001 ? <rect x={x} y={y} width={w2} height={barHeight} rx={1.8} ry={1.8} style={bar.front} /> : null}
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
