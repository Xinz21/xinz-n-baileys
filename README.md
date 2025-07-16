<p align="center">
  <img src="https://files.catbox.moe/k5pz12.jpg" width="300" />
</p>

<h1 align="center">@xinz-n/baileys</h1>

A customized WhatsApp Web API built and maintained by [@xinz21](https://github.com/xinz21)
This package is designed to support modern WhatsApp features using the>
---                                                                    
## Legal Notice

This project is not affiliated with or endorsed by WhatsApp.
Please use this package with responsibility. 
The source is made availa
The maintainers are not responsible for misuse or violation of WhatsAp

---

## Credits                                                             
This work stands on contributions from many great developers.          
Special thanks to:
                                                                     
- [@WhiskeySockets](https://github.com/WhiskeySockets/Baileys) — core 
- [@pokearaujo](https://github.com/pokearaujo/multidevice) — MD reversed
- [@sigalor](https://github.com/sigalor/whatsapp-web-reveng) — Web version 
- [@Rhymen](https://github.com/Rhymen/go-whatsapp) — for Go-based struktur 
- [@clara-defailion](https://github.com/clara-defailion) — support
- [@im-dims](https://github.com/Im-Dims) — inspiration

---                                                                                                                    
## Installation
```
bash
npm install @xinz-n/baileys
```

---

## Getting Started
```
import makeWASocket from '@xinz-n/baileys'

const sock = makeWASocket({
  printQRInTerminal: true
})
```

---

## Example: Connect to WhatsApp
```
import makeWASocket, { DisconnectReason } from '@xinz-n/baileys'
import { Boom } from '@hapi/boom'

async function connect() {
  const sock = makeWASocket({
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error as Boom)?.output?.>
      if (shouldReconnect) connect()
    } else if (connection === 'open') {
      console.log('Connection opened')
    }
    })                                                                                                                                            sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    await sock.sendMessage(msg.key.remoteJid!, { text: 'Hello there!' >
  })
}

connect()
```

---

## Features

Multi-device support using WebSocket

Lightweight and efficient

Clean API interface for integration

Easily extendable with custom features

---

