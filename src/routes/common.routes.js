const express = require('express');
const { me, logout } = require('../controllers/common.controller');
const { allowOwnerOrEmployee } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get("/me", allowOwnerOrEmployee, me);
router.post("/logout" , allowOwnerOrEmployee , logout)

module.exports = router