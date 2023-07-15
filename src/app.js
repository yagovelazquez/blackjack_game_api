const express = require('express')
const logger = require('morgan');

class App {
  constructor() {
    this.app = express();
    this.app.use(
      logger('dev', { skip: (req, res) => process.env.NODE_ENV === 'test' })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.setRoutes();
  }

  setRoutes() {
  }

  getApp() {
    return this.app;
  }

  listen() {
    const port = process.env.SERVER_PORT || 3003;
    this.app.listen(port, () => {
      console.log(`Listening at port ${port}`);
    });
  }
}

module.exports = App