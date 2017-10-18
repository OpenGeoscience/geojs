var fs = require('fs-extra');
var glob = require('glob').sync;
var path = require('path');
var yaml = require('js-yaml');

/**
 * Get a sorted list of tutorials or examples, each of which contains an object
 * with a variety of attributes:
 *  - `baseName`Css: a list of css files, if any specified by the record.
 *  - `baseName`Js: a list of js files, if any specified by the record.
 *  - main: the first js file in the previous list.  May be `undefined` if that
 *      list is empty.
 *  - bundle: '../bundle.js' (a fixed string).
 *  - dir: the directory of the record.
 *  - path: the last component of the record's directory, or the value
 *      specified by the record.
 *  - output: an output path based on `outputDir`, `rootDir`, and `path`.
 *
 * @param {string} rootDir The location to search for files.  Any directory
 *      with a json file called `baseName`.json will be parsed.
 * @param {string} baseName The name of the json file.  Also use for attribute
 *      names.
 * @param {string} outputDir The root of a location to empty and copy.  The
 *      actual output is stored at `outputDir`/`rootDir`/<record name>.
 */
function getList(rootDir, baseName, outputDir) {
  var list = glob(rootDir + '/*/' + baseName + '.json')
    .map(function (f) {
      // /path/to/<baseName>.json
      f = path.resolve(f);

      // content of <baseName>.json
      var json = fs.readJSONSync(path.resolve(f));

      // directory of the file
      var dir = path.dirname(f);

      // by default, assume the path is where the files are located.
      json.path = json.path || path.basename(dir);
      json[baseName + 'Css'] = json[baseName + 'Css'] || [];
      json[baseName + 'Js'] = json[baseName + 'Js'] || [];
      if (json[baseName + 'Js'].length) {
        json.main = path.resolve(dir, json[baseName + 'Js'][0]);
      }
      json.bundle = '../bundle.js';
      json.dir = dir;

      json.output = path.resolve(outputDir, rootDir, json.path);
      // create, empty, and copy the source directory
      fs.emptyDirSync(json.output);
      fs.copySync(json.dir, json.output);

      return json;
    });

  /* Sort records.  Recods are sorted by level, order, title, and path.
   * undefined or null levels ard orders are sorted after defined values.
   * level should be used for the approximate significant of the record, and
   * order for making specific records appear sooner in the list. */
  list.sort(function (a, b) {
    if (a.level !== b.level) {
      return a.level === undefined ? 1 : b.level === undefined ? -1 : a.level - b.level;
    }
    if (a.order !== b.order) {
      return a.order === undefined ? 1 : b.order === undefined ? -1 : a.order - b.order;
    }
    if (a.title !== b.title) {
      return a.title < b.title ? -1 : 1;
    }
    return a.path < b.path ? -1 : 1;
  });

  return list;
}

/**
 * Emit a yml list based on the records returned from `getList`.
 *
 * @param {string} dir The directory to write the file.
 * @param {string} filename The name of the file to write.
 * @param {array} An array from `getList` to emit.
 */
function writeYamlList(dir, filename, records) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFileSync(
    path.resolve(dir, filename),
    yaml.safeDump(records.filter(function (t) {
      return !t.disabled;
    }).map(function (t) {
      return {
        name: t.path,
        title: t.title,
        description: (t.about || {}).text || t.title
      };
    }))
  );
}

module.exports = {
  getList: getList,
  writeYamlList: writeYamlList
};
