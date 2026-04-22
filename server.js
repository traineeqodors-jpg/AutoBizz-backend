const express = require("express");
const path = require("path");
const http = require("http");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const errorHandler = require("./src/middlewares/error.middleware.js");

const orgRouter = require("./src/routes/org.routes.js");
const passwordResetRouter = require("./src/routes/passwordReset.routes.js");
const documentRouter = require("./src/routes/document.routes.js");
const orgDetailsRouter = require("./src/routes/orgDetails.routes.js");
const callLogRouter = require("./src/routes/callLog.routes.js");
const leadRouter = require("./src/routes/lead.routes.js");
const meetingRouter = require("./src/routes/meeting.routes.js");
const employeeRouter = require("./src/routes/employee.routes.js");
const commonRouter = require("./src/routes/common.routes.js");
const voiceRouter = require("./src/routes/voice.routes.js");
const sopVideoRouter = require("./src/routes/sop.routes.js");
const scriptGenRouter = require("./src/routes/script.routes.js");
const webhooksHeygen = require("./src/webhooks/heygenstatus.webhook.js");

const { initPinecone } = require("./src/config/pinecone.js");

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "https://9w7lghq0-3000.inc1.devtunnels.ms",
      " https://dknjfbwx-3000.inc1.devtunnels.ms",
      "  https://x0mxjhrq-3000.inc1.devtunnels.ms/",
      "http://localhost:3000",
      "http://192.168.0.37:3000",
      "http://192.168.0.40:3000",
      "http://192.168.0.41:3000",
    ],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://9w7lghq0-3000.inc1.devtunnels.ms",
      " https://dknjfbwx-3000.inc1.devtunnels.ms",
      "  https://x0mxjhrq-3000.inc1.devtunnels.ms/",
      "http://localhost:3000",
      "http://192.168.0.37:3000",
      "http://192.168.0.40:3000",
      "http://192.168.0.41:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.set("io", io);

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("X-Tunnel-Skip-Anti-Phishing-Page", "true");
  res.header("Access-Control-Allow-Origin");
  res.header(
    "Access-Control-Allow-Headers",
    req.header("Access-Control-Request-Headers"),
  );
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

// Routes
app.use("/api/org", orgRouter);
app.use("/api/password", passwordResetRouter);
app.use("/api/document", documentRouter);
app.use("/api/orgDetails", orgDetailsRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/callLog", callLogRouter);
app.use("/api/lead", leadRouter);
app.use("/api/prepareScript", scriptGenRouter);
app.use("/api/sop", sopVideoRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/employee", employeeRouter);
app.use("/webhooks/heygen", webhooksHeygen);
app.use("/api/user", commonRouter);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (userId) => {
    const room = `user_${userId}`;

    if (!socket.rooms.has(room)) {
      socket.join(room);
      console.log("Joined Room:", room);
    }
  });
});

const startServer = async () => {
  try {
    const index = await initPinecone();
    app.locals.pineconeIndex = index;

    server.listen(PORT, () => {
      console.log(`Server is running at :${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
