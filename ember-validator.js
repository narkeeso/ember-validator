(function() {
  
Em.Validator = {};

var VERSION = '0.0.1';

if (Ember.libraries) {
  Ember.libraries.register('Ember Validator', VERSION);
}

Em.Validator.Rule = Em.Object.extend({
  /** 
   * You can add string replacements here, the first argument will always be
   * the property name being validated
   * @type {Array}
   */
  msgFmt: [],

  /**
   * You can override the default property name here for message formatting
   * @type {String}
   */
  propertyFmt: null,

  /**
   * A rule can return a message with string formatting
   * 
   * USAGE: 
   * ```
   * propertyName = 'name';
   * message = '%@1 is required';
   * ```
   * Validation message will be 'name is required'
   * The property being validated is always the first string argument
   *
   * USAGE:
   * ```
   * msgFmt = ['minimum', 6]
   * message = '%@2 of %@3 characters required'
   * ```
   * Validation message will be 'minimum of 6 characters required'
   *
   * @type {String}
   */
  message: null,

  /**
   * The object 
   * @param {*} value - The property value to validate
   * @param {Object} options - The object validator with an object context included
   * @return {Boolean} 
   */
  validate: function() {
    Em.assert('You must define a validate function for this to be a valid rule', false);
  }
});

/**
 * Built-in rules definitions, all rules are generated as {@link Em.Validator.Rule}
 */
Em.Validator.Rules = {
  required: {
    validate: function(value) {
      return !Em.isEmpty(value);
    },
    
    message: '%@1 is required'
  },

  number: {
    validate: function(value) {
      return !isNaN(parseInt(value, 10));
    },

    message: '%@1 is not a number'
  }
};

Em.Validator.Result = Em.Object.extend({
  propertyName: null,
  isValid: null,
  ruleName: null,
  validator: null,

  /**
   * Formats the message based on the propertyName and message args.
   * The propertyName is always set as the first argument
   * 
   * @param  {String} propertyName
   * @param  {Array} msgFmt
   * @return {String}
   */
  _formatMessage: function(propertyName, msgFmt) {
    var formats = [];

    formats = formats.concat(msgFmt);
    formats.unshift(propertyName);

    return Em.String.fmt(this.get('validator.message'), formats);
  },

  /**
   * Checks if a property name override exists in validator.propertyFmt
   * before sending to {@link Em.Validator.Result._formatMessage}
   * 
   * @return {String} the formatted message
   */
  message: function() {
    var validator = this.get('validator');
        propertyFmt = validator.get('propertyFmt'),
        msgArgs = this.get('validator.msgFmt'),
        propertyName = propertyFmt ? propertyFmt : this.get('propertyName');

    return this._formatMessage(propertyName, msgArgs);
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
   * Looks for a rule object defined as custom or defined in {@link Em.Validator.Rules}.
   * Any custom rules with the same name in {@link Em.Validator.Rules} are merged.
   * 
   * @param  {String} key
   * @param  {String} ruleName
   * @return {Object} - The rule object
   */
  _getRuleObj: function(key, ruleName) {
    var validations = this.validations,
        Rules = Em.Validator.Rules,
        customRule = validations[key][ruleName],
        builtInRuleCopy = Em.copy(Rules[ruleName]);

    if (customRule) {
      var rule = builtInRuleCopy ? Em.merge(builtInRuleCopy, customRule) : customRule,
          hasValidateMethod = typeof rule.validate === 'function';

      Em.assert('Must have validate function defined in custom rule.', 
        hasValidateMethod);

      return Em.Validator.Rule.create(rule);
    }

    if (builtInRuleCopy) {
      return Em.Validator.Rule.create(builtInRuleCopy);
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
        // Build options to pass to validate
        var options = validator;
        options.context = self;

        var didValidate = validator.validate(valueForKey, options);

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

  _getRulesForKey: function(key) {
    var property = this.validations[key];

    if (Em.typeOf(property) === 'array') {
      return property;
    } else if (Em.typeOf(property.rules) === 'array') {
      return property.rules;
    } else {
      Em.Logger.warn('No valid defined rules found for property \'' + key + '\'');
      return [];
    }
  },
  
  /**
   * Runs all validations defined in the validations object
   * @return {Em.ArrayProxy} - an instance of {@link Em.Validator.Results}
   */
  validate: function(keys) {
    var self = this,
        validations = this.get('validations'),
        keys = keys ? [keys] : this._getValidationProperties();

    this.get('validationResults').clear();
    
    keys.forEach(function(key) {
      var rules = self._getRulesForKey(key);
      self._generateResult(rules, key);
    });
    
    return this.get('validationResults');
  }
});

})();
