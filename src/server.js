// import "dotenv/config";

// import express from "express";
// import configViewEngine from "./config/configEngine.js";
// import routes from "./routes/web.js";
// import cronJobController from "./controllers/cronJobController.js";
// import socketIoController from "./controllers/socketIoController.js";
// import cookieParser from "cookie-parser";
// import http from "http";
// import { Server } from "socket.io";
// import homeController from "./controllers/homeController.js";

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// const port = process.env.PORT || 3008;

// app.use(cookieParser());
// // app.use(express.static('public'));

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // setup viewEngine
// configViewEngine(app);
// // init Web Routes
// routes.initWebRouter(app);
// app.get("/jdbgames", homeController.JDBgamesPage);
// app.get("/jiligames", homeController.JiligamesPage);
// app.get("/spribegames", homeController.SpribegamesPage);
// app.get("/cq9games", homeController.CQ9gamesPage);
// app.get("/microgames", homeController.MicrogaminggamesPage);
// app.get("/pgsoftgames", homeController.PgSoftgamesPage);

// // Cron game 1 Phut
// cronJobController.cronJobGame1p(io);

// // Check xem ai connect vào sever
// socketIoController.sendMessageAdmin(io);

// // app.all('*', (req, res) => {
// //     return res.render("404.ejs");
// // });

// io.on("connection", (socket) => {
//   console.log("✅ Admin connected for notifications");

//   socket.on("disconnect", () => {
//       console.log("❌ Admin disconnected");
//   });
// });

// // Function to send a notification to admin
// function sendAdminNotification(message) {
//   io.emit("new_transaction", message);
// }

// export { io, server, sendAdminNotification };

// server.listen(port, () => {
//   console.log(`Connected success http://localhost:${port}`);
// });


import "dotenv/config";

import express from "express";
import configViewEngine from "./config/configEngine.js";
import routes from "./routes/web.js";
import cronJobController from "./controllers/cronJobController.js";
import socketIoController from "./controllers/socketIoController.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import homeController from "./controllers/homeController.js";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3008;

// Middlewares
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup View Engine
configViewEngine(app);

// Init Web Routes
routes.initWebRouter(app);

// Static game routes
app.get("/jdbgames", homeController.JDBgamesPage);
app.get("/jiligames", homeController.JiligamesPage);
app.get("/spribegames", homeController.SpribegamesPage);
app.get("/cq9games", homeController.CQ9gamesPage);
app.get("/microgames", homeController.MicrogaminggamesPage);
app.get("/pgsoftgames", homeController.PgSoftgamesPage);

// Cron Job
cronJobController.cronJobGame1p(io);

// Socket.IO Connection
socketIoController.sendMessageAdmin(io);

io.on("connection", (socket) => {
  console.log("✅ Admin connected for notifications");

  socket.on("disconnect", () => {
    console.log("❌ Admin disconnected");
  });
});

// Function to send admin notification
function sendAdminNotification(message) {
  io.emit("new_transaction", message);
}

export { io, server, sendAdminNotification };

server.listen(port, () => {
  console.log(`✅ Server running: http://localhost:${port}`);
});
