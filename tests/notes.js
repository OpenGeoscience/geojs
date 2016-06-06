#!/usr/bin/env node
/**
 * A node CLI for handling build notes files.
 *
 * Accepts commands
 */
var fs = require('fs');
var path = require('path');
var script = process.argv[1];
var args = process.argv.slice(2);
var command = args[0];
var notes_path = args[1] || path.resolve('notes');
var output_file = args[2] || path.resolve('build_notes.json');

function print_help() {
  console.error('Usage: ' + script + ' reset|report|combine <notes_path> <output_file>');
}

function reset() {
  if (fs.existsSync(output_file)) {
    fs.unlinkSync(output_file);
  }
  if (fs.existsSync(notes_path)) {
    fs.readdirSync(notes_path).forEach(function (f) {
      fs.unlinkSync(path.resolve(notes_path, f));
    });
    fs.rmdirSync(notes_path);
  }
  fs.mkdirSync(notes_path);
}

function combine() {
  var notes = {};
  if (!fs.existsSync(notes_path)) {
    return {};
  }
  fs.readdirSync(notes_path).forEach(function (f) {
    var content = JSON.parse(fs.readFileSync(path.resolve(notes_path, f)));
    notes[f.replace(/\.json$/, '')] = content;
  });
  return notes;
}

if (command === 'report') {
  console.log(JSON.stringify(combine(), null, 2));
} else if (command === 'combine') {
  fs.writeFileSync(output_file, JSON.stringify(combine(), null, 2));
} else if (command === 'reset') {
  reset();
} else if (command === 'help') {
  print_help();
} else {
  console.error('Invalid arguments provided');
  print_help();
  process.exit(1);
}
