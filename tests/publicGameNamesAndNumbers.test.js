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
        chai.assert(socket2.connected);
        chai.assert(socket1.connected);
    socket1.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
    socket2.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
    });

    it("socket should get all player names and IDs back", function(){
        socket1.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
        socket2.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
        });


    });

});


var numTimesPlayerNumbersEvent=0;
function init(socket, playerNumber){
    
    socket.on(event.playerNumber, function (data) {
        console.log('%s player number %s', data.playerName,data.playerNumber)
        expect(data.playerNumber).to.equal(playerNumber);
        expect(data.playerName).to.equal(socket.id);
             
    })

    socket.on(event.playerNumbers, function (data) {
        console.log('player numbers')
        expect(data.playerNumbers[0].playerName).to.equal(socket1.id); // this may not always be the case
        expect(data.playerNumbers[1].playerName).to.equal(socket2.id);
        numTimesPlayerNumbersEvent+=1;
        if(numTimesPlayerNumbersEvent>1) {cleanUp([socket1,socket2]);
            console.log("cleaning up")
        }
        
    })

}

function cleanUp(sockets){

    sockets.forEach(socket => {
        socket.disconnect();
    });
    }