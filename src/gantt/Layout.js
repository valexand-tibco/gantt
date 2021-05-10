import h from '../h';

export default function Layout({
  styles, width, height, thickWidth
}) {
  const x0 = thickWidth / 2;
  const W = width - thickWidth;
  const H = height - thickWidth;
  return (
    <g>
      <rect x={x0} y={x0} width={W} height={H} style={styles.box} />
    </g>
  );
}
