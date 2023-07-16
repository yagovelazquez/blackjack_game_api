const { Router } = require("express");
const user_router = require('./user')

const router = Router();

router.use(user_router);

module.exports = router;
