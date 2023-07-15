require('./config');
const db_config = require('./config/database');
const Database = require('./database');

(async () => {
  try {
    const db = new Database(process.env.NODE_ENV, db_config);
    await db.connect();

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