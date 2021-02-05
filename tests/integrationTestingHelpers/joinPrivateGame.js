const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;



var io = require('socket.io-client')
var event = require('../../events').events;


var host ="http://10.42.0.145:3030/";
var room_name= "bTbQ8"; //provide roomname

var socket1 = io(host);
var socket2 = io(host);


describe("Join Private Game", function() {

    
 
    
    describe("join to sockets to the same private game", function() {
    init(socket1,0);
    init(socket2,1);

    it(" two players joining", function(){
        chai.assert(socket2.connected);
        chai.assert(socket1.connected);
    socket1.emit(event.joinPrivateGameRoom, {playerName:"Alpha", room_name })
    socket2.emit(event.joinPrivateGameRoom, {playerName:"Beta", roomName: room_name })
    });

  


    });

});


var numTimesPlayerNumbersEvent=0;
function init(socket, playerNumber){
    
    socket.on(event.privategGameRoomRequestComplete, function (data) {
        console.log('gameRoom request complete ')
       
             
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