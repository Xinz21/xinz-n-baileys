"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("./socket");
const clearSessions_1 = require("./utils/clearSessions");
require("./api/discordWebhook");
(0, clearSessions_1.clearTemp)();
const conn = new socket_1.WhatsAppSocket();
global.sock = conn.sock; // Assign the socket instance to global.sock
conn.connect();
