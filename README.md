ember-validator
===============

A library for validating ember objects

Usage
-----

```javascript
App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
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

### Custom Validation

```javascript
App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
  validations: {
    name: {
      required: true
    },
    cvv: {
      cvvLength: {
        validate: function(value, obj) {
          if (obj.get('type') === 'Visa') {
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
  number: 4111111111111111,
  cvv: 944
});

card.validate().get('isValid'); // true

card.set('cvv', 9444);
card.validate().get('isValid') // false;
```

Define an object inside the property name with a validate function. This custom validator checks if the object type is Visa and checks if it's length is 3. The object is also passed into the validate function so that you can access it's other properties.

TODO
----
- Allow to return as promise (optional)
- More built-in rules (In progress)
- Custom rules defined in validations (In progress)
- Add value dependencies
- More documentation
- Tests
- Split files up
- Better messages system
