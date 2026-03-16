const express = require('express');
const { registerTenant, tenantLogin, editTenant, getCurrentTenantDetails, tenantLogout, refreshAccessToken } = require('../controllers/tenant.controller');
const { verifyTenant } = require('../middlewares/auth.middleware');
const { triggerAICall } = require('../temp/makeCall.js');
const router = express.Router();

router.post("/register" , registerTenant);
router.post("/login" , tenantLogin)
router.post("/refresh-token", refreshAccessToken);

router.put("/" , verifyTenant , editTenant)

router.get("/tenantDetails" , verifyTenant , getCurrentTenantDetails)
router.get("/logout", verifyTenant , tenantLogout)

router.post('/trigger-outbound', async (req, res) => {
  const { phoneNumber, orgId } = req.body;
  try {
    const sid = await triggerAICall(phoneNumber, orgId);
    res.json({ success: true, callSid: sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
})


module.exports = router