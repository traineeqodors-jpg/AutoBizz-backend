const express = require('express');
const { registerTenant, tenantLogin, editTenant, getCurrentTenantDetails, tenantLogout, refreshAccessToken } = require('../controllers/tenant.controller');
const { verifyTenant } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post("/register" , registerTenant);
router.post("/login" , tenantLogin)
router.post("/refresh-token", refreshAccessToken);

router.put("/" , verifyTenant , editTenant)

router.get("/tenantDetails" , verifyTenant , getCurrentTenantDetails)
router.get("/logout", verifyTenant , tenantLogout)


module.exports = router