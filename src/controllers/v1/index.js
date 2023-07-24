const { Router } = require("express");
const user_router = require('./user')
const game_router = require('./game')
const game_actions_router = require('./game_actions')

const router = Router();

router.use(user_router);
router.use(game_router)
router.use(game_actions_router)

module.exports = router;
