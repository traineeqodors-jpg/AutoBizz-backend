const express = require('express');
const { me } = require('../controllers/common.controller');
const { allowOwnerOrEmployee } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get("/me", allowOwnerOrEmployee, me);

module.exports = router