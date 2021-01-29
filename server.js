
var hat = require('hat')
const ServerVariables  = require("./ServerVariables").ServerVariables;
var config = require('./config.js')
var event = require('./events.js').events
var publicGame=require("./publicGame")
var privateGame=require("./privateGame")
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
  //socket.emit('token-offer', twilioClient.tokens.create().then(token => console.log(token.iceServers)))
  
  //for p2p
  //twilioClient.tokens.create().then(token => socket.emit(event.turnServerTokenOffer,token.iceServers))
  
  
  //console.log("new client %s", socket.id)

  publicGame.addPublicEvents(socket, io);
  privateGame.addPrivateGameEvents(socket, io);


  socket.on(event.startGame, function (data) {  //called by private game intitatior
   
    game.startGame(socket,io);
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
    //remove room and room name from set.
    if (typeof socket.currentRoom !== 'undefined'){
    var room = socket.currentRoom
    if(room.private===false){
      ServerVariables.numActivePublicPlayers--; 
      //socket.emit(event.ServerVariables.numActivePublicPlayers,{numPlayers: ServerVariables.numActivePublicPlayers})
    }

    room.players.splice(room.players.indexOf(socket), 1) //remove player from room
    
    rooms.removeRoom(room)
    io.to(room.name).emit('disconnected-player')
    }
  })

  


})





