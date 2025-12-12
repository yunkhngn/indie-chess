export const config = {
  port: process.env.PORT || 3002,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  pgnDirectory: process.env.PGN_DIR || './pgn',
  
  // Default time control: 10 minutes + 5 second increment
  defaultTimeControl: {
    initial: 10 * 60 * 1000, // 10 minutes in ms
    increment: 5 * 1000      // 5 seconds in ms
  },
  
  // Room settings
  roomCodeLength: 6,
  maxRoomsPerIP: 5,
  roomExpiryTime: 24 * 60 * 60 * 1000, // 24 hours
  
  // Reconnection window (time before slot can be taken over)
  reconnectWindow: 1 * 60 * 1000 // 1 minute
};
