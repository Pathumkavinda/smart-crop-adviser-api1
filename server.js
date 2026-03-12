// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("./models");

const app = express();

// ---- CORS ----
app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---- Routes ----
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/predictions", require("./routes/predictions"));
app.use("/api/v1/files", require("./routes/files"));
app.use("/api/v1/messages", require("./routes/messages"));
app.use("/api/v1/user-files", require("./routes/userFiles"));
app.use("/api/v1/appointments", require("./routes/appointments"));
app.use("/api/v1/fertilizers", require("./routes/fertilizers"));
app.use("/api/v1/cultivations", require("./routes/cultivations"));

// Health
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

// --- Create HTTP+WS server ---
function createHttpServer() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", credentials: false },
  });

  io.on("connection", (socket) => {
    socket.on("join", ({ userId, room }) => {
      if (userId) socket.join(`user:${userId}`);
      if (room) socket.join(`room:${room}`);
    });

    socket.on("message:send", (payload) => {
      const targets = [];
      if (payload.room) targets.push(`room:${payload.room}`);
      if (payload.receiver_id) targets.push(`user:${payload.receiver_id}`);
      if (payload.sender_id) targets.push(`user:${payload.sender_id}`);
      targets.forEach((t) => io.to(t).emit("message:new", payload));
    });

    socket.on("typing", ({ room, from }) => {
      if (room) socket.to(`room:${room}`).emit("typing", { from });
    });
  });

  return { server, io };
}

// --- Start only when run directly ---
async function start() {
  const PORT = process.env.PORT || 3001;
  await sequelize.authenticate();
  console.log("Database connected ✔");

  await sequelize.sync({ alter: false });

  const { server } = createHttpServer();
  server.listen(PORT, () => {
    console.log(`HTTP+WS on http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Unable to start:", err);
    process.exit(1);
  });
}

module.exports = { app, sequelize, start, createHttpServer };