var event = require('./events').events;

function startGame(socket, io){

  if (socket.currentRoom){
    var players = socket.currentRoom.players;
    let playerNumbers = [];
    i=0;
    players.forEach(function (player) {
      if(!player.playerName){//the playerName will be null if its a public game, so use socket id
        player.playerName=player.id
      }
      player.playerNumber=i;
      playerNumbers.push({playerNumber: i, playerName: player.playerName })
      player.emit(event.playerNumber, {playerNumber: i, playerName: player.playerName, numberOfPlayersInRoom: socket.currentRoom.playerCount })  // send each player their number      
      i++;
    }
  )
  io.to(socket.currentRoom.name).emit(event.playerNumbers, {playerNumbers:playerNumbers})//send all players everyones number
  }

  socket.currentRoom.gameInSession=true;
  //emit to everyone to start
  io.to(socket.currentRoom.name).emit(event.startGame)
}





module.exports = {
  startGame
  
};