class Lib {
  static number_has_decimal_places({ number, decimal_places }) {
    if (isNaN(number)) return 'is not a number';
    if (isNaN(decimal_places)) return 'decimal_places should be a number';
    const decimalPlaces = number.toString().split('.')[1];
    return (
      decimalPlaces !== undefined && decimalPlaces.length === decimal_places
    );
  }
}

module.exports = Lib;
