var inherit = require('./inherit');
var featureLayer = require('./featureLayer');
var object = require('./object');

/**
 * Create a new instance of class fileReader
 *
 * @class geo.fileReader
 * @extends geo.object
 * @returns {geo.fileReader}
 */
var fileReader = function (arg) {
  'use strict';
  if (!(this instanceof fileReader)) {
    return new fileReader(arg);
  }
  object.call(this);

  /**
   * @private
   */
  arg = arg || {};

  if (!(arg.layer instanceof featureLayer)) {
    throw new Error('fileReader must be given a feature layer');
  }

  var m_layer = arg.layer;

  /**
   * Get the feature layer attached to the reader
   */
  this.layer = function () {
    return m_layer;
  };

  /**
   * Tells the caller if it can handle the given file by returning a boolean.
   */
  this.canRead = function () {
    return false;
  };

  /**
   * Reads the file object and calls the done function when finished.  As an
   * argument to done, provides a boolean that reports if the read was a
   * success.  Possibly, it can call done with an object containing details
   * of the read operation.
   */
  this.read = function (file, done) {
    done(false);
  };

  /**
   * Return a FileReader with handlers attached.
   */
  function newFileReader(done, progress) {
    var reader = new FileReader();
    if (progress) {
      reader.onprogress = progress;
    }
    reader.onloadend = function () {
      if (!reader.result) {
        done(reader.error);
      }
      done(reader.result);
    };
    return reader;
  }

  /**
   * Private method for reading a file object as a string.  Calls done with
   * the string content when finished or an error object if unsuccessful.
   * Optionally, the caller can provide a progress method that is called
   * after reading each slice.
   */
  this._getString = function (file, done, progress) {
    var reader = newFileReader(done, progress);
    reader.readAsText(file);
  };

  /**
   * Like _getString, but returns an ArrayBuffer object.
   */
  this._getArrayBuffer = function (file, done, progress) {
    var reader = newFileReader(done, progress);
    reader.readAsText(file);
  };

  return this;
};

inherit(fileReader, object);
module.exports = fileReader;
