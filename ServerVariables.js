class ServerVariables {
  constructor() {}
    static publicRooms = [];
    static privateRooms = [];
    static usedRoomNames = new Set(); 
    static clients = {};
    static numActivePublicPlayers = 0;

}

module.exports = {
  ServerVariables};
  


