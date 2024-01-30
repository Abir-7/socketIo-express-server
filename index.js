const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express()
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: '*',
  methods: ["GET", "POST"],
});

app.use(express.json())
app.get("/", (req, res) => {
    res.send("socket server");
  });

let onlineUsers = [];

io.on("connection", (socket) => {

  socket.on("users", (email) => {
    //console.log('A user connected ',socket.id,email)
    const isExist = onlineUsers.find((user) => user.email == email);
    if (!isExist && email) {
      onlineUsers.push({ email: email, socketID: socket.id });
      io.emit("connectedUsers", onlineUsers);
    }
  });

  //recive msg from sender and send to reciver person
  socket.on("msgFromSender", (data) => {
    io.to(data.receverSocketID.socketID).emit("reciver", {
      connectionID: data.connectionID,
      msgData: data.msgData,
    });
    io.to(data.senderSocketID.socketID).emit("reciver", {
      connectionID: data.connectionID,
      msgData: data.msgData,
    });
  });

  //recive friend req
  socket.on('pendingReq',(data)=>{
    console.log(data)
    const isExist = onlineUsers.find((user) => user.email == data.reciver.email)
    if(isExist){
      io.to(isExist.socketID).emit('pendingReqs',data.msg)
    }
  })
// accept connection status 

socket.on('connectionStatus',(data=>{
  const isExist = onlineUsers.find((user) => user.email == data.email)
  if(isExist){
    io.to(isExist.socketID).emit('connection_Status',data.msg)
  }
}))

//real time add task
socket.on('taskAdded',(data=>{
  io.emit('newTaskAdded',data)
}))

//real time task delete
socket.on('taskDeleted',(data=>{
  io.emit('deletedTask',data)
}))

  socket.on("disconnect", () => {

    console.log('user disconnected',socket.id);

    onlineUsers = onlineUsers.filter((user) => user.socketID !== socket.id);
    io.emit("connectedUsers", onlineUsers);
    //console.log(onlineUsers,'after dc',)
  });

});


  const port = process.env.PORT || 4000;

  httpServer.listen(port, () => {
    console.log(`task-managemnet app listening on port ${port}`);
  });
  