import h from '../h';

export default function Grid({
  styles, data, width, rowHeight
}) {
  return (
    <g>
      {data.filter((v) => v.level === 0).map((v, i) => {
        const y = (i + 1) * rowHeight;
        return <line key={i} x1={0} x2={width} y1={y} y2={y} style={styles.line} />;
      })}
    </g>
  );
}
