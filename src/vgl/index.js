/**
 * @namespace vgl
 */
module.exports = require('./vgl');

require('./GL');
require('./object');
require('./boundingObject'); // requires object
require('./mapper'); // requires boundingObject
require('./event'); // requires object
require('./graphicsObject'); // requires object
require('./material'); // requires graphicsObject
require('./materialAttribute'); // requires graphicsObject
require('./node'); // requires boundingObject
require('./actor'); // requires node
require('./groupNode'); // requires node
require('./camera'); // requires groupNode
require('./blend'); // requires materialAttribute
require('./data');
require('./geomData'); // requires data
require('./renderWindow'); // requires graphicsObject
require('./renderer'); // requires graphcisObject
require('./shader'); // requires object
require('./shaderProgram'); // requires materialAttribute
require('./texture'); // requires materialAttributes
require('./uniform');
require('./vertexAttribute');
require('./viewer'); // requires object
