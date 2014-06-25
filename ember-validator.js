(function() {
  
Em.Validator = {};

var VERSION = '0.0.1';

if (Ember.libraries) {
  Ember.libraries.register('Ember Validator', VERSION);
}

Em.Validator.Rule = Em.Object.extend({
  validate: null,
  message: null
});

Em.Validator.Rules = Em.Object.extend();

Em.Validator.Rules.reopenClass({
  required: {
    validate: function(value) {
      return !Em.isEmpty(value);
    },
    
    message: '%@ is required'
  },

  number: {
    validate: function(value) {
      return Em.typeOf(value) === 'number';
    },

    message: '%@ is not a number'
  }
});

Em.Validator.Result = Em.Object.extend({
  propertyName: null,
  isValid: null,
  ruleName: null,
  validator: null,

  message: function() {
    var name = this.get('propertyName');
    return this.get('validator.message').fmt(name);
  }.property('validator')
});

/**
 * The array proxy which stores all the validation results
 */
Em.Validator.Results = Em.ArrayProxy.extend({
  messages: Em.computed.mapBy('content', 'message'),
  errors: Em.computed.alias('content'),
  
  // A valid object should have no errors
  isValid: function() {
    return Em.isEmpty(this.get('errors'));
  }.property('errors.@each'),

  // Retrieves the error message for given error key
  getMsgFor: function(key) {
    var property = this.get('errors').findBy('propertyName', key);
    return property ? property.get('message') : null;
  }
});

Em.ValidatorMixin = Ember.Mixin.create({
  init: function() {
    this._super();
    this.set('validationResults', Em.Validator.Results.create({ content: [] }));
  },
  
  /**
   * Gets all the property keys from defined validations object
   * @return {Array}
   */
  _getValidationProperties: function() {
    var validations = this.validations;
    Em.assert('You do not have a \'validations\' object defined', validations);
    return Em.keys(validations);
  },

  /**
   * Looks for a rule object defined as custom or defined in 
   * {@link Em.Validator.Rules}
   * @param  {String} key
   * @param  {String} ruleName
   * @return {Object} - The rule object
   */
  _getRuleObj: function(key, ruleName) {
    var validations = this.validations,
        Rules = Em.Validator.Rules;

    var customRule = validations[key][ruleName];

    if (customRule) {
      var hasValidateFunction = typeof customRule.validate === 'function';
      Em.assert('Must have validate function defined in custom rule.', 
        hasValidateFunction);
      return customRule;
    }

    var builtIn = Rules[ruleName];

    if (builtIn) {
      return builtIn;
    } else {
      Em.assert('No valid rules were found.', false);
    }
  },
  
  /**
   * Responsible for running validation rules and appending a result to
   * validationResults.
   * @param  {Array} rules - rule names defined as strings
   * @param  {String} key - the current property being validated
   */
  _generateResult: function(rules, key) {
    var self = this,
        valueForKey = this.get(key),
        results = this.get('validationResults');
    
    rules.find(function(ruleName) {
      var validator = self._getRuleObj(key, ruleName);

      // Should only run rules on required or values that are not undefined
      if (ruleName === 'required' || valueForKey !== undefined) {
        var didValidate = validator.validate(valueForKey, self);

        if (!didValidate) {
          var result = Em.Validator.Result.create({
            isValid: false,
            validator: validator,
            ruleName: ruleName,
            propertyName: key
          });

          results.pushObject(result);
          return true;
        }
      }
    });
  },
  
  /**
   * Runs all validations defined in the validations object
   * @return {Em.ArrayProxy} - an instance of {@link Em.Validator.Results}
   */
  validate: function() {
    var self = this,
        validations = this.get('validations'),
        keys = this._getValidationProperties();

    this.get('validationResults').clear();
    
    keys.forEach(function(key) {
      var rulesForKey = self.validations[key].rules;
      self._generateResult(rulesForKey, key);
    });
    
    return this.get('validationResults');
  }
});

})();
