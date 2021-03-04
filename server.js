
var hat = require('hat')
const ServerVariables  = require("./ServerVariables").ServerVariables;
var config = require('./config.js')
var event = require('./events.js').events
const publicGame=require("./publicGame")
const privateGame=require("./privateGame")
var game= require("./game");
const rooms = require ("./rooms");
var express = require('express')
const { emit } = require('process')
var app = express()
var server = require('http').Server(app)
app.use(express.static(__dirname+'/public'))

var p2pserver = require('./socket.io-p2p-custom-server').Server
var io = require('socket.io')(server)


//for p2p negotiation
//const accountSid = process.env.TWILIO_ACCOUNT_SID|| 'AC27b517f7a37b55cae9e8939691a1425a' ; invalid tokens
//const authToken = process.env.TWILIO_AUTH_TOKEN|| '83b60ace20384a2b4586fc9d7c0755d7'; //invalid tokens
//const twilioClient = require('twilio')(accountSid, authToken);
//twilioClient.tokens.create().then(token => console.log(token.iceServers));


server.listen(config.serverInfo.port, function () {
  console.log('Listening on %s', config.serverInfo.port)
})

//io.use(p2pserver)



io.on('connection', function (socket) {
  ServerVariables.clients[socket.id] = socket
  console.log("new client %s", socket.id)
  console.log("number public players %s", ServerVariables.numActivePublicPlayers)
  //socket.emit('token-offer', twilioClient.tokens.create().then(token => console.log(token.iceServers)))
  
  //for p2p
  //twilioClient.tokens.create().then(token => socket.emit(event.turnServerTokenOffer,token.iceServers))
  
  
  //console.log("new client %s", socket.id)

  publicGame.addPublicEvents(socket, io);
  privateGame.addPrivateGameEvents(socket, io);


  socket.on(event.initiatorSaysToStartGame, function (data) {  //called by private game intitatior
   
    //game.startGame(socket,io);

    io.to(socket.currentRoom.name).emit(event.getReady)

  })

  

  socket.on(event.gameData, function (data) { 
    
    //send to other players
    if (socket.currentRoom){
      var players = socket.currentRoom.players.filter(function (player) {
        return player !== socket
      })
      players.forEach(function (player) {
        player.emit(event.gameData, data)
      })
    }
  })



  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    //socket.rooms.emit('peer-msg', data)
    if (socket.currentRoom){
    var players = socket.currentRoom.players.filter(function (player) {
      return player !== socket
    })
    players.forEach(function (player) {
      player.emit('peer-msg', data)
    })
  }
  })



  socket.on('go-private', function (data) {
    socket.broadcast.emit('go-private', data)
  })

  socket.on('disconnect', function (data) {
   
    rooms.leaveRoomAndNotifyOthers(socket,io,privateGame,publicGame)
  })

 socket.on("disconnecting", function (data) {
   

 })


// socket.on('leave-room', function (data) {
//   rooms.leaveRoomAndNotifyOthers(socket,io,privateGame,publicGame) 
//})


socket.on('player-ready', function (data) {
  
  socket.currentRoom.numberPlayersReady++;
  if(socket.currentRoom.numberPlayersReady===socket.currentRoom.playerCount){
  game.startGame(socket,io);
  }
  
})

  

})

function emitSocketBasicEvent(socket, event, data){
 // player.emit(event.gameData, data)
}

function ioSocketBasicEvent(io, event, data){
  //io.emit(event.gameData, data)
}

module.exports = {
  emitSocketBasicEvent,
   ioSocketBasicEvent,

};



