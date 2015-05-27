[![Build Status](https://travis-ci.org/narkeeso/ember-validator.svg?branch=master)](https://travis-ci.org/narkeeso/ember-validator)

Goal
----
Create a lightweight and flexible validation library that supports complex validations with multiple property dependencies. Ideal for developers that want to write their own validations and choose how to implement displaying of error messages.

###### Tested with Ember 1.11+

API Documentation
-----------------
You can find the API documentation here [http://narkeeso.github.io/ember-validator](http://narkeeso.github.io/ember-validator)

Usage
-----

```javascript
App.CreditCard = Em.Object.extend(Em.Validator.Support, {
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

var results = creditCard.validate();

results.get('isValid'); // false
results.get('error.number.message'); // 'number is required'

creditCard.set('number', '4111111111111111');
creditCard.validate().get('isValid'); // true
```

Add Ember.Validator.Support to any Ember.Object and create validations with properties to validate and an array of rules defined as strings.

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
        message: '%@1 invalid, %@2 requires %@3-digits',
        validate: function(value, options) {
          var context = options.context;
              type = context.get('type');

          if (type === 'Visa') {
            this.messageFormat = [type, 3];
            return String(value).split('').length === 3;
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

// Supports custom message formatting
card.validate().get('error.cvv.message'); // 'cvv invalid, Visa requires 3-digits'
```

Define an object inside the property name with a validate function. This custom validator checks if the object type is Visa and checks if it's length is 3. The object is also passed into the validate function so that you can access it's other properties.

Example View Implementation
-------------------
One of the goals for ember-validator was to let it be flexible enough that you could write your own view and choose how you display/handle validation errors. I've included what I use in my projects here: [ember-validator-view-example](ember-validator-view-example.js)

Thanks
------
Development made possible by [ChowNow Inc](https://www.chownow.com). The library was created to handle ChowNow's need for a flexible validator library without all the extra built-in rules.
