# Multi Player Card Game Server API

The Multi Player Card Game Server supports Public and Private Games through event broadcasting over a websocket connection that is managed on the app side by the `MultiPlayerConnector.java`. The primary role of the server is to place players in rooms. If a player is in a room they will receive events pertinent to that room. 

## MultiPlayerConnector.java
The `MultiPlayerConnector`.java is a singleton that manages an underlying Socket.io connection to the server. It allows for adding socket.on event handlers to the underlying socket. The `MultiPlayerConnector` is also observable.  When adding socket.on event handlers to the `MultiPlayerConnector`'s Socket.io `Socket`  The handler can be simply to use the `MultiPlayerConnector`'s `notifyObservers({args from socket io event})`. The observers can determine what to do with the event.



## Public Game Event flow

#### Joining a public game
To join a public room, use the `MultiPlayerConnector` to emit a `"public-game-room-request"`. 
The server expects a JSON object with an int `minPlayersRequiredForGame`, and a string `gameType`
Upon completion the server will respond to the `MultiPlayerConnector`'s Socket.io `Socket` (just Socket from here on out) with a `"public-game-room-request-complete"` event and the room name. Server side code: `socket.emit(event.publicGameRoomRequestComplete, {gameRoomName:  room.name})`

- if there is a failure then the server will respond with a `'unable-to-find-room'`.

Before a game has started (to be described next), whenever a new player joins the room or leaves the room there will also be  `'room-player-count-changed'` event. Server side code: `io.to(socket.currentRoom.name).emit('room-player-count-changed', {playerNames:  playerNames });`

After a game has started there will be a `'player-disconnected'` event: Server side code: `io.to(socket.currentRoom.name).emit(event.playerDisconnected, {playerName:  socket.name});` 

*Currently the server doesn't support reconnecting after getting disconnected - players will have to rejoin a new game session* 

Once enough players have joined the room for the  `minPlayersRequiredForGame` the server emits a `get-ready` event (`io.to(socket.currentRoom.name).emit(event.getReady`).

Upon receiving this event, do application and game setup  and once a player is ready emit a `'player-ready-for-game-data'` event. 

Once the server has received a `'player-ready-for-game-data'` from all players in the room, then the server will emit to each player a `'player_number'` event that has the following JSON values: `player.emit(event.playerNumber, {playerNumber:  i, playerName:  player.playerName, numberOfPlayersInRoom:  socket.currentRoom.playerCount })`
Followed immediately by a `'player_numbers'` event which will have a list of all the players and their numbers:
`io.to(socket.currentRoom.name).emit(event.playerNumbers, {playerNumbers:playerNumbers})`

- The server will mark the Game as in Session. (At this point the `'player-disconnected'` event will be fired instead of `'room-player-count-changed'`)

At this point it is safe to let the players start playing the game.


## Private Game Event flow

#### Joining a private game
To join a private room, use the `MultiPlayerConnector` to emit a `'join-private-game-room'`. 
The server expects a JSON object with an int `minPlayersRequiredForGame`, an int `maxNumberPlayers`,  a string `gameType`, and a string `playerName`.
Upon completion the server will respond to the `MultiPlayerConnector`'s Socket.io `Socket` (just Socket from here on out) with a `"private-game-room-request-complete"` event and the room name. Server side code: `socket.emit(event.privateGameRoomRequestComplete, {gameRoomName:  room.name, initiator:  false})`

- `initiator` signifies whether or not the player was the one who created the game room. In this case false as they are joining a game.
-  if there is a failure (the game is in session, room full, or non existent) then the server will respond with a `'unable-to-find-room'`.

Before a game has started (to be described next), whenever a new player joins the room or leaves the room there will also be  `'room-player-count-changed'` event. Server side code: `io.to(socket.currentRoom.name).emit('room-player-count-changed', {playerNames:  playerNames });`
If the `initiator` of the game leaves though, the room will be deleted on the server side and all other players will receive a `'game-room-deleted-by-initiator'`

After a game has started there will be a `'player-disconnected'` event: Server side code: `io.to(socket.currentRoom.name).emit(event.playerDisconnected, {playerName:  socket.name});` 

*Currently the server doesn't support reconnecting after getting disconnected - players will have to rejoin a new game session* 

Once enough players have joined the room for the  `minPlayersRequiredForGame` the server emits to the `intiator`  that the game is ready to be be played via the event `'game-ready-to-play'` Server side code:` room.initiator.emit(event.gameReadyToPlay)`

The initiating player should now have the option to click a button to start the game. That button then should fire a `'initiator-start-game'` event in which the server will receive and in return send to every player in the room (including the initiator)  a get-ready event ( Server Side code: 
`io.to(socket.currentRoom.name).emit(event.getReady`).

Upon receiving this event, do application and game setup and once a player is ready emit a `'player-ready-for-game-data'` event. 

Once the server has received a `'player-ready-for-game-data'` from all players in the room, then the server will emit to each player a `'player_number'` event that has the following JSON values: `player.emit(event.playerNumber, {playerNumber:  i, playerName:  player.playerName, numberOfPlayersInRoom:  socket.currentRoom.playerCount })`
Followed immediately by a `'player_numbers'` event which will have a list of all the players and their numbers:
`io.to(socket.currentRoom.name).emit(event.playerNumbers, {playerNumbers:playerNumbers})`

The server will mark the Game as in Session. (At this point the `'player-disconnected'` event will be fired instead of `'room-player-count-changed'`)


#### creating a private game

To create a private room, use the `MultiPlayerConnector` to emit a `"create-private-game-room"` with the following: 
The server expects a JSON object with an int `minPlayersRequiredForGame`, an int `maxNumberPlayers`,  a string `gameType`, and a string `playerName`.
Upon completion the server will respond to the `MultiPlayerConnector`'s Socket.io `Socket` (just Socket from here on out) with a `"private-game-room-request-complete"` event and the room name. Server side code: `socket.emit(event.privateGameRoomRequestComplete, {gameRoomName:  room.name, initiator:  true})`

The flow from here on out is the same as the joining a private a game, the only difference is that creator is responsible for starting the game via the `'initiator-start-game'` as described in the join private game flow. 

## Game Play

Once a game is in session game data can be broadcasted to all sockets via the `game-data` event. Upon receiving a game-data event the server will send to all players in the room excluding the player who sent the data, a `game-data` event with the JSON object that was sent from the player who fired the `game-data` event in the first place.

- The `game-data` can be used to send whatever JSON data you want. It is a catch all event that can be used to do any sort of custom communication between all players. 

There is also a `game-data-all` event in which all players in the room, including the player who fired the event will  receive a `game-data` event with the JSON object that was sent from the player who fired the `game-data` event.

## Ending a game

To end a game either use the `Close()` of the `MultiPlayerConnector`

- the Socket.io Socket will disconnect from the server. (The server will manage the room that the player was in).

Or `ResetConnection()` which is a Close() followed by a reconnect. 

Or `FullReset()` which will do the same as `ResetConnection()`, but also remove all Socket.on events and handlers. 

- This prevents multiple socket.on handlers from existing, and a background activity from responding to socket events if a new Activity has been started, and the background one not properly unsubscribed.







