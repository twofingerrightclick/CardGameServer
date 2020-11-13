var ecstatic = require('ecstatic')
var hat = require('hat')
var config = require('./config.js')
var server = require('http').createServer(
  ecstatic({ root: __dirname+'/public', handleError: false })
)
var p2pserver = require('./socket.io-p2p-custom-server').Server
var socketIO = require('socket.io')
var io = socketIO(server)


const accountSid = process.env.TWILIO_ACCOUNT_SID|| 'AC27b517f7a37b55cae9e8939691a1425a' ;
const authToken = process.env.TWILIO_AUTH_TOKEN|| '83b60ace20384a2b4586fc9d7c0755d7';
const twilioClient = require('twilio')(accountSid, authToken);

twilioClient.tokens.create().then(token => console.log(token.iceServers));


server.listen(config.serverInfo.port, function () {
  console.log('Listening on %s', config.serverInfo.port)
})

//io.use(p2pserver)

var publicRooms = []
var privateRooms = []
var usedRoomNames = new Set(); 
var clients = {}

io.on('connection', function (socket) {
  clients[socket.id] = socket

  //socket.emit('token-offer', twilioClient.tokens.create().then(token => console.log(token.iceServers)))
  twilioClient.tokens.create().then(token => socket.emit('token-offer',token.iceServers))
  console.log("new client %s", socket.id)

  socket.on('private-game-room-request', function (data) {
    
    var room = createRoom({private:true, numPlayersRequiredForGame: data.numPlayersRequiredForGame, gameType:data.gameType})
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)
    socket.currentRoom=room
    //p2pserver(socket, null, room)
    socket.emit('game-room-request-complete', {gameRoomName: room.name})
  })

  socket.on('public-game-room-request', function (data) {
    
    var room = findPublicRoom(data.numPlayersRequiredForGame, data.gameType)
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)
    socket.currentRoom=room
   
    
    socket.emit('game-room-request-complete', {gameRoomName: room.name})
    p2pserver(socket, null, room)  
    if (room.playerCount===data.numPlayersRequiredForGame){

      var players = socket.currentRoom.players

    players.forEach(function (player) {
      //p2pserver(player, null, room)    
      player.emit('game-ready-to-play', {msg: 'public room '+room.name})
      
      
    })

    }
  })


  socket.on('join-private-game-room', function (data) {
    
    var room = findPrivateRoom(data.roomName)
    if (room){
    //socket.leaveAll()
    removePreviousRoom(socket)
    socket.currentRoom=room
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)

   

    var numPlayersRequiredForGame=2
    if (room.playerCount==numPlayersRequiredForGame ){
   
    var players = socket.currentRoom.players

    players.forEach(function (player) {  
      p2pserver(player, null, room)      
      player.emit('game-ready-to-play', {msg: 'private room '+room.name, gameType: room.gameType})

     
    })

    }
  }
  else socket.emit('unable-to-find-room', 'data')

  //now do signaling after ready to play message
  //p2pserver(socket, null, room)

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

function createRoom (data) {
    var name ='';
  do {
   name =  generateRoomName()
  } while (usedRoomNames.has(name))
  usedRoomNames.add(name);

    var room = {players: [], playerCount: 0, name: name, private: data.private, gameType: data.gameType, numPlayersRequiredForGame:data.numPlayersRequiredForGame}
    addRoom(room)
  
  return room;
}

function generateRoomName (){
  var length = 5;
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
    availiblePublicRoom = createRoom({private:false, gameType:gameType, numPlayersRequiredForGame:requiredNumPlayers});
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

