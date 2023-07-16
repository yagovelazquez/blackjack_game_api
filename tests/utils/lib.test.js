const Lib = require('../../src/utils/lib');

describe('Number Decimal Places Test', () => {
  it('should check if a number has the specified number of decimal places', () => {
    expect(
      Lib.number_has_decimal_places({ number: 10.123, decimal_places: 3 })
    ).toBe(true);
    expect(
      Lib.number_has_decimal_places({ number: 10.123, decimal_places: 2 })
    ).toBe(false);
    expect(Lib.number_has_decimal_places({ number: 10, decimal_places: 2 })).toBe(
      false
    );
    expect(Lib.number_has_decimal_places({ number: 10.4, decimal_places: 1 })).toBe(
      true
    );
    expect(Lib.number_has_decimal_places({ number: 10.0, decimal_places: 3 })).toBe(
      false
    );
    expect(
      Lib.number_has_decimal_places({ number: 123.45678, decimal_places: 5 })
    ).toBe(true);
    expect(
      Lib.number_has_decimal_places({ number: 123.45, decimal_places: 6 })
    ).toBe(false);
  });
  it('should return isNan if is not we pass not a number', () => {
    expect(
      Lib.number_has_decimal_places({ number: undefined, decimal_places: 6 })
    ).toBe('is not a number');
  });
  it('should return decimal_places should be a number, if we dont pass a number', () => {
    expect(
      Lib.number_has_decimal_places({ number: 6, decimal_places: undefined })
    ).toBe('decimal_places should be a number');
  });
});
