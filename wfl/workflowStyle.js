var baseStyle = {
  fill: 'darkgray',
  module: {
    text: {
      fill: '#000000',
      font: '12pt monoco',
      xpad: 20,
      ypad: 10
    },
    port: {
      width: 10,
      pad: 5,
      fill: 'lightgray',
      stroke: 'black',
      lineWidth: 1
    },
    fill: 'lightgray',
    stroke: 'black',
    lineWidth: 2,
    minWidth: 100,
    ypad: 40,
    xpad: 20
  },
  conn: {
    stroke: 'black',
    lineWidth: 2,
    bezierOffset: 75
  }
};

var vistrailStyle = jQuery.extend(true, {}, baseStyle);

var climatePipesStyle = jQuery.extend(true, {}, baseStyle);

climatePipesStyle.fill = 'teal';
climatePipesStyle.module.port.inputHeight = 30;
climatePipesStyle.module.port.inputWidth = 200;
climatePipesStyle.module.port.inputYPad = 5;
climatePipesStyle.module.port.inpad = 10;
climatePipesStyle.module.port.outpad = 10;
