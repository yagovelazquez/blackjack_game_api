require('./');

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'mysql',
    password: process.env.DB_PASSWORD || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE || 'mysql',
    dialect: 'mysql',
  },
  test: {
    username: process.env.DB_TEST_USERNAME || 'mysql',
    password: process.env.DB_TEST_PASSWORD || 'mysql',
    host: process.env.DB_TEST_HOST || 'localhost',
    port: parseInt(process.env.DB_TEST_PORT) || 3307,
    database: process.env.DB_TEST_DATABASE || 'mysql',
    dialect: 'mysql',
  },
};
