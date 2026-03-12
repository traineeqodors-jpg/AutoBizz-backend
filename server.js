const express = require("express");
const orgRouter = require("./src/routes/org.routes.js");
const errorHandler = require("./src/middlewares/error.middleware.js");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const passwordResetRouter = require("./src/routes/passwordReset.routes.js");
const tenantRouter = require("./src/routes/tenant.routes.js");
const documentRouter = require("./src/routes/document.routes.js");
const orgDetailsRouter = require("./src/routes/orgDetails.routes.js");
const { initPinecone } = require("./src/config/pinecone.js");

const PORT = process.env.PORT;

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local dev
      "http://192.168.0.40:5173", // Your local IP for other PCs
      "http://192.168.0.37:5173",
      "http://192.168.0.35:5173",
      // Live site
    ],
    credentials: true,
  }),
);

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));

app.get("/", (req, res) => {
  res.send("hello World");
});

app.use("/api/org", orgRouter);
app.use("/api/password", passwordResetRouter);
app.use("/api/tenant", tenantRouter);
app.use("/api/document", documentRouter);
app.use("/api/orgDetails", orgDetailsRouter);

app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Initialize the single Pinecone index
    const index = await initPinecone();

    // 2. Save it to app.locals so all controllers can access it via req.app.locals
    app.locals.pineconeIndex = index;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running at :${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
