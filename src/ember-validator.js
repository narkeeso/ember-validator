(function() {

var VERSION = '0.1.0';

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
   * Creates the error message.
   * 
   * @private
   * @method _createResultMessage
   * @param {String} errorKey
   * @param {Ember.Validator.Rule} rule
   */
  _createResultMessage: function(errorKey, rule) {
    var propertyFormat = rule.get('propertyFormat'),
        messageFormats = rule.get('messageFormats');
        
    propertyFormat = propertyFormat ? propertyFormat : errorKey;
      
    return this._formatMessage(rule, propertyFormat, messageFormats);
  },

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
   * @param {Ember.Validator.Rule} rule
   * @param  {String} propertyFormat
   * @param  {Array} messageFormats
   * @return {String} The formatted string
   */
  _formatMessage: function(rule, propertyFormat, messageFormats) {
    var formats = [],
        message = rule.get('message');
        
    Em.assert('You must specify an error message for rule name ' + 
      '(%@)'.fmt(rule.get('name')), message);

    formats = formats.concat(messageFormats);
    formats.unshift(propertyFormat);

    return Em.String.fmt(message, formats);
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
        
      return Em.Validator.Rule.create(rule, { name: ruleName });
    }
    
    if (builtInRuleCopy) {
      return Em.Validator.Rule.create(builtInRuleCopy);
    } else {
      Em.assert('No valid rules were found.', false);
    }
  },
  
  /**
   * Responsible for running validation rules and adding the error to an
   * instance of Ember.Validator.Error.
   * 
   * Result generation will stop at the first failed validation per key.
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
        results = context.get('validatorResult');

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
          var message = self._createResultMessage(key, validator),
              result = Ember.Validator.Error.create();
              
          result.setProperties({
            message: message,
            context: context,
            isValid: false,
            ruleName: ruleName,
            errorKey: key
          });
          
          results.set(key, result);
          
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
   * See: {{#crossLink "Ember.Validator.Error/errorKey:property"}}errorKey{{/crossLink}}
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
   * Related: {{#crossLink "Validator.Error/errorKey:property"}}{{/crossLink}}
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
 * @class Error
 * @constructor
 * @namespace Validator
 * @extends Ember.Object
 */
Ember.Validator.Error = Ember.Object.extend({
  /**
   * @property message
   * @type String
   */
  message: null,
  
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
  ruleName: null
});

/**
 * The array proxy which stores all the validation results
 * 
 * @constructor
 * @class Result
 * @namespace Validator
 * @extends Ember.ObjectProxy
 */
Ember.Validator.Result = Ember.ObjectProxy.extend({
  /**
   * All results are set in the content property.
   *
   * @property content
   * @type Object
   */
  content: null,
  
  /**
   * @property error
   * @type {Object}
   */
  error: Em.computed.alias('content'),
  
  /**
   * An array of all errors that exist in the content property
   * 
   * @property errors
   * @type {Array}
   */
  errors: function() {
    var content = this.get('content');
    
    return Em.keys(content).reduce(function(errors, key) {
      errors.pushObject(content.get(key));
      return errors;
    }, []);
  }.property('content'),
  
  /**
   * An array of all the error messages generated
   * 
   * @property messages
   * @type {Array}
   */
  messages: Em.computed.mapBy('errors', 'message'),
  
  /**
   * Set to false if any errors were generated in the validation
   * 
   * @property isValid
   * @type {Boolean}
   */
  isValid: function() {
    return Em.isEmpty(this.get('errors'));
  }.property('errors.@each')
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
    this.set('validatorResult', Ember.Validator.Result.create({ content: {} }));
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
   * var person = App.Person.create({ name: null, age: 29 });
   * 
   * person.validate().get('isValid') // false;;
   * ```
   * 
   * @example Getting the error message
   * ```
   * person.validate().get('error.name.message'); // 'name is required'
   * ```
   * 
   * Related:
   * {{#crossLink "Validator.Results"}}{{/crossLink}},
   * {{#crossLink "Validator.Support/validations:property"}}{{/crossLink}}
   * 
   * You can also choose which keys to run validations on by passing an array
   * or comma separated strings.
   * ```
   * person.validate('name', 'age');
   *
   * // or as an array
   * var keys = ['name', 'age'];
   * person.validate(keys);
   * ```
   * 
   * @method validate
   * @param {Array} keys - An array of object keys to validate
   * @return {Ember.Validator.Result}
   */
  validate: function() {
    var self = this,
        validations = this.get('validations'),
        Validator = Ember.Validator,
        keys;
        
    Em.assert('You do not have a \'validations\' object defined', validations);
    
    // Check if keys are being sent as args in the method before checking
    // validations object.
    if (arguments.length > 0) {
      keys = Em.typeOf(arguments[0]) === 'array' ?
        arguments[0] : Array.prototype.slice.call(arguments);
    } else {
      keys = Em.keys(validations);
    }
    
    this.set('validatorResult.content', Ember.Validator.Error.create());
        
    keys.forEach(function(key) {
      var rules = Validator._getRulesForKey(validations, key);
      Validator._generateResult(self, rules, key);
    });
    
    return this.get('validatorResult');
  }
});

})();
