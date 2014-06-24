Em.Validator = {};

Em.Validator.Rule = Em.Object.extend({
  message: null,
  validate: null
});

Em.Validator.Rules = Em.Object.extend();

Em.Validator.Rules.reopenClass({
  required: {
    validate: function(value, deps) {
      return !Em.isEmpty(value);
    },
    
    message: '%@ is required'
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

Em.Validator.Results = Em.ArrayProxy.extend({
  content: null,
  messages: Em.computed.mapBy('content', 'message'),
  
  isValid: function() {
    var content = this.get('content');
    return Em.isEmpty(content) ? true : content.isEvery('isValid', true);
  }.property('content.@each')
});

Em.ValidatorMixin = Ember.Mixin.create({
  init: function() {
    this._super();
    this.set('validationResults', Em.Validator.Results.create({ content: [] }));
  },
  
  _getValidationKeys: function() {
    var validations = this.validations;
    Em.assert('Must have a \'validations\' object defined', validations);
    return Em.keys(validations);
  },

  /**
   * Looks for a rule object defined as custom or defined in {@link Em.Validator.Rules}
   * @param  {String} key
   * @param  {String} ruleName
   * @return {Object} - The rule object
   */
  _getRuleObj: function(key, ruleName) {
    var validations = this.validations,
        Rules = Em.Validator.Rules;

    var customRule = validations[key][ruleName];

    if (customRule) {
      var hasValidateFunction = typeof validations[key][ruleName].validate === 'function';
      Em.assert('Must have validate function defined in custom rule.', hasValidateFunction);
      return customRule;
    }

    var builtIn = Rules[ruleName];

    if (builtIn) {
      return builtIn;
    } else {
      Em.assert('No valid rules were found.', false);
    }
  },
  
  _generateResults: function(rules, key) {
    var self = this,
        valueForKey = this.get(key),
        results = this.get('validationResults'),
        resultObj = Em.Validator.Result.create();
    
    rules.forEach(function(ruleName) {
      var validator = self._getRuleObj(key, ruleName),
          result = validator.validate(valueForKey, self);

      if (!result) {
        resultObj.setProperties({
          isValid: false,
          validator: validator,
          ruleName: ruleName,
          propertyName: key
        });

        results.pushObject(resultObj);
      }
    });
  },
  
  validate: function() {
    var self = this,
        validations = this.get('validations'),
        keys = this._getValidationKeys();

    this.get('validationResults').clear();
    
    keys.forEach(function(key) {
      var rulesForKey = self.validations[key].rules;
      self._generateResults(rulesForKey, key);
    });
    
    return this.get('validationResults');
  }
});
