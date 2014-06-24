var App = {};

test('Built-in required rule', function() {
  expect(3);

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

  ok(card, 'created');
  equal(result, false, 'Validation should fail because number is required');

  card.set('number', '4111111111111111');

  result = card.validate().get('isValid');

  ok(result, 'Validation should succeed because number is filled out');
});

test('Supports custom validator rule', function() {
  expect(4);

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
