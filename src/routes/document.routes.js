const {
  uploadDocuments,
  getMyDocuments,
  deleteDocument,
  upsertFile,
  ragRetrieval,
  alldoc,
} = require("../controllers/document.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { uploads } = require("../utils/multer");
const express = require("express");
const router = express.Router();

router.post("/upload-docs", verifyJWT, uploads.single("file"), uploadDocuments);

router.post("/upsert", verifyJWT, uploads.single("doc"), upsertFile);

router.post("/rag", verifyJWT, ragRetrieval);

router.get("/my-documents", verifyJWT, getMyDocuments);

router.delete("/:id", verifyJWT, deleteDocument);

module.exports = router;
