import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { create } from "express-handlebars";
import path from "path";

interface UserStatus {
  online?: boolean;
  mute?: boolean;
  [key: string]: any;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const socketsStatus: Record<string, UserStatus> = {};

// Configure Handlebars
const customHandlebars = create({ layoutsDir: path.join(__dirname, "views") });
app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

// Serve static files
app.use("/files", express.static(path.join(__dirname, "public")));

// Routes
app.get("/home", (req: Request, res: Response) => {
  res.render("index");
});

// Socket.IO
io.on("connection", (socket: Socket) => {
  const socketId = socket.id;
  socketsStatus[socketId] = {};

  console.log("User connected:", socketId);

  socket.on("voice", (data: string) => {
    const newDataArr = data.split(";");
    newDataArr[0] = "data:audio/ogg;";
    const newData = newDataArr[0] + newDataArr[1];

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

// Start server
httpServer.listen(3000, () => {
  console.log("App is running on port 3000!");
});
