export const config = {
  port: process.env.PORT || 3002,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  pgnDirectory: process.env.PGN_DIR || './pgn',
  
  defaultTimeControl: {
    initial: 10 * 60 * 1000,
    increment: 5 * 1000
  },
  
  roomCodeLength: 6,
  maxRoomsPerIP: 5,
  roomExpiryTime: 24 * 60 * 60 * 1000,
  
  reconnectWindow: 1 * 60 * 1000
};
