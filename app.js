const express = require('express');

const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const body_parser = require('body-parser');
const { Userrouter } = require('./Router/User-Router');
const { Hostrouter } = require('./Router/Host-Router');
const rootdir = require('./utils/pathUtil');
const session = require('express-session');
const mongodbsession = require('connect-mongodb-session')(session);
const errorcontroller = require("./controller/error");
const { mongoConnect } = require('./utils/databaseutil');


// const session = require('express-session');
const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.urlencoded());



const store = new mongodbsession({
  uri: `mongodb+srv://rajansingh8593:rajan123@captanjack.rr7lw.mongodb.net/?retryWrites=true&w=majority&appName=Captanjack`,
  collection: 'sessions'
});


const io = new Server(server);
const connectedUsers = {}; // Map: email -> socket.id

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. User registers their socket with their email
  socket.on("register-user", (email) => {
    connectedUsers[email] = socket.id;
    console.log(`Registered ${email} to ${socket.id}`);
  });

  // 2. Handle Text Messages
  socket.on("user-message", async (data) => {
    // Broadcast to everyone (existing logic - maybe refine later to specific user if needed)
    // For now, keeping it as is for chat compatibility, or we I'll check if we should target specific user.
    // The existing chat seems to listen to "message".
    io.emit("message", data);
  });

  // 3. Video Call Signals
  socket.on("call-user", (data) => {
    // data: { userToCall: email, signalData: offer, from: email }
    const targetSocketId = connectedUsers[data.userToCall];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-user", { signal: data.signalData, from: data.from });
    } else {
      // Optional: emit 'user-unavailable'
    }
  });

  socket.on("answer-call", (data) => {
    // data: { to: email, signal: answer }
    const targetSocketId = connectedUsers[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", data.signal);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove user from map
    for (const [email, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) {
        delete connectedUsers[email];
        break;
      }
    }
  });
});



app.use(session({
  secret: 'your_secret_key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  store: store,
}));





app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.userType = req.session.userType;
  res.locals.username = req.session.username;
  res.locals.email = req.session.email;
  res.user = req.session.user; // locals hata de agar kaam nhai kar raha hai to
  next();
})


app.use(Userrouter);
app.use(Hostrouter);


app.use(express.static(path.join(rootdir, 'public')));
app.use(errorcontroller.Error404);



const port = 3001;
mongoConnect(() => {
  server.listen(port, () => {
    console.log(`server Started At: http://localhost:${port}/home`);
  });
})
