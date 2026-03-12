const { uploadDocuments, getMyDocuments, deleteDocument } = require("../controllers/document.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const {uploads} = require("../utils/multer")
const express = require('express');
const router = express.Router();




router.post("/upload-docs" , verifyJWT , uploads.single("file") , uploadDocuments);
router.get("/my-documents" , verifyJWT , getMyDocuments)
router.delete("/:id" , verifyJWT , deleteDocument)

module.exports = router;