
var hat = require('hat')
var config = require('./config.js')
var event = require('./events.js').events
var express = require('express')
var app = express()
var server = require('http').Server(app)
app.use(express.static(__dirname+'/public'))

var p2pserver = require('./socket.io-p2p-custom-server').Server
var io = require('socket.io')(server)



const accountSid = process.env.TWILIO_ACCOUNT_SID|| 'AC27b517f7a37b55cae9e8939691a1425a' ;
const authToken = process.env.TWILIO_AUTH_TOKEN|| '83b60ace20384a2b4586fc9d7c0755d7';
const twilioClient = require('twilio')(accountSid, authToken);

twilioClient.tokens.create().then(token => console.log(token.iceServers));


server.listen(config.serverInfo.port,'10.42.0.145', function () {
  console.log('Listening on %s', config.serverInfo.port)
})

//io.use(p2pserver)

var publicRooms = []
var privateRooms = []
var usedRoomNames = new Set(); 
var clients = {}

io.on('connection', function (socket) {
  clients[socket.id] = socket
  console.log("new client %s", socket.id)
  //socket.emit('token-offer', twilioClient.tokens.create().then(token => console.log(token.iceServers)))
  
  twilioClient.tokens.create().then(token => socket.emit(event.turnServerTokenOffer,token.iceServers))
  
  
  //console.log("new client %s", socket.id)

  socket.on(event.createPrivateGameRoom, function (data) {
    
    var room = createRoom({private:true, minPlayersRequiredForGame: data.minNumberPlayers, maxPlayersRequiredForGame: data.maxNumberPlayers, gameType:data.gameType})
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)
    room.intitiator=socket
    socket.currentRoom=room
    //p2pserver(socket, null, room)
    socket.emit(event.privategGameRoomRequestComplete, {gameRoomName: room.name, intitiator: true})
  })

  socket.on('public-game-room-request', function (data) {
    
    var room = findPublicRoom(data.minPlayersRequiredForGame, data.gameType)
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)
    socket.currentRoom=room
   
    
    socket.emit(event.publicGameRoomRequestComplete, {gameRoomName: room.name})
    //p2pserver(socket, null, room)  
    if (room.playerCount===data.minPlayersRequiredForGame){

      //p2pserver(player, null, room)    
    io.to(room.name).emit(event.startGame, {msg: 'public room'+room.name})
      

    }
  })


  socket.on(event.startGame, function (data) { 
    //p2pserver(socket, null, room)  
    io.to(socket.currentRoom.name).emit(event.startGame)

    
  })


  socket.on(event.joinPrivateGameRoom, function (data) {
    
    var room = findPrivateRoom(data.roomName)
    socket.playerName=filterPlayerName(data.playerName)
    if (room){
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.currentRoom=room
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)

    var minPlayersRequiredForGame=2

    socket.emit(event.playerJoined, {playerName: room.intitiator.playerName}) //tell the new player the intiators name 
      //p2pserver(player, null, room)      
    io.to(room.name).emit(event.playerJoined, {playerName: socket.playerName, numPlayers: room.playerCount})
  
    if (room.playerCount==minPlayersRequiredForGame){
      room.intitiator.emit(event.gameReadyToPlay)
  }
  }
  else socket.emit(event.unableToFindRoom)


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
    room.players.splice(room.players.indexOf(socket), 1)
    
    removeRoom(room)
    io.to(room.name).emit('disconnected-player')
    }
  })


})

function filterPlayerName(name){

  if(name){
  if(name.length>13) return name.substr(0,13)
  }
  
  return name

}

function createRoom (data) {
    var name ='';
  do {
   name =  generateRoomName()
  } while (usedRoomNames.has(name))
  usedRoomNames.add(name);

    var room = {players: [], playerCount: 0, name: name, private: data.private, gameType: data.gameType, minPlayersRequiredForGame:data.minPlayersRequiredForGame, maxPlayersRequiredForGame:data.maxPlayersRequiredForGame}
    addRoom(room)
  
  return room;
}

function generateRoomName (){
  var length = 5;
  var randomChars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz023456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

function findPublicRoom (requiredNumPlayers, gameType) {
  if(gameType){
  var availiblePublicRoom = publicRooms.filter(function(room) { return (room.playerCount < requiredNumPlayers && room.gameType===gameType)})[0];
  if(availiblePublicRoom){
    return availiblePublicRoom
  }
  else{
    availiblePublicRoom = createRoom({private:false, gameType:gameType, minPlayersRequiredForGame:requiredNumPlayers});
    addRoom(availiblePublicRoom)
  }
  return availiblePublicRoom
}
else{
  console.error("gameType wasn't defined when trying to join a public room");
  socket.emit('error', 'gameType was defined - cannot find public room')
}
}

function findPrivateRoom (roomName) {
  return privateRooms.filter(function(room) { return room.name === roomName })[0];
}

function removeRoom (room) {


  var indexOfRoom = publicRooms.indexOf(room)
  room.playerCount--

  
  
  if (room.private ===true ) {
    indexOfRoom = privateRooms.indexOf(room)

  if (room.playerCount === 0){ 
    privateRooms.splice(privateRooms.indexOf(room), 1)
    usedRoomNames.delete(room.name)
  }
  else{
    privateRooms[privateRooms.indexOf(room)].playerCount=room.playerCount
  }
 
  }

  else if (room.private === false){
  if (room.playerCount === 0) publicRooms.splice(publicRooms.indexOf(room), 1)
  
  else{
    publicRooms[publicRooms.indexOf(room)].playerCount=room.playerCount
  }
}

  else console.error(" removeRoom() Room wasn't removed as its private property wasn't set");
}

function addRoom (room) {
  if (room.private === true){
    return privateRooms[privateRooms.push(room) - 1]
  }
  else if (room.private===false){
    return publicRooms[publicRooms.push(room) - 1]
  }
  
}


function removePreviousRoom (socket) {

  if(socket.currentRoom){

    removeRoom(socket.currentRoom)

  }

}

