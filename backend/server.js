const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const { Server, Socket } = require( "socket.io");

var cors = require('cors')


const app = express();
const server = require('http').createServer(app);
const port = 8080;

const options = {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
};
const io = new Server(server, options);

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

var parties = [];

// Create a new session
app.post('/create', async (req, res) => {
  const { videoUrl } = req.body;
  const sessionId = uuidv4();

  // Create session object
  const session = {
    id: sessionId,
    videoUrl: videoUrl,
    paused: false,
    currentTime: 0,
    guests: new Set(),
  };
  
  // await redisClient.set(sessionId, JSON.stringify(session));
  parties.push(session);

  res.json({
    sessionId: sessionId,
  })
});

// Watch session route
app.get('/watch/:sessionId', async (req, res) => {
  // const { guid } = req.cookies.identifier_token;
  const sessionId = req.params.sessionId;
  //const session = await redisClient.get(sessionId);

  let session = parties.find((session) => session.id === sessionId);;

  console.log(session);
  if (!session) {
    return res.status(404).send('Session not found');
  }

  res.json(session);
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (sessionId) => {
    // Add the client to the session
    socket.join(sessionId);
    const session = parties.find((session) => session.id === sessionId);
    if (session) {
      session.guests.add(socket.id);
      console.log("found an existing session");
      if (session.paused) {
        socket.emit("pause", session.currentTime);
      } else {
        socket.to(sessionId).emit("pollTimestamp", socket.id);
      }
    }
    console.log(`User joined session: ${sessionId}`);
  });

  socket.on("pause", (sessionId, timestamp) => {
    const session = parties.find((session) => session.id === sessionId);
    if (session && !session.paused) {
      session.paused = true;
      session.currentTime = timestamp;
      socket.to(sessionId).emit("pause", timestamp);
    }
  });

  socket.on("play", (sessionId, timestamp) => {
    const session = parties.find((session) => session.id === sessionId);
    if (session && session.paused) {
      session.paused = false;
      session.currentTime = timestamp;
      socket.to(sessionId).emit("play", timestamp);
    }
  });

  socket.on("updateTime", (sessionId, timestamp) => {
    const session = parties.find((session) => session.id === sessionId);
    if (session) {
      session.currentTime = timestamp;
      socket.to(sessionId).emit("play", session.currentTime);
    }
  });

  socket.on("leave", (sessionId) => {
    socket.leave(sessionId);
    console.log(`User left session: ${sessionId}`);
  });

  // garbage collection on empty rooms
  socket.on("disconnecting", (data) => {
    console.log(socket.rooms); // the Set contains at least the socket ID

    let newParties = parties;
    parties.map((session) => {
      // if room is empty, rm from parties
      if (session.guests.has(socket.id)) {
        session.guests.delete(socket.id);
        if (session.guests.size != 0) {
          newParties.push(session);
        }
      }
    });
    parties = newParties;
  });
});


// Start the server
server.listen(port, () => console.log(`listening on port: ${port}`))
