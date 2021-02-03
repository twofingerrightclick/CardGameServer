const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;



var io = require('socket.io-client')
var event = require('../events').events;


var host ="http://10.42.0.145:3030/"

var initiatorSocket = io(host);
var joiningPlayerSocket = io(host);

describe("PrivateGameWaitingRoomEvents", function() {
 
    describe("playerNumbeReturned", function() {
    initCreatorSocket(initiatorSocket);
    initJoinSocket(joiningPlayerSocket);

    it("sockets should recived all names in the room upon joining a game", function(){
        chai.assert(initiatorSocket.connected);
        chai.assert(joiningPlayerSocket.connected);
    initiatorSocket.emit(event.createPrivateGameRoom, {playerName: "initiatorName", gameType:"fives" });
    });

   });

});


let roomName;

function initCreatorSocket(socket){
    
    socket.on(event.privategGameRoomRequestComplete, function (data) {
        console.log('%s game room name. Is initiator %s', data.gameRoomName,data.initiator)
        chai.assert(data.gameRoomName)
        expect(data.initiator).to.equal(true);
        
        roomName= data.gameRoomName;
        haveJoinSocketJoin();
             
    })


    socket.on(event.playerJoined, function (data) {
        console.log('playerJoined event for creatorSocket');     
    })

}

function initJoinSocket(socket){
    
    socket.on(event.playerJoined, function (data) {
        console.log('playerJoined event for joinsocket ')

        playerNames= data.playerNames;
        playerNames.forEach(player => {
            console.log('player %s, initiator: ',player.playerName, player.initiator)

            if(player.initiator){
                expect(player.playerId).to.equal(initiatorSocket.id);
            }
        });        
         cleanUp([initiatorSocket,joiningPlayerSocket]);    
    })

}

function haveJoinSocketJoin(){
    joiningPlayerSocket.emit(event.joinPrivateGameRoom, {playerName:"joinSocket", roomName:roomName })
}

function cleanUp(sockets){

sockets.forEach(socket => {
    socket.disconnect();
});
}