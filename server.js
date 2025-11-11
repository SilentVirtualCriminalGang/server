import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // frontend er link (localhost:5173 or deployed link)
    methods: ["GET", "POST"],
  },
});

let waitingUser = null; // wait list e jekuno ekjon thakbe

io.on("connection", (socket) => {
  console.log("🔗 New user connected:", socket.id);

  socket.emit("connected", "Connected to GENZ Server ✅");

  // =============================
  // 🧠 Find Partner Event
  // =============================
  socket.on("find-partner", () => {
    console.log(`🔍 ${socket.id} is searching for a partner...`);

   
    if (waitingUser && waitingUser.id !== socket.id) {
      const partner = waitingUser;
      waitingUser = null;

      // pair
      socket.partnerId = partner.id;
      partner.partnerId = socket.id;

      socket.emit("partner-found", { partnerId: partner.id });
      partner.emit("partner-found", { partnerId: socket.id });

      console.log(`💬 ${socket.id} paired with ${partner.id}`);
    } else {
      // 
      waitingUser = socket;
      socket.emit("waiting", "Waiting for a partner...");
      console.log(`${socket.id} is waiting for a partner.`);
    }
  });

  // =============================
  // 💬 Message Event
  // =============================
  socket.on("message", (msg) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit("message", msg);
    }
  });

  // =============================
  // ❌ Disconnect Event
  // =============================
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    //
    if (socket.partnerId) {
      io.to(socket.partnerId).emit("partner-disconnected");
    }

    //
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => console.log("🔥 Genz backend running on port 3000"));
