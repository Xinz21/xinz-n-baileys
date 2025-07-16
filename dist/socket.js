"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppSocket = void 0;
const qr_1 = require("./qr");
const messageHandler_1 = require("./messageHandler");
const customFunctions_1 = require("./customFunctions");
const baileys_1 = require("@whiskeysockets/baileys");
const utils_js_1 = require("./utils.js");
const store_js_1 = __importDefault(require("./store.js"));
class WhatsAppSocket {
    async connect() {
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)('baileys_auth_info');
        this.state = state;
        this.saveCreds = saveCreds;
        this.sock = (0, customFunctions_1.makeWASocket)({
            auth: state,
            printQRInTerminal: true
        });
        // Bind store to socket
        store_js_1.default.bind(this.sock.ev);
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
                console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
                // reconnect if not logged out
                if (shouldReconnect) {
                    this.connect();
                }
            }
            else if (connection === 'open') {
                console.log('opened connection');
            }
            if (qr) {
                (0, qr_1.showQR)(qr);
            }
        });
        this.sock.ev.on('messages.upsert', async (m) => {
            console.log(JSON.stringify(m, undefined, 2));
            m.messages = m.messages.map((msg) => (0, utils_js_1.smsg)(this.sock, msg));
            (0, messageHandler_1.handleMessage)(m);
        });
        this.sock.ev.on('creds.update', saveCreds);
    }
}
exports.WhatsAppSocket = WhatsAppSocket;
