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

  /**
   * Given example: 'customer.billing.card.number' as the key
   * 
   * Loops through the key to find a validation object starting from the bottom
   * If the key is 'customer.billing.card.number' the parser will generate an array
   * removing one key at a time until a results object is found.
   *
   * The first reduce method creates an object traversal array as follows:
   * ['customer.billing.card', 'customer.billing', 'customer']
   *
   * That array is passed to the find method to attempt the retieval of
   * the validationResults object.
   * 
   * @return {Em.Object} validationResults object if found
   */
  _parseKeyForResults: function() {
    var context = this.get('context'),
        keyName = this.get('keyName'),
        keys = keyName.split('.');

    if (keys.length > 1) {
      var objectNames = keys.reduce(function(array, key, idx) {
        idx = (keys.length - 1) - idx;
        sliced = keys.slice(0, idx);
        array.push(sliced.join('.'));
        return array;
      }, []);

      var resultsKey = objectNames.find(function(objectName) {
        var object = context.get(objectName);
        return object.get('validationResults');
      });

      return resultsKey ? context.get(resultsKey).get('validationResults') : undefined;
    }
  },

  errorKey: function() {
    var keyNames = this.get('keyName').split('.');
    return keyNames[keyNames.length - 1];
  }.property('keyName'),

  didInsertElement: function() {
    this._setResultsObject();
  },

  willDestroyElement: function() {
    this.get('results').clear();
  },

  message: function() {
    var results = this.get('results'),
        errorKey = this.get('errorKey');

    return !Em.isEmpty(results) ? results.getMsgFor(errorKey) : null;
  }.property('results.@each.message')
});
