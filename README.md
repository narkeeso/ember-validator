ember-validator
===============

A library for validating ember objects

###### Disclaimer: **such alpha**, **much risk**

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
