import { smsg } from './utils.js'

export async function handleMessage(m) {
  if (!m.messages) return
  const msg = m.messages[0]
  if (!msg.message) return

  const conn = global.sock // Access the global socket instance

  // Example: Log the message text
  if (msg.message.conversation) {
    console.log(`Received message: ${msg.message.conversation}`)
    conn.sendMessage(msg.key.remoteJid, { text: `Anda mengatakan: ${msg.message.conversation}` }, { quoted: msg })
  }

  // Add more message handling logic here based on your requirements
  // For example, handling commands, buttons, polls, etc.
}


