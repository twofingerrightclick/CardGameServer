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



      socket.on(event.createPrivateGameRoom, function (data) {
    
        var room = rooms.createRoom({private:true, minPlayersRequiredForGame: data.minNumberPlayers, maxPlayersRequiredForGame: data.maxNumberPlayers, gameType:data.gameType})
        //socket.leaveAll()
        rooms.removePreviousRoom(socket)
        socket.join(room.name)
        room.playerCount++
        room.players.push(socket)
        room.intitiator=socket
        socket.currentRoom=room
        //p2pserver(socket, null, room)
        socket.emit(event.privategGameRoomRequestComplete, {gameRoomName: room.name, intitiator: true})
      })

}

function filterPlayerName(name){

    if(name){
    if(name.length>13) return name.substr(0,13)
    }
    
    return name
  
  }





    module.exports = {
        addPrivateGameEvents: addPrivateGameEvents,
        
      };