(function() {

var VERSION = '0.0.2';

if (Ember.libraries) {
  Ember.libraries.register('Ember Validator', VERSION);
}

/**
 * @module Ember.Validator
 * @main Ember.Validator
 */

/**
 * @class Ember.Validator
 * @namespace Ember
 * @extends Ember.Object
 * @static
 */
Ember.Validator = Ember.Object.create({
  /**
   * Option to trim whitespace from string values before validation.
   * 
   * @property TRIM_VALUE
   * @type {Boolean}
   */
  TRIM_VALUE: true,
  
  /**
   * Looks for rules property in the errorKey set in validations
   *
   * @private
   * @method _getRulesForKey
   * @param {String} key
   */
  _getRulesForKey: function(validations, key) {
    var property = validations[key];

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
   * Looks for a rule object defined as custom or defined in {@link Em.Validator.Rules}.
   * Any custom rules with the same name in {@link Em.Validator.Rules} are merged.
   * 
   * @private
   * @method _getRuleObj
   * @param {String} context
   * @param {String} key
   * @param {String} ruleName
   * @return {Object} - The rule object
   */
  _getRuleObj: function(context, key, ruleName) {
    var validations = context.validations,
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
   * 
   * @private
   * @method _generateResult
   * @param {Object} context - The object doing the validation
   * @param {Array} rules - rule names defined as strings
   * @param {String} key - the current property being validated
   */
  _generateResult: function(context, rules, key) {
    var self = this,
        valueForKey = context.get(key),
        results = context.get('validationResults');

    if (Ember.Validator.TRIM_VALUE && Em.typeOf(valueForKey) === 'string') {
      var trimmed = valueForKey.trim();
      context.set(key, trimmed);
      valueForKey = trimmed;
    }
    
    rules.find(function(ruleName) {
      var validator = self._getRuleObj(context, key, ruleName);

      // Should only run rules on required or values that are not undefined
      if (ruleName === 'required' || valueForKey !== undefined) {
        // Build options to pass to validate
        var options = validator;
        
        options.context = context;

        var didValidate = validator.validate(valueForKey, options);

        if (!didValidate) {
          var result = Em.Validator.Result.create({
            context: context,
            isValid: false,
            _validator: validator,
            ruleName: ruleName,
            errorKey: key
          });
          
          results.pushObject(result);
          return true;
        }
      }
    });
  }
});

/**
 * The base rule class which stores the validate method and message settings.
 *
 * @class Rule
 * @constructor
 * @namespace Validator
 * @extends Ember.Object
 */
Ember.Validator.Rule = Ember.Object.extend({
  /** 
   * Property used to customize the message formatting
   * 
   * @property messageFormats
   * @type array
   */
  messageFormats: [],

  /**
   * Set this property when you want to customize the message to show something
   * other than the default errorKey.
   * 
   * See: {{#crossLink "Ember.Validator.Result/errorKey:property"}}errorKey{{/crossLink}}
   * 
   * @property propertyFormat
   * @type string
   */
  propertyFormat: null,

  /**
   * The property used to display the error message. Can be set to a customized
   * message with formatting or without.
   * 
   * message is formatted like so:
   * 
   * @example
   *  ```
   *  // %@1: errorKey || propertyFormat
   *  // %@2+: messageFormats
   * 
   *  '%@1 has invalid length, must be %@2 %@3 chars'.fmt(errorKey, messageFormats);
   *  ```
   * errorKey is defaulted to %@1 and messageFormats are designated for %@2+
   * 
   * Related: {{#crossLink "Validator.Result/errorKey:property"}}{{/crossLink}}
   *
   * @property message
   * @uses messageFormats
   * @type string
   */
  message: null,

  /**
   * Define validations in this method and return the Boolean value.
   * 
   * @method validate
   * @param {*} value - The property value to validate
   * @param {Object} options - The object validator with an object context included
   * @return {Boolean} 
   */
  validate: function() {
    Em.assert('You must define a validate function for this to be a valid rule', false);
  }
});

/**
 * A static class used to defined reusable rules. Each property defined on the
 * root of this class are wrapped in Ember.Validator.Rule.
 * 
 * An example of adding more rules:
 * 
 * ```javascript
 * Ember.Validator.Rules.reopen({
 *   minLength: {
 *     min: 6,
 * 
 *     validate: function(value, options) {
 *       this.messageFormats = ['Minimum', options.min];
 *       return value.split('').length > options.min;
 *     },
 *     
 *     message: '%@2 of %@3 characters required.'
 *   }
 * });
 * ```
 * 
 * Related:
 * {{#crossLink "Validator.Rule"}}{{/crossLink}},
 * http://emberjs.com/api/classes/Ember.String.html#method_fmt
 * 
 * @static
 * @class Rules
 * @namespace Validator
 */
Ember.Validator.Rules = Ember.Object.create({
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
});

/**
 * Validation result object used to store the validation.
 *
 * @class Result
 * @constructor
 * @namespace Validator
 * @extends Ember.Object
 */
Ember.Validator.Result = Ember.Object.extend({
  /**
   * The object that is running the validation.
   * 
   * @property context
   * @type {Object || Ember.Object}
   */
  context: null,
  
  /**
   * @property errorKey
   * @type string
   */
  errorKey: null,
  
  /**
   * @property isValid
   * @type boolean
   */
  isValid: null,
  
  /**
   * @property ruleName
   * @type string
   */
  ruleName: null,
  
  /**
   * The object being validated is set when a result is generated
   *
   * @private
   * @property _validator
   * @type Object
   */
  _validator: null,

  /**
   * Formats the message based on the errorKey and messageFormats.
   * The errorKey is always set as the first argument
   * 
   * Related:
   * {{#crossLink "Validator.Rule/propertyFormat:property"}}{{/crossLink}},
   * {{#crossLink "Validator.Rule/messageFormats:property"}}{{/crossLink}}
   * 
   * @private
   * @method _formatMessage
   * @param  {String} propertyFormat
   * @param  {Array} messageFormats
   * @return {String} The formatted string
   */
  _formatMessage: function(propertyFormat, messageFormats) {
    var formats = [];

    formats = formats.concat(messageFormats);
    formats.unshift(propertyFormat);

    return Em.String.fmt(this.get('_validator.message'), formats);
  },

  /**
   * Computed property that formats the error message. Uses propertyFormat
   * and messageFormats for customization.
   * 
   * Related:
   * {{#crossLink "Validator.Rule/propertyFormat:property"}}{{/crossLink}},
   * {{#crossLink "Validator.Rule/messageFormats:property"}}{{/crossLink}}
   * 
   * @property message
   * @type {String}
   */
  message: function() {
    var _validator = this.get('_validator');
        propertyFormat = _validator.get('propertyFormat'),
        messageFormats = _validator.get('messageFormats'),
        propertyFormat = propertyFormat ? propertyFormat : this.get('errorKey');

    return this._formatMessage(propertyFormat, messageFormats);
  }.property('_validator')
});

/**
 * The array proxy which stores all the validation results
 * 
 * @constructor
 * @class Results
 * @namespace Validator
 * @extends Ember.ArrayProxy
 */
Ember.Validator.Results = Ember.ArrayProxy.extend({
  /**
   * An array of all the error messages generated
   * 
   * @property messages
   * @type {Array}
   */
  messages: Em.computed.mapBy('content', 'message'),
  
  /**
   * An alias for the content property set on results which stores
   * Ember.Validator.Result objects
   * 
   * @property errors
   * @type {Array}
   */
  errors: Em.computed.alias('content'),
  
  /**
   * Set to false if any errors were generated in the validation
   * 
   * @property isValid
   * @type {Boolean}
   */
  isValid: function() {
    return Em.isEmpty(this.get('errors'));
  }.property('errors.@each'),
  
  /**
   * Retrieves the error message for given errorKey.
   * 
   * @method getMsgFor
   * @param {String} errorKey
   * @return {String}
   */
  getMsgFor: function(errorKey) {
    var error = this.getError(errorKey);
    return error ? error.get('message') : null;
  },
  
  getError: function(errorKey) {
    return this.get('errors').findBy('errorKey', errorKey);
  }
});

/**
 * Add this mixin to any object to add validation support. Exposes the validate()
 * method which looks for a validations object.
 * 
 * @class Support
 * @static
 * @namespace Validator
 * @type {Ember.Mixin}
 */
Ember.Validator.Support = Ember.Mixin.create({
  init: function() {
    this._super();
    this.set('validationResults', Em.Validator.Results.create({ content: [] }));
  },
  
  /**
   * The property where validations are defined.
   * 
   * @example
   * ```javascript
   * App.Person = Ember.Object.extend(Ember.Validator.Support, {
   *  name: null,
   *  phone: null,
   * 
   *  validations: {
   *    name: {
   *      rules: ['required']
   *    },
   *    phone: {
   *       rules: ['required', 'phone']
   *       phone: function(value, options) {
   *         // run validations
   *       }
   *    }
   *  }
   * });
   * ```
   * 
   * @property validations
   * @required
   * @type {Object}
   */
  validations: null,
  
  /**
   * Runs all validations defined in the validations object and stores results.
   * The method returns a results object.
   * 
   * @example Getting the validation
   * ```
   * var person = App.Person.create({ name: null });
   * 
   * person.validate().get('isValid') // false;;
   * ```
   * 
   * @example Getting the error message
   * ```
   * person.validate().getMsgFor('name'); // 'name is required'
   * ```
   * 
   * Related:
   * {{#crossLink "Validator.Results"}}{{/crossLink}},
   * {{#crossLink "Validator.Support/validations:property"}}{{/crossLink}}
   * 
   * You can also choose which keys to run validations on by passing an array.
   * ```
   * 
   * @method validate
   * @param {Array} keys - An array of object keys to validate
   * @return {Ember.Validator.Results}
   */
  validate: function(keys) {
    var self = this,
        validations = this.get('validations'),
        Validator = Ember.Validator;
        
    // Check if keys are being sent manually in the method before checking 
    // validations
    keys = keys ? [keys] : Em.keys(validations);
    Em.assert('You do not have a \'validations\' object defined', validations);
    
    this.get('validationResults').clear();
        
    keys.forEach(function(key) {
      var rules = Validator._getRulesForKey(validations, key);
      Validator._generateResult(self, rules, key);
    });
    
    return this.get('validationResults');
  }
});

})();
