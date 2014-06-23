ember-validator
===============

A library for validating ember objects

Usage
-----

```javascript
App.CreditCard = Em.Object.extend({
  validations: {
    name: {
      required: true
    },
    number: {
      required: true
    }
  }
});

var creditCard = App.CreditCard.create({
  name: 'Michael Narciso',
  number: null
});

creditCard.validate().get('isValid'); // false
creditCard.validate().get('messages'); // ['number is required']

creditCard.set('number', 4111111111111111);
creditCard.validate().get('isValid'); // true
```

validate() returns a results object

TODO
----
- Allow to return as promise (optional)
- More built-in rules
- Custom rules defined in validations
- Add value dependencies
- More documentation
- Tests
- Split files up
