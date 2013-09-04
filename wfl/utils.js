//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image, wflModule*/
/*global vglModule, proj4, document, climatePipesStyle, window, reg*/
//////////////////////////////////////////////////////////////////////////////

"use strict";

//////////////////////////////////////////////////////////////////////////////
/**
 * Utility functions for the workflow library
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.utils = {

  /**
   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
   * @param obj1 object
   * @param obj2 object
   * @returns object a new object based on obj1 and obj2
   */
  merge_options: function (obj1, obj2) {
    var obj3 = {}, attrName;
    for (attrName in obj1) {
      obj3[attrName] = obj1[attrName];
    }
    for (attrName in obj2) {
      obj3[attrName] = obj2[attrName];
    }
    return obj3;
  },

  merge_options_in_place: function (obj1, obj2) {
    var attrName;
    for (attrName in obj2) {
      obj1[attrName] = obj2[attrName];
    }
    return obj1;
  },

  defaultValue: function (param, dflt) {
    return typeof param !== 'undefined' ? param : dflt;
  },

  createIdCounter: function (initialId) {
    initialId = wflModule.utils.defaultValue(initialId, -1);
    return function () {
      initialId += 1;
      return initialId;
    };
  },

  moduleRegistryMap: {},

  debug: function (msg) {
    console.log(msg);
  },

  /**
   * Draws a rounded rectangle using the current state of the canvas.
   * If you omit the last three params, it will draw a rectangle
   * outline with a 5 pixel border radius
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} x The top left x coordinate
   * @param {Number} y The top left y coordinate
   * @param {Number} width The width of the rectangle
   * @param {Number} height The height of the rectangle
   * @param {Number} radius The corner radius. Defaults to 5;
   * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
   * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
   */
  roundRect: function (ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === "undefined") {
      radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke || typeof stroke === "undefined") {
      ctx.stroke();
    }
    if (fill) {
      ctx.fill();
    }
  }
};
