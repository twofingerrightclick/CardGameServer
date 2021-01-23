module.exports= {

    events: {
        privategGameRoomRequestComplete: 'private-game-room-request-complete',
        
        startGame: 'start-game',
        joinPrivateGameRoom: 'join-private-game-room',
        gameReadyToPlay: 'game-ready-to-play',
        playerJoined: 'player-joined' ,
        unableToFindRoom: 'unable-to-find-room',
        turnServerTokenOffer: 'token-offer',
        createPrivateGameRoom: 'private-game-room-request',
        //private events
        


        //public game events
        publicGameRoomRequestComplete: "public-game-room-request-complete",
        publicGameWaitingRoomPlayerLeft:'public-game-waiting-room-player-left',
        publicGameRoomRequest : "public-game-room-request",
        publicGameReadyToPlay : "public-game-ready-to-play",
        getNumActivePlayers : "get-num-active-public-players",
        numActivePublicPlayers : "num-active-public-players",


        //game events
        gameData: 'game-data'
    }    

}