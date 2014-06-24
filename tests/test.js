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

  var card = App.CreditCard.create({
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
          validate: function(value, obj) {
            if (obj.get('type') === 'Visa') {
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
