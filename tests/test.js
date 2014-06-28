var App = {};

test('Built-in required rule', function() {
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
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
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

test('Only validate undefined properties on required rule', function() {
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

  // number is undefined
  var card = App.CreditCard.create({
    name: 'Michael'
  });

  var result = card.validate().get('isValid');
  ok(!result, 'object should not validate because number is required');

  App.CreditCard.reopen({
    validations: {
      name: {
        rules: ['required']
      },
      number: {
        rules: ['number']
      }
    }
  });

  card = App.CreditCard.create({
    name: 'Michael'
  });

  result = card.validate().get('isValid');
  ok(result, 'object should validate with undefined number');
});

test('Supports custom validator rule', function() {
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
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
      messages = card.validate().get('messages');

  equal(result, false, 'Validation should fail because cvv is 4 digits');
  equal(messages[0], 'invalid cvv', 'Should display set message in custom validator');

  card.set('cvv', '944');
  result = card.validate().get('isValid');
  ok(result, 'Validation should succeed because cvv is 3 digits');
});

test('Only show 1 error per property', function() {
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
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
  equal(results.get('messages.length'), 1, 'Should only have 1 error');

  card.set('name', undefined);
  results = card.validate();
  equal(results.get('messages.length'), 2, 'Should only have 2 errors');
});

test('Can retrieve errors by key name', function() {
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
    validations: {
      name: {
        rules: ['required']
      }
    }
  });

  var card = App.CreditCard.create({
    name: null
  });

  var results = card.validate();
  equal(results.getMsgFor('name'), 'name is required', 'retrieve message using getMsgFor()');
});

test('Supports message sending additional message formats', function() {
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
    validations: {
      name: {
        rules: ['required', 'maxLength'],
        maxLength: {
          max: 10,
          message: '%@1 is over %@2 of %@3 characters',
          validate: function(value, options) {
            if (String(value).split('').length > options.max) {
              this.msgFmt = ['maximum', options.max];
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
  equal(results.getMsgFor('name'), 'name is over maximum of 10 characters', 'should display formatted string');
});

test('Supports setting your own property name for message formatting', function() {
  App.CreditCard = Em.Object.extend(Em.ValidatorMixin, {
    validations: {
      name: {
        rules: ['required', 'maxLength'],
        maxLength: {
          max: 10,
          message: '%@1 is over %@2 of %@3 characters',
          propertyFmt: 'full name',

          validate: function(value, options) {
            if (String(value).split('').length > options.max) {
              this.msgFmt = ['maximum', options.max];
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
  equal(results.getMsgFor('name'), 'full name is over maximum of 10 characters', 'should display formatted string');
});
