const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { getOrganizationDetails, addOrganizationDetails, editOrganizationDetails } = require('../controllers/orgDetails.controller');
const router = express.Router();

router.get("/"  , getOrganizationDetails)
router.post("/" ,verifyJWT("organization") , addOrganizationDetails)
router.put("/" , verifyJWT("organization") , editOrganizationDetails)

module.exports = router;