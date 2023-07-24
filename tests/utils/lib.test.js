const Lib = require('../../src/utils/lib');

describe('Number Decimal Places Test', () => {
  it('should check if a number has the specified number of decimal places', () => {
    expect(
      Lib.number_has_decimal_places({ number: 10.123, decimal_places: 3 })
    ).toBe(true);
    expect(
      Lib.number_has_decimal_places({ number: 10.123, decimal_places: 2 })
    ).toBe(false);
    expect(
      Lib.number_has_decimal_places({ number: 10, decimal_places: 2 })
    ).toBe(false);
    expect(
      Lib.number_has_decimal_places({ number: 10.4, decimal_places: 1 })
    ).toBe(true);
    expect(
      Lib.number_has_decimal_places({ number: 10.0, decimal_places: 3 })
    ).toBe(false);
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

  describe('throw_error_not_positive_numbers', () => {
    it('should not throw an error for valid positive numbers', () => {
      expect(() => Lib.throw_error_not_positive_numbers(10, 'test')).not.toThrow();
      expect(() => Lib.throw_error_not_positive_numbers(1, 'test')).not.toThrow();
      expect(() => Lib.throw_error_not_positive_numbers(1000, 'test')).not.toThrow();
    });

    it('should throw an error for non-numeric values', () => {
      expect(() => Lib.throw_error_not_positive_numbers('abc', 'test')).toThrow(
        'test'
      );
      expect(() => Lib.throw_error_not_positive_numbers('123', 'test')).toThrow(
        'test'
      );
      expect(() => Lib.throw_error_not_positive_numbers(null, 'test')).toThrow(
        'test'
      );
      expect(() => Lib.throw_error_not_positive_numbers(undefined, 'test')).toThrow(
        'test'
      );
    });

    it('should throw an error for zero or negative numbers', () => {
      expect(() => Lib.throw_error_not_positive_numbers(0, 'test')).toThrow(
        'test'
      );
      expect(() => Lib.throw_error_not_positive_numbers(-1, 'test')).toThrow(
        'test'
      );
      expect(() => Lib.throw_error_not_positive_numbers(-100, 'test')).toThrow(
        'test'
      );
    });
  });
});
