const multer = require("multer");
const path = require("path");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

//Define Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const nameWithoutExt = path.basename(
      file.originalname,
      path.extname(file.originalname),
    );

    return {
      folder: "autobizz-uploads",
      public_id: `${req.user?.id || "guest"}-${nameWithoutExt}-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
      resource_type: "auto",
    };
  },
});

const imageOnlyFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only Image files (JPG, PNG, WEBP) are allowed for profile photos",
      ),
      false,
    );
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: imageOnlyFilter,
});

const uploadCsv = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
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
      // "application/msword", // .doc
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      // "application/vnd.ms-powerpoint", // .ppt
      // "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

      // CSV (Multiple types for cross-browser compatibility)
      "text/csv",
      "application/vnd.ms-excel",
      "application/csv",
      "text/x-csv",
    ];

    const fileTypes = /jpeg|jpg|png|webp|svg|pdf|doc|docx|ppt|csv|txt|pptx/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    // 4. Check MimeType safely
    const mimeType = allowedMimes.includes(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only Images (JPG, PNG, etc.) and Documents (PDF, DOC, PPT) are allowed",
        ),
        false,
      );
    }
  },
});

module.exports = { uploads, uploadImage, uploadCsv };
