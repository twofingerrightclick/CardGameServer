const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;



var io = require('socket.io-client')
var event = require('../events').events;


var host ="http://10.42.0.145:3030/"

var socket1 = io(host);
var socket2 = io(host);

describe("PublicGameStart", function() {

    
 
    
    describe("playerNumbeReturned", function() {
    init(socket1,0);
    init(socket2,1);

    it("socket should get a player number and its name back", function(){
    socket1.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
    socket2.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
    });

    it("socket should get all player names and IDs back", function(){
        socket1.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
        socket2.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
        });


    });

});





function init(socket, playerNumber){
    
    socket.on(event.playerNumber, function (data) {
        console.log('%s player number %s', data.playerName,data.playerNumber)
        expect(data.playerNumber).to.equal(playerNumber);
        expect(data.playerName).to.equal(socket.id);
             
    })

    socket.on(event.playerNumbers, function (data) {
        console.log('%s player number %s', data.playerName,data.playerNumber)
        expect(data.playerNumbers[0].playerName).to.equal(socket1.id);
        expect(data.playerNumbers[1].playerName).to.equal(socket2.id);
        
        
        
    })

}