var Blueprint  = require('../../lib/models/blueprint');
var Promise    = require('../../lib/ext/promise');
var merge      = require('lodash-node/compat/objects/merge');
var inflection = require('inflection');

module.exports = Blueprint.extend({
  install: function(options) {
    var modelOptions = merge({}, options, {
      entity: {
        name: inflection.singularize(options.entity.name)
      }
    });
    var routeOptions = merge({}, options, {
      entity: {
        options: {
          type: 'resource'
        }
      }
    });

    var controllerOptions = merge({}, options, {
      entity: {
        options: {
          type: 'array'
        }
      }
    });

    return Promise.all([
      this._installBlueprint('model', modelOptions),
      this._installBlueprint('route', routeOptions),
      this._installBlueprint('controller', controllerOptions),
      this._installBlueprint('view', options),
    ]);
  },

  _installBlueprint: function(name, options) {
    var blueprint = Blueprint.lookup(name, {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return blueprint.install(options);
  }
});
