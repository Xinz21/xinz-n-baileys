import { WhatsAppSocket } from './socket.js'

// Declare global.sock (no 'declare' keyword in JS)
global.sock = null;

const conn = new WhatsAppSocket()
global.sock = conn.sock // Assign the socket instance to global.sock
conn.connect()


