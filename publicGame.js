const ServerVariables  = require("./ServerVariables").ServerVariables;
var event = require('./events.js').events
const rooms = require ("./rooms");
var game= require("./game");

function addPublicEvents(socket,io){

    socket.on('public-game-room-request', function (data) {
    
        var room = rooms.findPublicRoom(data.minPlayersRequiredForGame, data.gameType)
        //socket.leaveAll()
        if(room){
        ServerVariables.numActivePublicPlayers++;
        socket.emit(event.numActivePublicPlayers, {numPlayers: ServerVariables.numActivePublicPlayers})//emit to everyone before joining a room
        rooms.removePreviousRoom(socket)
        socket.join(room.name)
        room.playerCount++
        room.players.push(socket)
        socket.currentRoom=room
       
       
        socket.emit(event.publicGameRoomRequestComplete, {gameRoomName: room.name})
        //p2pserver(socket, null, room)  
        updatePlayerList(socket,io,true)
        if (room.playerCount===data.minPlayersRequiredForGame){
    
          //p2pserver(player, null, room)    
          io.to(socket.currentRoom.name).emit(event.getReady);
        }      
        }
        else{
          console.error("gameType wasn't defined when trying to join a public room");
          socket.emit('error_', "gameType or minPlayersRequiredForGame wasn't defined - cannot find public room")
        }
      })
      

     

}


function updatePlayerList(socket,io,includeThisPlayerName){

  if (!socket.currentRoom) return;

  var players = socket.currentRoom.players;

    let playerNames = [];    
    players.forEach(function (player) {
      if(!player.playerName){//the playerName will be null if its a public game, so use socket id
        player.playerName=player.id
      }
      if(includeThisPlayerName===false){
        if(player.playerName==socket.playerName) return; //skip iteration
      }
      playerNames.push({ playerName: player.playerName, playerId: player.id });
    });
      
    io.to(socket.currentRoom.name).emit(event.roomPlayerCountUpdate, {playerNames: playerNames });       
      
}



function publicPlayerDisconnecting(socket,io){
  
  ServerVariables.numActivePublicPlayers--;


  if(socket.currentRoom.gameInSession !== true ){
    
    updatePlayerList(socket,io,false);
  }
  else{

    io.to(socket.currentRoom.name).emit(event.publicPlayerDisconnected, {playerName: socket.name});
  }
    

}

module.exports = {
    publicPlayerDisconnecting,
    addPublicEvents 
  };
