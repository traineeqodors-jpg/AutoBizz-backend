require("dotenv").config();
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
const callLogRouter = require("./src/routes/callLog.routes.js");
const leadRouter = require("./src/routes/lead.routes.js");
const meetingRouter = require("./src/routes/meeting.routes.js");
const http = require("http");
const { Server } = require("socket.io");

const voiceRouter = require("./src/routes/voice.routes.js");
const sopVideoRouter = require("./src/routes/sop.routes.js");
const scriptGenRouter = require("./src/routes/script.routes.js");
const webhooksHeygen = require("./src/webhooks/heygenstatus.webhook.js");
const path = require("path");
const { initPinecone } = require("./src/config/pinecone.js");

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Local dev
      "http://192.168.0.35:5173",
      "https://9w7lghq0-5173.inc1.devtunnels.ms", // Your local IP for other PCs
    ],
    credentials: true,
  }, // Your React URL
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.0.35:5173",
      "https://9w7lghq0-5173.inc1.devtunnels.ms",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Attach io to app so controllers can access it
app.set("io", io);

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("X-Tunnel-Skip-Anti-Phishing-Page", "true");
  next();
});

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  "/static/audio",
  express.static(path.join(__dirname, "public/audio"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    },
  }),
);

app.get("/", (req, res) => {
  res.send("hello World");
});

app.use("/api/org", orgRouter);
app.use("/api/password", passwordResetRouter);
app.use("/api/tenant", tenantRouter);
app.use("/api/document", documentRouter);
app.use("/api/orgDetails", orgDetailsRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/callLog", callLogRouter);
app.use("/api/lead", leadRouter);
app.use("/api/prepareScript", scriptGenRouter);
app.use("/api/sop", sopVideoRouter);
app.use("/api/meeting", meetingRouter);

app.use("/webhooks/heygen", webhooksHeygen);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-user-room", (userId) => {
    socket.join(`user_${userId}`);
  });
});

const startServer = async () => {
  try {
    // 1. Initialize the single Pinecone index
    const index = await initPinecone();

    // 2. Save it to app.locals so all controllers can access it via req.app.locals
    app.locals.pineconeIndex = index;

    server.listen(PORT, () => {
      console.log(`Server is running at :${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
