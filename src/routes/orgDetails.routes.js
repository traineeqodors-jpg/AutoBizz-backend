const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { getOrganizationDetails, addOrganizationDetails, editOrganizationDetails } = require('../controllers/orgDetails.controller');
const router = express.Router();

router.get("/" , verifyJWT , getOrganizationDetails)
router.post("/" ,verifyJWT , addOrganizationDetails)
router.put("/" , verifyJWT , editOrganizationDetails)

module.exports = router;