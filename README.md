[![Build Status](https://travis-ci.org/narkeeso/ember-validator.svg?branch=master)](https://travis-ci.org/narkeeso/ember-validator)

ember-validator
===============

A library for validating ember objects

Goal
----
Create a lightweight and flexible validation library that supports complex validations with multiple property dependencies. Ideal for developers that want to write their own validations and choose how to implement how errors are displayed in the view.

###### Disclaimer: **such alpha**, **much risk**, currently only tested with Ember 1.5.1

Usage
-----

```javascript
App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
  validations: {
    name: {
      rules: ['required']
    },
    number: {
      rules: ['required']
    }
  }
});

var creditCard = App.CreditCard.create({
  name: 'Michael Narciso',
  number: null
});

creditCard.validate().get('isValid'); // false
creditCard.validate().get('messages'); // ['number is required']

creditCard.set('number', '4111111111111111');
creditCard.validate().get('isValid'); // true
```

Add Em.ValidationMixin to any Ember.Object and create a validations with properties to validate and an array of rules defined as strings.

### Custom Validation

```javascript
App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
  validations: {
    name: {
      rules: ['required']
    },
    cvv: {
      rules: ['required', 'cvvLength']
      cvvLength: {
        validate: function(value, obj) {
          if (obj.get('type') === 'Visa') {
            return value.split('').length === 3;
          }
        }
      }
    }
  }
});

var card = App.CreditCard.create({
  name: 'Michael',
  type: 'Visa',
  number: '4111111111111111',
  cvv: '944'
});

card.validate().get('isValid'); // true

card.set('cvv', '9444');
card.validate().get('isValid') // false;
```

Define an object inside the property name with a validate function. This custom validator checks if the object type is Visa and checks if it's length is 3. The object is also passed into the validate function so that you can access it's other properties.

Example View Implementation
---------------------------

NOTE: There is currently no built-in view but here is a working example on how to implement an error messages view in your app.


```javascript
App.ValidatorErrorView = Em.View.extend({
  defaultTemplate: Em.Handlebars.compile('{{view.message}}'),
  classNames: ['alert', 'alert--error'],
  classNameBindings: ['hasError::alert--hidden'],
  hasError: Em.computed.bool('message'),

  message: function() {
    var results = this.get('results');
    
    if (!Em.isEmpty(results)) {
      var key = this.get('key'),
          message = results.getMsgFor(key);

      return results.getMsgFor(key);
    } else {
      return null;
    }
  }.property('results.@each')
});

/**
 * A helper to show ember-validator error messages. It checks to see if a
 * validationResults object lives on the controller otherwise checks the key
 * passed contains an object with validationResults.
 * 
 * @param  {String} key - Pass just the property or pass the validated object
 * @param  {Object} options
 */
Em.Handlebars.helper('error-msg', function(key, options) {
  var context = options.data.view.controller,
      results = context.get('validationResults');

  // If validationResults was not found in the context, check the key
  if (results === undefined) {
    var properties = key.split('.'),
        object = context.get(properties[0]);

    results = object ? object.get('validationResults') : undefined;

    if (results) {
      properties.shift();
      key = properties.join('.');
    }
  }

  if (results) {
    options.hash.results = results;
    options.hash.key = key;
    return Ember.Handlebars.helpers.view.call(this, App.ValidatorErrorView, options);
  } else {
    Em.Logger.warn('No validationResults were found for error key ' + key);
  }
});
```

TODO
----
- Allow to return as promise (optional)
- More built-in rules (In progress)
- Custom rules defined in validations (In progress)
- Add external object dependencies
- value dependencies should be valid before run in other validations
- More documentation
- Split files up
- Better messages system
- Test with older Ember versions, 1.0+
