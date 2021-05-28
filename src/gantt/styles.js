const SIZE = '14px';
const TYPE = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function getFont({
  fontSize = SIZE,
  fontFamily = TYPE
}) {
  return `bold ${fontSize} ${fontFamily}`;
}

export default function getStyles({
  bgColor = '#fff',
  lineColor = '#DCDFE8',
  redLineColor = '#EC9022',
  groupBack = '#9CFCC8',
  groupFront = '#6ADB7F',
  taskBack = '#9EB6FF',
  taskFront = '#6489FA',
  milestone = '#d33daf',
  warning = '#faad14',
  danger = '#f5222d',
  link = '#ffa011',
  textColor = '#222',
  lightTextColor = '#999',
  lineWidth = '1px',
  fontSize = SIZE,
  smallFontSize = '12px',
  fontFamily = TYPE,
  whiteSpace = 'pre'
}) {
  const line = {
    stroke: lineColor,
    'stroke-width': lineWidth
  };
  const redLine = {
    stroke: redLineColor,
    'stroke-width': lineWidth
  };
  const thickLine = {
    stroke: lineColor,
    'stroke-width': lineWidth
  };
  const text = {
    fill: textColor,
    'dominant-baseline': 'central',
    'font-size': fontSize,
    'font-family': fontFamily,
    'white-space': whiteSpace
  };
  const textLvl0 = {
    fill: textColor,
    'dominant-baseline': 'central',
    'font-size': '16px',
    'font-weight': '600',
    'font-family': fontFamily,
    'white-space': whiteSpace
  };
  const smallText = {
    fill: lightTextColor,
    'font-size': smallFontSize
  };
  return {
    weekEven: {
      fill: 'rgb(247,249,255)'
    },
    weekOdd: {
      fill: 'rgb(255,255,255)'
    },
    box: {
      fill: bgColor
    },
    line,
    cline: redLine,
    bline: thickLine,
    labelLvl0: textLvl0,
    label: text,
    groupLabel: {
      ...text,
      'font-weight': '600'
    },
    text1: {
      ...text,
      ...smallText,
      'text-anchor': 'end'
    },
    text2: {
      ...text,
      ...smallText
    },
    text3: {
      ...text,
      ...smallText,
      'text-anchor': 'middle'
    },
    link: {
      stroke: link,
      'stroke-width': '1.5px',
      fill: 'none'
    },
    linkArrow: {
      fill: link
    },
    milestone: {
      fill: milestone
    },
    groupBack: {
      fill: groupBack
    },
    groupFront: {
      fill: groupFront
    },
    taskBack: {
      fill: taskBack
    },
    taskFront: {
      fill: taskFront
    },
    taskHover: {
      fill: bgColor,
      fillOpacity: '0',
      stroke: '#333',
      strokeWidth: '0px'
    },
    warning: {
      fill: warning
    },
    danger: {
      fill: danger
    },
    ctrl: {
      display: 'none',
      fill: '#f0f0f0',
      stroke: '#929292',
      'stroke-width': '1px'
    },
    thumb: {
      cursor: 'pointer',
      fill: 'blue'
    },
    thickLine: {
      strokeWidth: '5px',
      stroke: '#DCDFE8',
      strokeOpacity: '0'
    },
    thickLineSlider: {
      strokeWidth: '5px',
      stroke: '#DCDFE8',
      strokeOpacity: '0',
      cursor: 'pointer'
    },
    rectangle: {
      fill: '#add8e6',
      stroke: '#add8e6',
      fillOpacity: '0.3',
      strokeOpacity: '0.7',
      strokeWidth: '2'
    },
    zoomSlider: {
      cursor: 'pointer'
    }
  };
}
