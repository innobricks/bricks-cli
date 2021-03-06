'use strict';

var path    = require('path');
var Project = require('../../../lib/models/project');
var tmp     = require('../../helpers/tmp');
var touch   = require('../../helpers/file-utils').touch;
var assert  = require('assert');

var emberCLIVersion = require('../../../lib/utilities/ember-cli-version');

describe('models/project.js', function() {
  var project, projectPath;

  describe('Project.prototype.config', function() {
    var called      = false;
    projectPath = process.cwd() + '/tmp/test-app';

    before(function() {
      tmp.setup(projectPath);

      touch(projectPath + '/config/environment.js', {
        baseURL: '/foo/bar'
      });

      project = new Project(projectPath, { });
      project.require = function() {
        called = true;
        return function() {};
      };

    });

    after(function() {
      tmp.teardown(projectPath);
    });

    it('config() finds and requires config/environment', function() {
      project.config('development');
      assert.equal(called, true);
    });
  });

  describe('addons', function() {
    before(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
      project.initializeAddons();
    });

    it('returns a listing of all dependencies in the projects package.json', function() {
      var expected = {
        'ember-cli': 'latest',
        'ember-random-addon': 'latest',
        'ember-non-root-addon': 'latest',
        'non-ember-thingy': 'latest',
        'something-else': 'latest'
      };

      assert.deepEqual(project.dependencies(), expected);
    });

    it('returns a listing of all ember-cli-addons', function() {
      var expected = [ 'ember-random-addon', 'ember-non-root-addon', 'ember-super-button' ];

      assert.deepEqual(Object.keys(project.availableAddons()), expected);
    });

    it('returns an instance of the addon', function() {
      var addons = project.addons;

      assert.equal(addons[0].name, 'Ember Non Root Addon');
    });

    it('addons get passed the project instance', function() {
      var addons = project.addons;

      assert.equal(addons[0].project, project);
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      var addons = project.addons;

      assert.equal(addons[1].name, 'Ember Random Addon');
    });

    it('returns the default blueprints path', function() {
      var expected = project.root + '/blueprints';

      assert.equal(project.localBlueprintLookupPath(), expected);
    });

    it('returns a listing of all addon blueprints paths', function() {
      var expected = [ project.root + '/node_modules/ember-random-addon/blueprints' ];

      assert.deepEqual(project.addonBlueprintLookupPaths(), expected);
    });

    it('returns a listing of all blueprints paths', function() {
      var expected = [
        project.root + '/blueprints',
        project.root + '/node_modules/ember-random-addon/blueprints'
      ];

      assert.deepEqual(project.blueprintLookupPaths(), expected);
    });
  });

  describe('emberCLIVersion', function() {
    it('should return the same value as the utlity function', function() {
      assert.equal(project.emberCLIVersion(), emberCLIVersion());
    });
  });
});
