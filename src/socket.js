import WebSocket from 'ws'
import { handleMessage } from './messageHandler.js'
import { makeWASocket } from './customFunctions.js'
import { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { smsg } from './utils.js'
import qrcode from 'qrcode-terminal'

export class WhatsAppSocket {

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    this.state = state
    this.saveCreds = saveCreds

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false // Set to false as we will handle it manually
    })

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, is  } = update
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
        // reconnect if not logged out
        if (shouldReconnect) {
          this.connect()
        }
      } else if (connection === 'open') {
        console.log('opened connection')
      }
      if (qr) {
        qrcode.generate(qr, { small: true })
        console.log('Scan QR code above or enter pairing code below:')
      }
      if (is === 'pairing_code' && update.pairingCode) {
        console.log('Pairing Code:', update.pairingCode)
      }
    })

    this.sock.ev.on('messages.upsert', async (m) => {
      console.log(JSON.stringify(m, undefined, 2))
      m.messages = m.messages.map(msg => smsg(this.sock, msg))
      handleMessage(m)
    })

    this.sock.ev.on('creds.update', saveCreds)
  }
}


