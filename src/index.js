var Socketiop2p = require('../SocketIOP2PIndex')
var io = require('socket.io-client')
var event = require('../events').events

function init () {
  var socket = io()
  
  useSocket(socket)

   socket.on('token-offer', function(iceServers){ 
      
      var opts = { 
        peerOpts: {config: iceServers, trickle: true},
        //peerOpts: {trickle: true, initiator: false},
        autoUpgrade: true}
      
      
    
    })

    function useSocket(socket){

  

  // Elements
  var privateButton = document.getElementById('private')
  var form = document.getElementById('msg-form')
  var box = document.getElementById('msg-box')
  var boxFile = document.getElementById('msg-file')
  var msgList = document.getElementById('msg-list')
  var upgradeMsg = document.getElementById('upgrade-msg')

  var joinPublicButton = document.getElementById('join-public-button')

  var gameCodeButton = document.getElementById('game-code-button')
  var gameCodeField = document.getElementById('game-code-field')

  var gameRoomNameInput = document.getElementById('game-room-name-input')
  var joinRoomButton = document.getElementById('join-room-button')
  


  socket.on('peer-msg', function (data) {
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(data.textVal))
    msgList.appendChild(li)
  })



  socket.on(event.startGame, function (data) {
    
    
    form.style.visibility='visible';
    console.log(data.msg)
    

  })



  socket.on('peer-file', function (data) {
    var li = document.createElement('li')
    var fileBytes = new Uint8Array(data.file)
    var blob = new window.Blob([fileBytes], {type: 'image/jpeg'})
    var urlCreator = window.URL || window.webkitURL
    var fileUrl = urlCreator.createObjectURL(blob)
    var a = document.createElement('a')
    var linkText = document.createTextNode('New file')
    a.href = fileUrl
    a.appendChild(linkText)
    li.appendChild(a)
    msgList.appendChild(li)
  })

  form.addEventListener('submit', function (e, d) {
    e.preventDefault()
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(box.value))
    msgList.appendChild(li)
    if (boxFile.value !== '') {
      var reader = new window.FileReader()
      reader.onload = function (evnt) {
        socket.emit('peer-file', {file: evnt.target.result})
      }
      reader.onerror = function (err) {
        console.error('Error while reading file', err)
      }
      reader.readAsArrayBuffer(boxFile.files[0])
    } else {
      socket.emit('peer-msg', {textVal: box.value})
    }
    box.value = ''
    boxFile.value = ''
  })


// Game code 

  gameCodeButton.addEventListener('click', function () {
      socket.emit('private-game-room-request', {numPlayersRequiredForGame:2, gameType: 'fives'})
      //socket.peerOpts.initiator=true;
      
  })

  socket.on('game-room-request-complete', function (data) {
    gameCodeField.textContent = data.gameRoomName
  })


 

  //click join by name
  joinRoomButton.addEventListener('click', function () {
   socket.emit('join-private-game-room', {roomName: gameRoomNameInput.value })     
  
})





socket.on('disconnected-player', function () {
  p2pReady=false
  socket.useSockets=true
  socket.usePeerConnection = false;
})

socket.on('reconnected-player', function () {
  //send game data back so they can contiunute playing
})







  privateButton.addEventListener('click', function (e) {
    goPrivate()
    socket.emit('go-private', true)
  })

  joinPublicButton.addEventListener('click', function (e) {
    socket.emit("public-game-room-request", {numPlayersRequiredForGame:2, gameType: 'fives'})
   
  })


  socket.on('go-private', function () {
   // goPrivate()
  })

  function goPrivate () {
    socket.useSockets = false
    upgradeMsg.innerHTML = 'WebRTC connection established!'
    privateButton.disabled = true
  }

}
}

document.addEventListener('DOMContentLoaded', init, false)
