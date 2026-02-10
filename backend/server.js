const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Middleware (Increased limits for large image/audio payloads)
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
// Attach socket instance to app for routes
app.set("socketio", io);

const apiRoutes = require("./routes/apiRoutes");
app.use("/api", apiRoutes);

// Root Route - serves the main page
app.get("/", (req, res) => {
  const hp = path.join(__dirname, "../frontend/public/homepage.html");
  console.log("Serving:", hp);
  res.sendFile(hp);
});

// Static files (Frontend)
app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/css", express.static(path.join(__dirname, "../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../frontend/js")));

// Socket.IO
require("./sockets/socketHandler")(io);

server.listen(PORT, HOST, () => {
  console.log(`
    🚀 AgriConnect Firebase Backend
    📡 Port: ${PORT}
    🌐 Running at: http://${HOST}:${PORT}
    `);
});
