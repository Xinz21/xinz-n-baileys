import { WhatsAppSocket } from './socket';
import { clearTemp } from './utils/clearSessions';
import './api/discordWebhook';
clearTemp();
const conn = new WhatsAppSocket();
global.sock = conn.sock; // Assign the socket instance to global.sock
conn.connect();
