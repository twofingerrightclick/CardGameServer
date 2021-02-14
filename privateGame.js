const ServerVariables  = require("./ServerVariables").ServerVariables;
var event = require('./events.js').events
const rooms = require ("./rooms");

function addPrivateGameEvents(socket,io){

    socket.on(event.joinPrivateGameRoom, function (data) {
    
        var room = rooms.findPrivateRoom(data.roomName)
        socket.playerName=filterPlayerName(data.playerName)
        if (room){
        //socket.leaveAll()
        rooms.removePreviousRoom(socket)
        socket.currentRoom=room
        socket.join(room.name)
        room.playerCount++
        room.players.push(socket)
        socket.initiator=false;
    
        //var minPlayersRequiredForGame=2

        updatePlayerList(socket,io);
    
        //socket.emit(event.roomPlayerCountUpdate, {playerName: room.initiator.playerName}) //tell the new player the intiators name 
          //p2pserver(player, null, room)      
        //io.to(room.name).emit(event.roomPlayerCountUpdate, {playerName: socket.playerName, numPlayers: room.playerCount})
      
        if (room.playerCount==room.minPlayersRequiredForGame){
          room.initiator.emit(event.gameReadyToPlay)
      }
      }
      else socket.emit(event.unableToFindRoom)
     
      })

      socket.on(event.createPrivateGameRoom, function (data) {
        
        if(!data.minNumberPlayers) data.minNumberPlayers=2; //default to 2 players
        if(!data.maxNumberPlayers) data.maxNumberPlayers=4; //default to 4 players

        var room = rooms.createRoom({private:true, minPlayersRequiredForGame: data.minNumberPlayers, maxPlayersRequiredForGame: data.maxNumberPlayers, gameType:data.gameType})
        //socket.leaveAll()
        socket.playerName=data.playerName;
        rooms.removePreviousRoom(socket)
        socket.join(room.name)
        room.playerCount++
        room.players.push(socket)
        room.initiator=socket
        socket.currentRoom=room
        socket.initiator=true;
        //p2pserver(socket, null, room)
        socket.emit(event.privategGameRoomRequestComplete, {gameRoomName: room.name, initiator: true})
      })

      socket.on(event.privateGameWaitingRoomPlayerLeft, function (data) {
    
        
        
        //socket.leaveAll()
        privatePlayerDisconnecting(socket);
        rooms.removePreviousRoom(socket);
        
    
        //var minPlayersRequiredForGame=2

        
    
        //socket.emit(event.roomPlayerCountUpdate, {playerName: room.initiator.playerName}) //tell the new player the intiators name 
          //p2pserver(player, null, room)      
        //io.to(room.name).emit(event.roomPlayerCountUpdate, {playerName: socket.playerName, numPlayers: room.playerCount})
      
        if (room.playerCount==room.minPlayersRequiredForGame){
          room.initiator.emit(event.gameReadyToPlay)
      }
      
      else socket.emit(event.unableToFindRoom)
     
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
      playerNames.push({ playerName: player.playerName, initiator: player.initiator, playerId: player.id });
    });
      
    io.to(socket.currentRoom.name).emit(event.roomPlayerCountUpdate, {playerNames: playerNames });       
      
}



function filterPlayerName(name){

    if(name){
    if(name.length>13) return name.substr(0,13)
    }
    
    return name
  
  }



function privatePlayerDisconnecting(socket,io){
    

  if(socket.currentRoom.gameInSession !== true ){
    if(socket.initiator==true){
      io.to(socket.currentRoom).emit(event.gameRoomDeletedByInitiator);
    }
    updatePlayerList(socket,io,false);
  }
  else{

    io.to(socket.currentRoom).emit(event.privatePlayerDisconnected, {playerName: socket.name});
  }
    

}



    module.exports = {
        addPrivateGameEvents: addPrivateGameEvents,
        privatePlayerDisconnecting, privatePlayerDisconnecting
        
      };