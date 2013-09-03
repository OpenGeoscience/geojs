/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global jQuery*/

var baseStyle = {
  fill: 'darkgray',
  module: {
    text: {
      fill: '#000000',
      font: '15pt wingdings teal',
      xpad: 20,
      ypad: 10
    },
    port: {
      width: 15,
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
climatePipesStyle.module.port.inputWidth = 220;
climatePipesStyle.module.port.inputYPad = 5;
climatePipesStyle.module.port.inpad = 10;
climatePipesStyle.module.port.outpad = 10;
climatePipesStyle.module.port.fill = "white";
climatePipesStyle.module.port.stroke = "lightgreen";
climatePipesStyle.module.port.lineWidth = 2;

climatePipesStyle.module.shadowBlur = 20;
climatePipesStyle.module.shadowColor = "lightblue";
climatePipesStyle.module.cornerRadius = 25;
climatePipesStyle.module.lineWidth = 5;
climatePipesStyle.module.stroke = "lightgreen";

climatePipesStyle.shadowBlur = 20;
climatePipesStyle.shadowColor = "lightblue";
climatePipesStyle.cornerRadius = 25;
climatePipesStyle.lineWidth = 5;
climatePipesStyle.stroke = "lightgreen";

climatePipesStyle.conn.stroke = "lightgreen";
