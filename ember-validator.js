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
  isValid: function() {
    var content = this.get('content');
    return Em.isEmpty(content) ? true : content.isEvery('isValid', true);
  }.property('content.@each')
});

Em.ValidatorMixin = Ember.Mixin.create({
  validationResults: Em.Validator.Results.create({
    content: Em.A()
  }),
  
  _getValidationKeys: function() {
    var validations = this.validations;
    Em.assert('Must have a \'validations\' object defined', validations);
    return Em.keys(validations);
  },
  
  _generateResults: function(rules, key) {
    var Rules = Em.Validator.Rules,
        valueForKey = this.get(key),
        results = this.get('validationResults'),
        resultObj = Em.Validator.Result.create();
    
    rules.forEach(function(rule) {
      var validator = Rules[rule],
          result = validator.validate(valueForKey);

      if (!result) {
        resultObj.setProperties({
          isValid: false,
          validator: validator,
          ruleName: rule,
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
      var rulesForKey = Em.keys(self.validations[key]);
      self._generateResults(rulesForKey, key);
    });
    
    return this.get('validationResults');
  }
});
