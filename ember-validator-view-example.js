/**
 * Maintained example of how you can implement validator errors into your view
 * 
 * USAGE:
 * 
 * ```handlebars
 * <div>
 *   {{input valueBinding="name" placeholder="name"}}
 *   {{error-msg "name"}}
 * </div>
 * ```
 * 
 * Example above assumes that a validationResults object lives in the
 * context/controller. A validationResults object is automatically generated
 * by adding the Em.ValidatorMixin to any object.
 * 
 * ```handlebars
 * <div>
 *   {{input valueBinding="name" placeholder="name"}}
 *   {{error-msg "creditCard.name"}}
 * </div>
 * ```
 * 
 * creditCard object in the example above has the Em.ValidatorMixin
 * the view knows how to parse the key to find a results object
 */
Em.Handlebars.helper('error-msg', function(keyName, options) {
  options.hash.keyName = keyName;
  return Ember.Handlebars.helpers.view.call(this, Em.ValidatorErrorView, options);
});

Em.ValidatorErrorView = Em.View.extend({
  defaultTemplate: Em.Handlebars.compile('{{view.message}}'),
  classNames: ['alert', 'alert--error'],
  classNameBindings: ['hasError::alert--hidden'],
  hasError: Em.computed.bool('message'),

  _setResultsObject: function() {
    var results;
    
    // Check for results object in key first
    if (!results) {
      results = this._parseKeyForResults(); 
    }
    
    // Still no results, check in the view context
    if (!results) {
      results = this._findResultsInContext();
    }

    if (results) {
      this.set('results', results);
    } else {
      Em.Logger.warn('No validationResults for key ' + this.get('errorKey'));
    }
  },

  // Looks for a validationResults object in view context
  _findResultsInContext: function() {
    var context = this.get('context'),
        resultsInContext = context.get('validationResults');

    return context.get('validationResults');
  },

  // Looks for a validationResults object in errorKey
  _parseKeyForResults: function() {
    var keyName = this.get('keyName'),
        properties = keyName.split('.');

    // If chained properties, there is a good chance validationResults
    // is set on the first property.
    if (properties.length > 1) {
      var context = this.get('context');
      return context.get(properties[0]).get('validationResults');
    }
  },

  // errorKey returns a property from an object chain
  errorKey: function() {
    var keyNames = this.get('keyName').split('.');
    return keyNames[keyNames.length - 1];
  }.property('keyName'),

  didInsertElement: function() {
    this._setResultsObject();
  },

  message: function() {
    var results = this.get('results');

    if (!Em.isEmpty(results)) {
      return results.getMsgFor(this.get('errorKey'));
    } else {
      return null;
    }
  }.property('results.@each.message')
});
