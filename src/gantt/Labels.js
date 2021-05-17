import h from '../h';

export default function Labels({
  styles, data, onClick, rowHeight, width, maxTextWidth, viewModeSliderHeight
}) {
  return (
    <g>
      {data.map((v, i) => (
        <g>
          {v.level === 0 ? (
            <line
              key={i}
              x1={0}
              x2={i === 0 ? maxTextWidth : width}
              y1={viewModeSliderHeight + i * rowHeight}
              y2={viewModeSliderHeight + i * rowHeight}
              style={styles.line}
            />
          ) : null}
          <text
            key={i}
            x={10}
            y={viewModeSliderHeight + (i + 0.5) * rowHeight}
            class="gantt-label"
            style={v.level === 0 ? styles.labelLvl0 : styles.label}
            onClick={() => onClick(v)}
          >
            {v.text}
          </text>
        </g>

      ))}
    </g>
  );
}
