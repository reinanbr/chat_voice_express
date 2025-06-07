"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_handlebars_1 = require("express-handlebars");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*", // ou especifique: ["http://localhost:3000"]
    methods: ["GET", "POST"]
}));
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // ou especifique: ["http://localhost:3000"]
        methods: ["GET", "POST"]
    }
});
const socketsStatus = {};
// Config Handlebars
const hbs = (0, express_handlebars_1.create)({
    layoutsDir: path_1.default.join("./src/views"),
    defaultLayout: "main",
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path_1.default.join("./src/views"));
// Static files
app.use("/files", express_1.default.static(path_1.default.join("./src/public")));
app.get("/home", (_, res) => {
    res.render("index");
});
// WebSocket logic
io.on("connection", (socket) => {
    const socketId = socket.id;
    socketsStatus[socketId] = {};
    console.log("User connected:", socketId);
    socket.on("voice", (data) => {
        const newData = `data:audio/ogg;${data.split(";")[1]}`;
        for (const id in socketsStatus) {
            const user = socketsStatus[id];
            if (id !== socketId && user.online && !user.mute) {
                socket.broadcast.to(id).emit("send", newData);
            }
        }
    });
    socket.on("userInformation", (data) => {
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
//# sourceMappingURL=server.js.map