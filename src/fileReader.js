var inherit = require('./inherit');
var featureLayer = require('./featureLayer');
var object = require('./object');

/**
 * Object specification for a fileReader.
 *
 * @typedef {object} geo.fileReader.spec
 * @property {geo.featureLayer} [layer] The target feature layer.
 */

/**
 * Create a new instance of class fileReader.
 *
 * @class
 * @alias geo.fileReader
 * @extends geo.object
 * @param {geo.fileReader.spec} [arg]
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
   * Get the feature layer attached to the reader.
   *
   * @returns {geo.featureLayer} The layer associated with the reader.
   */
  this.layer = function () {
    return m_layer;
  };

  /**
   * Tells the caller if it can handle the given file by returning a boolean.
   *
   * @param {File|Blob|string|object} file This is either a `File` object, a
   *    `Blob` object, a string representation of a file, or an object
   *    representing data from a file.
   * @returns {boolean} `true` if this reader can read a file.
   */
  this.canRead = function (file) {
    return false;
  };

  /**
   * Reads the file and optionally calls a function when finished.  The `done`
   * function is called with a value that is truthy if the read was a success.
   * Depending on the specific reader, this value may be an object with details
   * of the read operation.
   *
   * @param {File|Blob|string|object} file This is either a `File` object, a
   *    `Blob` object, a string representation of a file, or an object
   *    representing data from a file.
   * @param {Function} [done] An optional callback function when the read is
   *    complete.  This is called with `false` on error or the object that was
   *    read and parsed by the reader.
   * @param {Function} [progress] A function which is passed `ProgressEvent`
   *    information from a `FileReader`.  This includes `loaded` and `total`
   *    each with a number of bytes.
   * @returns {Promise} A `Promise` that resolves with object parsed by the
   *    reader or is rejected if the reader fails.
   */
  this.read = function (file, done, progress) {
    var promise = new Promise(function (resolve, reject) {
      if (done) {
        done(false);
      }
      throw new Error('The default file reader always fails');
    });
    this.addPromise(promise);
    return promise;
  };

  /**
   * Return a `FileReader` with handlers attached.
   *
   * @param {Function} done A callback that receives either the string read
   *    from the file or a `DOMException` with an error.
   * @param {Function} [progress] A function which is passed `ProgressEvent`
   *    information from a `FileReader`.  This includes `loaded` and `total`
   *    each with a number of bytes.
   * @returns {FileReader} The `FileReader` with done and progress handles
   *    attached to it.
   */
  function newFileReader(done, progress) {
    var reader = new FileReader();
    if (progress) {
      reader.onprogress = progress;
    }
    reader.onloadend = function () {
      done(reader.error || reader.result);
    };
    return reader;
  }

  /**
   * Read a file object as a string.  Calls `done` with the string content
   * when finished or an error object if unsuccessful.
   *
   * @param {File|Blob} file A `File` or `Blob` object to read.
   * @param {Function} done A callback that receives either the string read
   *    from the file or a `DOMException` with an error.
   * @param {Function} [progress] A function which is passed `ProgressEvent`
   *    information from a `FileReader`.  This includes `loaded` and `total`
   *    each with a number of bytes.
   */
  this._getString = function (file, done, progress) {
    var reader = newFileReader(done, progress);
    reader.readAsText(file);
  };

  return this;
};

inherit(fileReader, object);
module.exports = fileReader;
