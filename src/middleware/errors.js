const errors = (err, req, res, next) => {
  process.env.NODE_ENV !== 'test' && console.error('Error in errors middleware:\n', err.stack);
  res.status(500).send({ success: false, message: err.message });
};

module.exports = errors;
