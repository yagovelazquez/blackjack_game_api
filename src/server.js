require('./config');
const db_config = require('./config/database');

(async () => {
  try {
    const App = require('./app');
    const app = new App();
    app.listen();
  } catch (err) {
    console.error(
      'Something went wrong when initializing the server:\n',
      err.stack
    );
  }
})();