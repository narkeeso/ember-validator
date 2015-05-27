var App = {};

test('Validation.Results instance should have it\'s error properties mapped', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required', 'notMichael'],
        notMichael: {
          validate: function(value, options) {
            return false;
          }
        }
      }
    }
  });

  var card = App.CreditCard.create();
  results = card.validate();

  equal(results.get('error.name') instanceof Ember.Validator.Error, true, 'should be an instance of Ember.Validator.Error');
});

test('Built-in required rule', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      },
      number: {
        rules: ['required']
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael',
    number: null
  });

  var result = card.validate().get('isValid');
  ok(!result, 'should fail, number is null');

  card.set('number', '4111111111111111');

  result = card.validate().get('isValid');
  ok(result, 'Validation should succeed because number is filled out');
});

test('Built-in number rule', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      balance: {
        rules: ['number']
      }
    }
  });

  var card = App.CreditCard.create({ balance: 12.59 });
  var result = card.validate().get('isValid');

  ok(result, 'balance should validate');

  card.set('balance', 'twelve');
  result = card.validate().get('isValid');
  ok(!result, 'balance validation should fail');
});

test('Properties without required rule and value is undefined or empty string or null) should NOT validate', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      },
      number: {
        rules: ['number']
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael',
    number: ''
  });

  isValid = card.validate().get('isValid');
  ok(isValid, 'object should be valid with empty number and number rule defined');
});

test('Supports custom validator rule', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      },
      cvv: {
        rules: ['required', 'cvvLength'],
        cvvLength: {
          validate: function(value, options) {
            var type = options.context.get('type');

            if (type === 'Visa') {
              return value.split('').length === 3;
            }
          },
          message: 'invalid %@'
        }
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael',
    type: 'Visa',
    cvv: '9444'
  });

  ok(card, 'created');

  var result = card.validate().get('isValid'),
      message = card.validate().get('error.cvv.message');

  equal(result, false, 'Validation should fail because cvv is 4 digits');
  equal(message, 'invalid cvv', 'Should display set message in custom validator');

  card.set('cvv', '944');
  result = card.validate().get('isValid');
  ok(result, 'Validation should succeed because cvv is 3 digits');
});

test('Only show 1 error per property', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      },
      number: {
        rules: ['required', 'number']
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael',
    number: null
  });

  var results = card.validate();
  equal(Em.keys(results.content).length, 1, 'Should only have 1 error');

  card.set('name', undefined);
  results = card.validate();
  equal(results.get('errors.length'), 2, 'Should only have 2 errors');
});

test('Can retrieve errors by key name', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      }
    }
  });

  var card = App.CreditCard.create({
    name: null
  });

  var results = card.validate(),
      error = results.get('error.name');

  ok(error instanceof Em.Validator.Error, 'Error is an instance of Validator.Error');
});

test('Supports message sending additional message formats', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required', 'maxLength'],
        maxLength: {
          max: 10,
          message: '%@1 is over %@2 of %@3 characters',
          validate: function(value, options) {
            if (String(value).split('').length > options.max) {
              this.messageFormats = ['maximum', options.max];
              return false;
            }
          }
        }
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael Narciso'
  });

  var results = card.validate();
  equal(results.get('error.name.message'), 'name is over maximum of 10 characters', 'should display formatted string');
});

test('Supports setting your own property name for message formatting', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required', 'maxLength'],
        maxLength: {
          max: 10,
          message: '%@1 is over %@2 of %@3 characters',
          propertyFormat: 'full name',

          validate: function(value, options) {
            if (String(value).split('').length > options.max) {
              this.messageFormats = ['maximum', options.max];
              return false;
            }
          }
        }
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Michael Narciso'
  });

  var results = card.validate();
  equal(results.get('error.name.message'), 'full name is over maximum of 10 characters', 'should display formatted string');
});

test('Validator.Result instance has access to the object being validated', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required', 'notMichael'],
        notMichael: {
          message: 'This is not Michael',
          validate: function(value, options) {
            return value === 'Michael';
          }
        }
      }
    }
  });

  var card = App.CreditCard.create({
    name: 'Courtney'
  });

  var results = card.validate(),
      result = results.get('error.name');

  equal(result.get('context'), card, 'context matches the original instance');
});

test('trim option trims whitespace before evaluating values', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required', 'length'],
        length: {
          message: 'Invalid %@1 length',
          validate: function(value, options) {
            return String(value).length === 7;
          }
        }
      }
    }
  });

  var card = App.CreditCard.create({
    name: '  Michael  '
  });

  var results = card.validate({ trim: true });
  equal(results.get('isValid'), true, 'Should return valid because Michael is 7 characters');

  // Make sure it doesn't trim when set to false
  card.set('name', '  Michael  ');
  results = card.validate({ trim: false });

  equal(results.get('isValid'), false, 'Should return invalid because length is 11 with whitespace');
});

test('Support for validating specified keys in the validate() method', function() {
  App.CreditCard = Em.Object.extend(Ember.Validator.Support, {
    validations: {
      name: {
        rules: ['required']
      },
      number: {
        rules: ['required', 'number']
      }
    }
  });

  var card = App.CreditCard.create({
    name: null,
    number: 'four'
  });

  var results = card.validate({ properties: ['number'] });

  equal(results.get('errors.length'), 1, 'Should only have 1 error');
  ok(results.get('error.number'), 'Error for number should exist in results.');

  // Test sending arrays
  results = card.validate(['name', 'number']);
  equal(results.get('errors.length'), 2, 'Should have 2 errors');

  // Test sending comma delimited
  results = card.validate('name', 'number');
  equal(results.get('errors.length'), 2, 'Should have 2 errors');
});
