import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { create } from "express-handlebars";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors({
  origin: "*", // ou especifique: ["http://localhost:3000"]
  methods: ["GET", "POST"]
}));


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ou especifique: ["http://localhost:3000"]
    methods: ["GET", "POST"]
  }
});
interface UserStatus {
  online?: boolean;
  mute?: boolean;
  [key: string]: any;
}

const socketsStatus: Record<string, UserStatus> = {};

// Config Handlebars
const hbs = create({
  layoutsDir: path.join("./src/views"),
  defaultLayout: "main",
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join("./src/views"));

// Static files
app.use("/files", express.static(path.join("./src/public")));

app.get("/home", (_, res) => {
  res.render("index");
});

// WebSocket logic
io.on("connection", (socket) => {
  const socketId = socket.id;
  socketsStatus[socketId] = {};

  console.log("User connected:", socketId);

  socket.on("voice", (data: string) => {
    const newData = `data:audio/ogg;${data.split(";")[1]}`;

    for (const id in socketsStatus) {
      const user = socketsStatus[id];
      if (id !== socketId && user.online && !user.mute) {
        socket.broadcast.to(id).emit("send", newData);
      }
    }
  });

  socket.on("userInformation", (data: UserStatus) => {
    socketsStatus[socketId] = data;
    io.emit("usersUpdate", socketsStatus);
  });

  socket.on("disconnect", () => {
    delete socketsStatus[socketId];
    io.emit("usersUpdate", socketsStatus);
    console.log("User disconnected:", socketId);
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});