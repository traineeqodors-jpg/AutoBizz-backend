const multer = require("multer");
const path = require("path");
const { ApiError } = require("./ApiError");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
   
    cb(null, path.join(process.cwd(), "public"));
  },
  filename: function (req, file, cb) {
    
    const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
    const extension = path.extname(file.originalname).toLowerCase();
    
    
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${extension}`);
  },
});

const imageOnlyFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/; // Removed pdf, doc, etc.
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    // This error will be caught by your global error handler
    cb(new Error("Only Image files (JPG, PNG, WEBP) are allowed for profile photos"));
  }
};

const uploadImage = multer({
  storage, // Re-use your existing diskStorage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: imageOnlyFilter,
});

const uploads = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    
    if (!file || !file.mimetype) {
      return cb(new Error("Invalid file upload"), false);
    }

    
   const allowedMimes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",

  // Documents
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

  // CSV (Multiple types for cross-browser compatibility)
  "text/csv",
  "application/vnd.ms-excel",
  "application/csv",
  "text/x-csv",

  // Text Files
  "text/plain" // .txt
];


    // 3. Check Extension via Regex
    const fileTypes = /jpeg|jpg|png|webp|svg|pdf|doc|docx|ppt|csv|txt|pptx/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

    // 4. Check MimeType safely
    const mimeType = allowedMimes.includes(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error("Only Images (JPG, PNG, etc.) and Documents (PDF, DOC, PPT) are allowed"), false);
    }
  },
});

module.exports = { uploads , uploadImage};
