const express = require('express');
const router = express.Router();
const { 
  uploadDocuments, 
  getMyDocuments, 
  deleteDocument 
} = require("../controllers/document.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { uploads } = require("../utils/multer");

/**
 * All document routes restricted strictly to the Organization/Owner
 */
router.post("/upload-docs", verifyJWT("organization"), uploads.single("file"), uploadDocuments);

router.get("/my-documents", verifyJWT("organization"), getMyDocuments);

router.delete("/:id", verifyJWT("organization"), deleteDocument);

module.exports = router;