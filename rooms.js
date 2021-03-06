const ServerVariables  = require("./ServerVariables").ServerVariables;
var config = require('./config.js');


function createRoom (data) {
    var name ='';
  do {
   name =  generateRoomName()
  } while (ServerVariables.usedRoomNames.has(name))
  ServerVariables.usedRoomNames.add(name);

    var room = {players: [], playerCount: 0, name: name, private: data.private, gameType: data.gameType, minPlayersRequiredForGame:data.minPlayersRequiredForGame, maxPlayersRequiredForGame:data.maxPlayersRequiredForGame, numberPlayersReady:0}
    addRoom(room)
  
  return room;
}

function generateRoomName (){
  
  var length = 5;
  var randomChars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz023456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

function findPublicRoom (requiredNumPlayers, gameType) {
  if(gameType && requiredNumPlayers){
  var availiblePublicRoom = ServerVariables.publicRooms.filter(function(room) { return (room.gameInSession!==true 
    && room.playerCount < requiredNumPlayers 
    && room.gameType==gameType 
    && room.minPlayersRequiredForGame==requiredNumPlayers)})[0];
  if(availiblePublicRoom){
    return availiblePublicRoom
  }
  else{
    availiblePublicRoom = createRoom({private:false, gameType:gameType, minPlayersRequiredForGame:requiredNumPlayers});
    addRoom(availiblePublicRoom)
    return availiblePublicRoom
  }
  
}
 //return nothing if not able to find room
 return
}

function findPrivateRoom (roomName) {
  return ServerVariables.privateRooms.filter(function(room) { return room.name === roomName })[0];
}

function removeRoom (room) {


  var indexOfRoom;
  room.playerCount--;

  
  
  if (room.private ===true ) {
    indexOfRoom = ServerVariables.privateRooms.indexOf(room)

    if (room.playerCount === 0){ 
      ServerVariables.privateRooms.splice(indexOfRoom,1)
      ServerVariables.usedRoomNames.delete(room.name)
     
    }
    else{
      ServerVariables.privateRooms[indexOfRoom].playerCount=room.playerCount;
    }
 
  }
  

  else if (room.private === false){
    indexOfRoom= ServerVariables.publicRooms.indexOf(room)
    if (room.playerCount === 0) {
      ServerVariables.publicRooms.splice(indexOfRoom,1);
      ServerVariables.usedRoomNames.delete(room.name);
    }
    else{
      ServerVariables.publicRooms[indexOfRoom].playerCount=room.playerCount
    }
}

  else console.error(" removeRoom() Room wasn't removed as its private property wasn't set");
  console.log("size of usedRoomnames %s", ServerVariables.usedRoomNames.size);
}

function addRoom (room) {
  if (room.private === true){
    return ServerVariables.privateRooms[ServerVariables.privateRooms.push(room) - 1]
  }
  else if (room.private===false){
    return ServerVariables.publicRooms[ServerVariables.publicRooms.push(room) - 1]
  }
  
}

//take the socket out of the room it was in
function removePreviousRoom (socket) {

  
  if(socket.currentRoom){
    socket.leave(socket.currentRoom); //leave the room at the socket.io level (socket.io has a rooms variable)
    removeRoom(socket.currentRoom)
  }
  

}


function leaveRoomAndNotifyOthers(socket,io,privateGame,publicGame){

  if (typeof socket.currentRoom !== 'undefined'){
    var room = socket.currentRoom
  
    if(socket.currentRoom){
      if(socket.currentRoom.private===true)
      {
        privateGame.privatePlayerDisconnecting(socket,io)
      }
    }
    //socket.leave(room); //socket.io socket itself has a rooms variable. leave will manage that variable
    if(room.private===false){
      publicGame.publicPlayerDisconnecting(socket,io)
      
      //io.emit(event.numActivePublicPlayers,{numPlayers: ServerVariables.numActivePublicPlayers})
    }
  
    //remove rooms
    room.players.splice(room.players.indexOf(socket), 1) //remove player from room 
    removeRoom(room)
    
    }

}


module.exports = {
  findPublicRoom,
  findPrivateRoom,
   removePreviousRoom,
   createRoom,
   removeRoom,
   leaveRoomAndNotifyOthers
};