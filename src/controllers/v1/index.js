const { Router } = require("express");
const user_router = require('./user')
const game_router = require('./game')

const router = Router();

router.use(user_router);
router.use(game_router)

module.exports = router;
