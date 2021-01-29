const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;



var io = require('socket.io-client')
var event = require('../events').events;


var host ="http://10.42.0.145:3030/"

describe("PublicGamePlayerNumber", function() {

    
    var socket = io(host);
    var socket2 = io(host);
    console.log('hello')

    init(socket);
    init(socket2);

    socket.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })
    socket2.emit(event.publicGameRoomRequest, {minPlayersRequiredForGame:2, gameType:"fives" })

     
});


function init(socket){

    socket.on(event.playerNumber, function (data) {
        console.log('%s player number %s', data.playerName,data.playerNumber)
        socket.disconnect();
    })
}