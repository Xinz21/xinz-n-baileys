import path from 'path'
import { fileURLToPath } from 'url'
import pkg from '@whiskeysockets/baileys'
const { proto, areJidsSameUser, jidDecode, generateWAMessageFromContent, prepareWAMessageMedia } = pkg
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import Jimp from 'jimp'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function isNumber(x) {
    return typeof x === 'number' && !isNaN(x)
}

export function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1)
}

export function capitalizeV2(s) {
    return s.replace(/\010[a-z]/g, (char) => char.toUpperCase())
}

export function decodeJid(jid) {
    if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null
    const decoded = jidDecode(jid)
    return (decoded && decoded.user && decoded.server && decoded.user + '@' + decoded.server || jid).trim()
}

export function toTimeString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export function getRandom(ext) {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

export function nullish(args) {
    return args !== null && args !== undefined
}

export async function generateProfilePicture(buffer) {
    const jimp = await Jimp.read(buffer)
    const min = jimp.getWidth()
    const max = jimp.getHeight()
    const cropped = jimp.crop(0, ~~((max - min) / 2), min, min)
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.scaleToFit(72, 72).getBufferAsync(Jimp.MIME_JPEG)
    }
}

export async function getBuffer(url, options) {
    try {
        options = options || {}
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36', ...options.headers }
        })
        const buff = await res.arrayBuffer()
        if (options.json) try { return JSON.parse(buff.toString()) } catch { }
        return buff
    } catch (e) {
        console.error(e)
        return null
    }
}

export function smsg(conn, m, chatUpdate = {}) {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16
        m.chat = conn.decodeJid(m.key.remoteJid || chatUpdate.id)
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user?.id || m.participant || m.key?.participant || m.chat || '')
        m.asRply = m.chat.endsWith('@g.us') ? m.key.participant : m.key.remoteJid
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0]
        m.body = m.message.conversation || m.message[m.mtype]?.text || m.message[m.mtype]?.caption || m.message[m.mtype]?.contentText || m.message[m.mtype]?.selectedDisplayText || m.message[m.mtype]?.title || ''
        m.msg = m.message[m.mtype]
        if (m.mtype === 'ephemeralMessage') {
            m.body = m.msg.singleReplyMessage?.text || m.msg.singleReplyMessage?.caption || m.msg.singleReplyMessage?.contentText || m.msg.singleReplyMessage?.selectedDisplayText || m.msg.singleReplyMessage?.title || ''
            m.mtype = Object.keys(m.msg.singleReplyMessage)[0]
            m.msg = m.msg.singleReplyMessage
        }
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []
        if (quoted) {
            let type = Object.keys(quoted)[0]
            if (type === 'ephemeralMessage') {
                type = Object.keys(quoted.ephemeralMessage.singleReplyMessage)[0]
                quoted = quoted.ephemeralMessage.singleReplyMessage
            }
            if (['productMessage'].includes(type)) {
                type = Object.keys(quoted)[0]
                quoted = quoted[type]
            }
            if (typeof quoted === 'string') m.quoted = { text: quoted }
            else {
                m.quoted = { ...quoted, mtype: type }
                m.quoted.id = m.msg.contextInfo.stanzaId
                m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat)
                m.quoted.isBaileys = m.quoted.id?.startsWith('BAE5') && m.quoted.id?.length === 16
                m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
                m.quoted.fromMe = m.quoted.sender === conn.user?.id
                m.quoted.text = m.quoted.conversation || m.quoted[type]?.text || m.quoted[type]?.caption || m.quoted[type]?.contentText || m.quoted[type]?.selectedDisplayText || m.quoted[type]?.title || ''
                m.quoted.mentionedJid = m.quoted[type]?.contextInfo?.mentionedJid || []
                m.getQuotedObj = m.getQuotedMessage = async () => {
                    if (!m.quoted.id) return false
                    let q = await conn.loadMessage(m.quoted.id)
                    return smsg(conn, q)
                }
                m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: m.quoted.id })
                m.quoted.copy = () => smsg(conn, M.fromObject(M.toObject(m.quoted)))
                m.quoted.forward = (jid, force = false, options) => conn.copyNForward(jid, m.quoted, force, options)
                m.quoted.fakeReply = (text, fakeJid = m.quoted.sender, fakeText = m.quoted.text, fakeGroupJid) => conn.fakeReply(m.chat, text, fakeJid, fakeText, fakeGroupJid)
                m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace(/message/i, ''))
            }
        }
    }
    if (m.msg && m.msg.url) m.download = () => conn.downloadM(m.msg, m.mtype.replace(/message/i, ''))
    m.text = m.body || m.msg?.text || m.msg?.caption || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''
    /**
     * @param {String} jid
     * @param {String|Buffer} text
     * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} quoted
     * @param {Object} options
     */
    m.reply = (text, quoted = m, options) => conn.reply(m.chat, text, quoted, options)
    m.copy = () => smsg(conn, M.fromObject(M.toObject(m)))
    m.forward = (jid = m.chat, force = false, options) => conn.copyNForward(jid, m, force, options)
    m.fakeReply = (text, fakeJid = m.sender, fakeText = m.text, fakeGroupJid) => conn.fakeReply(m.chat, text, fakeJid, fakeText, fakeGroupJid)
    return m
}

export function serialize(conn, m) {
    return smsg(conn, m)
}

export function writeExif(media, metadata) {
    let wMedia = /image/.test(media.mimetype) ? imageToWebp : videoToWebp
    return new Promise(async (resolve, reject) => {
        const FAKE_MEDIA_PATH = path.join(tmpdir(), getRandom('.webp'))
        const FAKE_FILE_PATH = path.join(tmpdir(), getRandom('.json'))
        const FAKE_RESULT_PATH = path.join(tmpdir(), getRandom('.webp'))

        let [packname, author, categories] = [metadata.packname, metadata.author, metadata.categories]
        let json = {
            'sticker-pack-id': 'Manusia-Kuat',
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
            'emojis': categories,
            'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.whatsapp',
            'ios-app-store-link': 'https://itunes.apple.com/app/whatsapp-messenger/id310633997'
        }
        let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        let jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
        let zeroBuff = Buffer.from([0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        let fullBuff = Buffer.concat([exifAttr, zeroBuff, jsonBuff])
        fullBuff.writeUIntLE(jsonBuff.length, 14, 4)
        await fs.promises.writeFile(FAKE_MEDIA_PATH, await wMedia(media.data))
        await fs.promises.writeFile(FAKE_FILE_PATH, fullBuff)
        const error = await new Promise((resolve) => {
            const child = spawn('webpmux', [
                '-set', 'exif', FAKE_FILE_PATH,
                FAKE_MEDIA_PATH,
                '-o', FAKE_RESULT_PATH
            ], {
                stdio: 'ignore'
            })
            child.on('error', (err) => resolve(err))
            child.on('close', (code) => {
                if (code !== 0) resolve(new Error(`webpmux exited with code ${code}`))
                else resolve(null)
            })
        })
        if (error) reject(error)
        fs.promises.unlink(FAKE_MEDIA_PATH)
        fs.promises.unlink(FAKE_FILE_PATH)
        resolve(FAKE_RESULT_PATH)
    })
}

export function imageToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const child = spawn('convert', ['-quality', '100', '-', 'webp:-'], { stdio: ['pipe', 'pipe', 'ignore'] })
        child.on('error', reject)
        child.on('close', (code) => {
            if (code !== 0) reject(`Process exited with code ${code}`)
        })
        child.stdout.on('data', (data) => resolve(data))
        child.stdin.write(buffer)
        child.stdin.end()
    })
}

export function videoToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const child = spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-vf', 'scale=\'min(320,iw)\'\\:\'min(320,ih)\'\\,crop=320:320:((iw-320)/2):((ih-320)/2)',
            '-c:v', 'libwebp',
            '-lossless', '1',
            '-qscale', '1',
            '-preset', 'default',
            '-an',
            '-vsync', '0',
            '-s', '320x320',
            '-f', 'webp',
            'pipe:1'
        ], { stdio: ['pipe', 'pipe', 'ignore'] })
        child.on('error', reject)
        child.on('close', (code) => {
            if (code !== 0) reject(`Process exited with code ${code}`)
        })
        child.stdout.on('data', (data) => resolve(data))
        child.stdin.write(buffer)
        child.stdin.end()
    })
}



