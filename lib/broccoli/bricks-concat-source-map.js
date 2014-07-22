/* global require, module */
'use strict';
/**
 * Created by dis on 2014/7/16.
 * broccoli-concat-source-map based on broccoli-concat and grunt-concat-sourcemap
 */
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Writer = require('broccoli-writer');
var SourceNode = require('source-map').SourceNode;
var merge = require('merge');
var helps = require('broccoli-kitchen-sink-helpers');

/**
 * BroccoliSourceMap
 * @module BroccoliSourceMap
 */
module.exports = BroccoliSourceMap;

BroccoliSourceMap.prototype = Object.create(Writer.prototype);
BroccoliSourceMap.prototype.constructor = BroccoliSourceMap;

/**
 * BroccoliSourceMap
 *
 * @param inputTree
 * @param options
 * @returns {BroccoliSourceMap}
 * @constructor
 */
function BroccoliSourceMap(inputTree, options) {
  if (!(this instanceof  BroccoliSourceMap)) {
    return new BroccoliSourceMap(inputTree, options);
  }

  this.inputTree = inputTree;

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

  var defaults = {
    separator: '\n',
    sourceRoot: '',
    sourcesContent: false,
    process: undefined
  };
  this.options = merge(defaults, options);

  this.cache = {};
}

/**
 *
 * @param readTree
 * @param destDir
 */
BroccoliSourceMap.prototype.write = function (readTree, destDir) {
  var self = this;

  return readTree(this.inputTree).then(function (srcDir) {
    var newCache = {};
    var sourceNode = new SourceNode();

    var inputFiles = helps.multiGlob(self.inputFiles, {cwd: srcDir});
    for (var i = 0; i < inputFiles.length; i++) {
      addFile(inputFiles[i]);
    }
    helps.assertAbsolutePaths([self.outputFile]);
    mkdirp.sync(path.join(destDir, path.dirname(self.outputFile)));

    var mapFilePath = self.outputFile.split('/').pop() + '.map';
    if (/\.css$/.test(self.outputFile)) {
      sourceNode.add('/*# sourceMappingURL=' + mapFilePath + ' */');
    } else {
      sourceNode.add('//# sourceMappingURL=' + mapFilePath);
    }

    var codeMap = sourceNode.toStringWithSourceMap({
      file: self.outputFile,
      sourceRoot: self.options.sourceRoot
    });

    fs.writeFileSync(path.join(destDir, self.outputFile), codeMap.code);
    fs.writeFileSync(path.join(destDir, self.outputFile + '.map'), JSON.stringify(codeMap.map));

    self.cache = newCache;

    function addFile(filePath) {
      // This function is just slow enough that we benefit from caching
      var statsHash = helps.hashStats(fs.statSync(srcDir + '/' + filePath), filePath);
      var cacheObject = self.cache[statsHash];
      if (cacheObject == null) { // cache miss
        var fileContents = fs.readFileSync(srcDir + '/' + filePath, { encoding: 'utf8' });
        if (typeof  self.options.process === 'function') {
          fileContents = self.options.process(fileContents, filePath);
        }

        cacheObject = {
          output: fileContents
        };

        fileContents.split('\n').forEach(function (line, ind) {
          line += '\n';
          sourceNode.add(new SourceNode(ind + 1, 0, filePath, line));
        });
        sourceNode.add(self.options.separator);
        if (self.options.sourcesContent) {
          sourceNode.setSourceContent(filePath, fileContents);
        }
      }
      newCache[statsHash] = cacheObject;
    }
  });
};