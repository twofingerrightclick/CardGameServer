const ServerVariables  = require("./ServerVariables").ServerVariables;
var event = require('./events.js').events
const rooms = require ("./rooms");

function addPublicEvents(socket){

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
        if (room.playerCount===data.minPlayersRequiredForGame){
    
          //p2pserver(player, null, room)    
        io.to(room.name).emit(event.startGame, {msg: 'public room'+room.name})
        }      
        }
        else{
          console.error("gameType wasn't defined when trying to join a public room");
          socket.emit('error_', "gameType or minPlayersRequiredForGame wasn't defined - cannot find public room")
        }
      })
      

      socket.on(event.publicGameWaitingRoomPlayerLeft, function (data) { //when a user presses the back button in the waiting room
        //remove room and room name from set.
        if (typeof socket.currentRoom !== 'undefined'){
        var room = socket.currentRoom
        if(!room.private){
          ServerVariables.numActivePublicPlayers--; 
          socket.emit(event.ServerVariables.numActivePublicPlayers,{numPlayers: ServerVariables.numActivePublicPlayers})
        }
    
        room.players.splice(room.players.indexOf(socket), 1)
        
        rooms.removeRoom(room)
        io.to(room.name).emit('disconnected-player')
        }
      })


}

module.exports = {
    addPublicEvents: addPublicEvents,
    
  };
