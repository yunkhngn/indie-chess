import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // playerId -> roomCode
    this.disconnectedPlayers = new Map(); // playerId -> { roomCode, disconnectTime }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < config.roomCodeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom(playerName, password = null) {
    let roomCode;
    do {
      roomCode = this.generateRoomCode();
    } while (this.rooms.has(roomCode));

    const playerId = uuidv4();
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    // Randomly assign color to creator
    const creatorColor = Math.random() < 0.5 ? 'white' : 'black';

    const room = {
      code: roomCode,
      hasPassword: !!password,
      passwordHash: hashedPassword,
      createdAt: Date.now(),
      players: {
        [creatorColor]: {
          id: playerId,
          name: playerName,
          socketId: null,
          connected: false
        }
      },
      game: null, // Will be initialized by GameManager
      pendingRequests: {
        restart: null,
        colorSwap: null
      },
      chat: []
    };

    this.rooms.set(roomCode, room);
    this.playerRooms.set(playerId, roomCode);

    return {
      roomCode,
      playerId,
      color: creatorColor
    };
  }

  async joinRoom(roomCode, playerName, password = null) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }

    // Check password
    if (room.hasPassword) {
      if (!password) {
        return { error: 'Password required', requiresPassword: true };
      }
      const validPassword = await bcrypt.compare(password, room.passwordHash);
      if (!validPassword) {
        return { error: 'Invalid password' };
      }
    }

    // Check if room is full
    if (room.players.white && room.players.black) {
      return { error: 'Room is full' };
    }

    const playerId = uuidv4();
    const joinerColor = room.players.white ? 'black' : 'white';

    room.players[joinerColor] = {
      id: playerId,
      name: playerName,
      socketId: null,
      connected: false
    };

    this.playerRooms.set(playerId, roomCode);

    return {
      roomCode,
      playerId,
      color: joinerColor,
      opponentName: room.players[joinerColor === 'white' ? 'black' : 'white']?.name
    };
  }

  connectPlayer(roomCode, playerId, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    for (const color of ['white', 'black']) {
      if (room.players[color]?.id === playerId) {
        room.players[color].socketId = socketId;
        room.players[color].connected = true;
        this.disconnectedPlayers.delete(playerId);
        return { room, color };
      }
    }
    return null;
  }

  disconnectPlayer(socketId) {
    for (const [roomCode, room] of this.rooms) {
      for (const color of ['white', 'black']) {
        if (room.players[color]?.socketId === socketId) {
          const playerId = room.players[color].id;
          room.players[color].connected = false;
          room.players[color].socketId = null;
          
          this.disconnectedPlayers.set(playerId, {
            roomCode,
            disconnectTime: Date.now()
          });
          
          return { roomCode, playerId, color, playerName: room.players[color].name };
        }
      }
    }
    return null;
  }

  canReconnect(playerId) {
    const disconnectInfo = this.disconnectedPlayers.get(playerId);
    if (!disconnectInfo) return null;

    const elapsed = Date.now() - disconnectInfo.disconnectTime;
    if (elapsed > config.reconnectWindow) {
      this.disconnectedPlayers.delete(playerId);
      return null;
    }

    return disconnectInfo.roomCode;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  getRoomByPlayerId(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode);
  }

  getPlayerColor(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    
    if (room.players.white?.id === playerId) return 'white';
    if (room.players.black?.id === playerId) return 'black';
    return null;
  }

  getOpponentSocketId(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const playerColor = this.getPlayerColor(roomCode, playerId);
    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    
    return room.players[opponentColor]?.socketId;
  }

  swapColors(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const white = room.players.white;
    const black = room.players.black;
    
    room.players.white = black;
    room.players.black = white;
    
    return true;
  }

  addChatMessage(roomCode, playerId, text) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const playerColor = this.getPlayerColor(roomCode, playerId);
    if (!playerColor) return null;

    const message = {
      id: uuidv4(),
      from: room.players[playerColor].name,
      color: playerColor,
      text,
      timestamp: Date.now()
    };

    room.chat.push(message);
    
    // Keep only last 100 messages
    if (room.chat.length > 100) {
      room.chat.shift();
    }

    return message;
  }

  setPendingRequest(roomCode, type, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    room.pendingRequests[type] = {
      requesterId,
      timestamp: Date.now()
    };
    return true;
  }

  getPendingRequest(roomCode, type) {
    const room = this.rooms.get(roomCode);
    return room?.pendingRequests[type] || null;
  }

  clearPendingRequest(roomCode, type) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.pendingRequests[type] = null;
    }
  }

  deleteRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Clean up player mappings
    for (const color of ['white', 'black']) {
      if (room.players[color]) {
        this.playerRooms.delete(room.players[color].id);
        this.disconnectedPlayers.delete(room.players[color].id);
      }
    }

    this.rooms.delete(roomCode);
  }

  // Cleanup expired rooms
  cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomCode, room] of this.rooms) {
      if (now - room.createdAt > config.roomExpiryTime) {
        this.deleteRoom(roomCode);
      }
    }
  }
}

export const roomManager = new RoomManager();
