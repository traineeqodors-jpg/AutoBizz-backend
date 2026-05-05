const express = require("express");
const router = express.Router();
const {
  uploadDocuments,
  getMyDocuments,
  deleteDocument,
} = require("../controllers/document.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const { uploads } = require("../utils/multer");

/**
 * All document routes restricted strictly to the Organization/Owner
 */
router.post(
  "/upload-docs",
  verifyJWT,
  authorizeRoles("owner"),
  uploads.single("file"),
  uploadDocuments,
);

router.get("/my-documents", verifyJWT, authorizeRoles("owner"), getMyDocuments);

router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteDocument);

module.exports = router;
