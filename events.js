module.exports= {

    events: {
        privateGameRoomRequestComplete: 'private-game-room-request-complete',
        
        startGame: 'start-game',
        initiatorSaysToStartGame: 'initiator-start-game',
        joinPrivateGameRoom: 'join-private-game-room',
        gameReadyToPlay: 'game-ready-to-play',
        roomPlayerCountUpdate: 'room-player-count-changed' ,
        unableToFindRoom: 'unable-to-find-room',
        turnServerTokenOffer: 'token-offer',
        createPrivateGameRoom: 'private-game-room-request',
        privateGameWaitingRoomPlayerLeft: 'private-game-waiting-room-player-left',
        gameRoomDeletedByInitiator: 'game-room-deleted-by-initiator',
        privatePlayerDisconnected: 'private-player-disconnected',
        //private events
        playerListRequest: 'player-list-request',


        //public game events
        publicGameRoomRequestComplete: "public-game-room-request-complete",
        publicGameWaitingRoomPlayerLeft:'public-game-waiting-room-player-left',
        publicGameRoomRequest : "public-game-room-request",
        publicGameReadyToPlay : "public-game-ready-to-play",
        getNumActivePlayers : "get-num-active-public-players",
        numActivePublicPlayers : "num-active-public-players",


        //game events
        gameData: 'game-data',
        playerNumbers: 'player_numbers',
        playerNumber: 'player_number'
    }    

}