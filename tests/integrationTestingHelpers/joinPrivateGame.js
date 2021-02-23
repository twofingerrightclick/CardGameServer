const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;



var io = require('socket.io-client')
var event = require('../../events').events;


var host ="http://10.42.0.145:3030/";
var room_name= "VQc7U"; //provide roomname

var socket1 = io(host);
var socket2 = io(host);


describe("Join Private Game", function() {

    
 
    
    describe("join to sockets to the same private game", function() {
    init(socket1,0);
    init(socket2,1);

    it(" two players joining", function(){
        setTimeout(function(){chai.assert(socket2.connected)},100);
        setTimeout(function(){ chai.assert(socket1.connected)},100);
        setTimeout(function(){ socket1.emit(event.joinPrivateGameRoom, {playerName:"Alpha", roomName: room_name }) },2000);
        setTimeout(function(){ socket2.emit(event.joinPrivateGameRoom, {playerName:"Beta", roomName: room_name }) },1000);
       
    
    });

    });

});

function joinPrivateGame(socket, playerName){
    socket.emit(event.joinPrivateGameRoom, {playerName:playerName, roomName: room_name })
    
}

var numTimesPlayerNumbersEvent=0;
function init(socket, playerNumber){
    
    socket.on(event.privateGameRoomRequestComplete, function (data) {
        console.log('gameRoom request complete ')
        numTimesPlayerNumbersEvent+=1;
        if(numTimesPlayerNumbersEvent>1) {
            
            console.log("cleaning up")
            cleanUp([socket1,socket2]);
            
        }
    })

    socket.on(event.roomPlayerCountUpdate, function (data) {
        console.log('player names: %s', data.playerNames)
        
        //expect(data.playerNumbers[0].playerName).to.equal(socket1.id); // this may not always be the case
        //expect(data.playerNumbers[1].playerName).to.equal(socket2.id);
       
        console.log(numTimesPlayerNumbersEvent)
        
        
    })

}

function cleanUp(sockets){

    sockets.forEach(socket => {
        setTimeout(function(){socket.disconnect()},10000);
    });
    }