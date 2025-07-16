import { showQR } from './qr';
import { handleMessage } from './messageHandler';
import { makeWASocket, protoType, serialize } from './customFunctions';
import { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
export class WhatsAppSocket {
    async connect() {
        const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
        this.state = state;
        this.saveCreds = saveCreds;
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: true
        });
        protoType();
        serialize();
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
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
                showQR(qr);
            }
        });
        this.sock.ev.on('messages.upsert', async (m) => {
            console.log(JSON.stringify(m, undefined, 2));
            handleMessage(m);
        });
        this.sock.ev.on('creds.update', saveCreds);
    }
}
