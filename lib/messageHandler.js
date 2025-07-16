import { smsg } from './customFunctions';
export async function handleMessage(m) {
    if (!m.messages)
        return;
    const msg = m.messages[0];
    if (!msg.message)
        return;
    const chatUpdate = m;
    const conn = global.sock; // Assuming global.sock holds the WASocket instance
    const serializedMsg = smsg(conn, msg, false); // Added false for hasParent
    console.log('[XINZ] Message Received:', serializedMsg.text);
    // Example: Reply to any message with 'Hello from Baileys!'
    if (serializedMsg.text) {
        conn.sendMessage(serializedMsg.chat, { text: 'Hello from Baileys!' }, { quoted: serializedMsg });
    }
}
