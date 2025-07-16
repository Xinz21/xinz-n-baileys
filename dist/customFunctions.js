"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWASocket = makeWASocket;
const jimp_1 = __importDefault(require("jimp"));
const path_1 = __importDefault(require("path"));
const converter_js_1 = require("./converter.js");
const chalk_1 = __importDefault(require("chalk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const awesome_phonenumber_1 = __importDefault(require("awesome-phonenumber"));
const fs_1 = __importDefault(require("fs"));
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = (await import('./exif.js')).default;
const file_type_1 = require("file-type");
const util_1 = require("util");
const url_1 = require("url");
const store_js_1 = __importDefault(require("./store.js"));
const myfunc_js_1 = require("./myfunc.js");
const utils_js_1 = require("./utils.js");
let conv = await import('./sticker.js');
const __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
/**
 * @type {import('@whiskeysockets/baileys')}
 */
const { default: _makeWaSocket, makeWALegacySocket, proto, downloadContentFromMessage, jidDecode, areJidsSameUser, generateWAMessage, generateForwardMessageContent, generateWAMessageFromContent, WAMessageStubType, extractMessageContent, prepareWAMessageMedia, jidNormalizedUser, MessageType, Mimetype } = (await import('@whiskeysockets/baileys')).default;
function makeWASocket(connectionOptions, options = {}) {
    /**
     * @type {import('@whiskeysockets/baileys').WASocket | import('@whiskeysockets/baileys').WALegacySocket}
     */
    //Sendkontak By Ald
    let conn = (global.opts['legacy'] ? makeWALegacySocket : _makeWaSocket)(connectionOptions);
    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string')
                    return (!(0, utils_js_1.nullish)(jid) && jid) || null;
                const decoded = jidDecode(jid);
                return (decoded && decoded.user && decoded.server && decoded.user + '@' + decoded.server || jid).trim();
            }
        },
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(chalk_1.default.bold.bgRgb(51, 204, 51)('INFO '), `[${chalk_1.default.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk_1.default.cyan((0, util_1.format)(...args)));
                    },
                    error(...args) {
                        console.log(chalk_1.default.bold.bgRgb(247, 38, 33)('ERROR '), `[${chalk_1.default.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk_1.default.rgb(255, 38, 0)((0, util_1.format)(...args)));
                    },
                    warn(...args) {
                        console.log(chalk_1.default.bold.bgRgb(255, 153, 0)('WARNING '), `[${chalk_1.default.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk_1.default.redBright((0, util_1.format)(...args)));
                    },
                    trace(...args) {
                        console.log(chalk_1.default.grey('TRACE '), `[${chalk_1.default.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk_1.default.white((0, util_1.format)(...args)));
                    },
                    debug(...args) {
                        console.log(chalk_1.default.bold.bgRgb(66, 167, 245)('DEBUG '), `[${chalk_1.default.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk_1.default.white((0, util_1.format)(...args)));
                    }
                };
            },
            enumerable: true
        },
        getFile: {
            /**
             * getBuffer hehe
             * @param {String|Buffer} PATH
             * @param {Boolean} saveToFile
             */
            async value(PATH, saveToFile = false) {
                let res, filename;
                const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? Buffer.from(PATH) : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split(',')[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await (0, node_fetch_1.default)(PATH)).buffer() : fs_1.default.existsSync(PATH) ? (filename = PATH, fs_1.default.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
                if (!Buffer.isBuffer(data))
                    throw new TypeError('Result is not a buffer');
                const type = await (0, file_type_1.fileTypeFromBuffer)(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                };
                if (data && saveToFile && !filename)
                    (filename = path_1.default.join(__dirname, '../tmp/' + new Date().getTime() + '.' + type.ext), await fs_1.default.promises.writeFile(filename, data));
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs_1.default.promises.unlink(filename);
                    }
                };
            },
            enumerable: true
        },
        /**
 * genOrderMessage
 * @param {String} message
 * @param {*} options
 * @returns
 */
        async genOrderMessage(message, options) {
            let m = {};
            switch (options.type) {
                case MessageType.text:
                case MessageType.extendedText:
                    if (typeof message === 'string')
                        message = { text: message };
                    m.extendedTextMessage = proto.ExtendedTextMessage.fromObject(message);
                    break;
                case MessageType.location:
                case MessageType.liveLocation:
                    m.locationMessage = proto.LocationMessage.fromObject(message);
                    break;
                case MessageType.contact:
                    m.contactMessage = proto.ContactMessage.fromObject(message);
                    break;
                case MessageType.contactsArray:
                    m.contactsArrayMessage = proto.ContactsArrayMessage.fromObject(message);
                    break;
                case MessageType.groupInviteMessage:
                    m.groupInviteMessage = proto.GroupInviteMessage.fromObject(message);
                    break;
                case MessageType.listMessage:
                    m.listMessage = proto.ListMessage.fromObject(message);
                    break;
                case MessageType.buttonsMessage:
                    m.buttonsMessage = proto.ButtonsMessage.fromObject(message);
                    break;
                case MessageType.image:
                case MessageType.sticker:
                case MessageType.document:
                case MessageType.video:
                case MessageType.audio:
                    m = await conn.prepareMessageMedia(message, options.type, options);
                    break;
                case 'orderMessage':
                    m.orderMessage = proto.OrderMessage.fromObject(message);
            }
            return proto.Message.fromObject(m);
        },
        waitEvent: {
            /**
             * waitEvent
             * @param {String} eventName
             * @param {Boolean} is
             * @param {Number} maxTries
             */
            value(eventName, is = () => true, maxTries = 25) {
                return new Promise((resolve, reject) => {
                    let tries = 0;
                    let on = (...args) => {
                        if (++tries > maxTries)
                            reject('Max tries reached');
                        else if (is()) {
                            conn.ev.off(eventName, on);
                            resolve(...args);
                        }
                    };
                    conn.ev.on(eventName, on);
                });
            }
        },
        sendFile: {
            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid
             * @param {String|Buffer} path
             * @param {String} filename
             * @param {String} caption
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} quoted
             * @param {Boolean} ptt
             * @param {Object} options
             */
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await conn.getFile(path, true);
                let { res, data: file, filename: pathFile } = type;
                if (res && res.status !== 200 || file.length <= 65536) {
                    try {
                        throw { json: JSON.parse(file.toString()) };
                    }
                    catch (e) {
                        if (e.json)
                            throw e.json;
                    }
                }
                const fileSize = fs_1.default.statSync(pathFile).size / 1024 / 1024;
                if (fileSize >= 400)
                    throw new Error('File size is too big!');
                let opt = {};
                if (quoted)
                    opt.quoted = quoted;
                if (!type)
                    options.asDocument = true;
                let mtype = '', mimetype = options.mimetype || type.mime, convert;
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker))
                    mtype = 'sticker';
                else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage))
                    mtype = 'image';
                else if (/video/.test(type.mime))
                    mtype = 'video';
                else if (/audio/.test(type.mime))
                    (convert = await (0, converter_js_1.toAudio)(file, type.ext),
                        file = convert.data,
                        pathFile = convert.filename,
                        mtype = 'audio',
                        mimetype = options.mimetype || 'audio/ogg; codecs=opus');
                else
                    mtype = 'document';
                if (options.asDocument)
                    mtype = 'document';
                delete options.asSticker;
                delete options.asLocation;
                delete options.asVideo;
                delete options.asDocument;
                delete options.asImage;
                let message = {
                    ...options,
                    caption,
                    ptt,
                    [mtype]: { url: pathFile },
                    mimetype,
                    fileName: filename || pathFile.split('/').pop()
                };
                /**
                 * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
                 */
                let m;
                try {
                    m = await conn.sendMessage(jid, message, { ...opt, ...options });
                }
                catch (e) {
                    console.error(e);
                    m = null;
                }
                finally {
                    if (!m)
                        m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
                    file = null; // releasing the memory
                    return m;
                }
            },
            enumerable: true
        },
        appenTextMessage: {
            async value(m, text, chatUpdate) {
                let messages = await generateWAMessage(m.chat, { text: text, mentions: m.mentionedJid }, {
                    userJid: conn.user.id,
                    quoted: m.quoted && m.quoted.fakeObj,
                });
                messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id);
                messages.key.id = m.key.id;
                messages.pushName = m.pushName;
                if (m.isGroup)
                    messages.participant = m.sender;
                let msg = {
                    ...chatUpdate,
                    messages: [proto.WebMessageInfo.fromObject(messages)],
                    type: "append",
                };
                conn.ev.emit("messages.upsert", msg);
            },
        },
        sendContact: {
            /**
             * Send Contact
             * @param {String} jid
             * @param {String[][]|String[]} data
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string')
                    data = [data];
                let contacts = [];
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '');
                    let njid = number + '@s.whatsapp.net';
                    let biz = await conn.getBusinessProfile(njid).catch((_) => null) || {};
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\n')};;;
FN:${name.replace(/\n/g, '\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${(0, awesome_phonenumber_1.default)('+' + number).getNumber('international')}${biz.description ? `\nX-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\n')}\nX-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\n')}`.trim() : ''}
END:VCARD
        `.trim();
                    contacts.push({ vcard, displayName: name });
                }
                return await conn.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, { quoted, ...options });
            },
            enumerable: true
        },
        resize: {
            value(buffer, ukur1, ukur2) {
                return new Promise(async (resolve, reject) => {
                    var baper = await jimp_1.default.read(buffer);
                    var ab = await baper.resize(ukur1, ukur2).getBufferAsync(jimp_1.default.MIME_JPEG);
                    resolve(ab);
                });
            }
        },
        sendImage: {
            value(jid, path, caption = '', quoted = '', options) {
                let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? global.fetchBuffer(path) : fs_1.default.existsSync(path) ? fs_1.default.readFileSync(path) : Buffer.alloc(0);
                conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
            }
        },
        /**
         *
         * @param {*} jid
         * @param {*} path
         * @param {*} caption
         * @param {*} quoted
         * @param {*} options
         * @returns
         */
        sendVideo: {
            value(jid, path, caption = '', gif = false, quoted = '', options) {
                let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? global.fetchBuffer(path) : fs_1.default.existsSync(path) ? fs_1.default.readFileSync(path) : Buffer.alloc(0);
                conn.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted });
            }
        },
        footerImg: {
            async value(jid, footer, text, media, quoted, options) {
                let msg = await generateWAMessageFromContent(jid, {
                    interactiveMessage: {
                        body: {
                            text: null
                        },
                        footer: {
                            text: footer
                        },
                        header: {
                            title: text,
                            hasMediaAttachment: false,
                            ...await prepareWAMessageMedia({ image: { url: media } }, { upload: conn.waUploadToServer })
                        },
                        nativeFlowMessage: {
                            buttons: [{ title: '' }]
                        }
                    },
                }, { quoted, ...options });
                await conn.relayMessage(jid, msg.message, {});
            }
        },
        footerTxt: {
            async value(jid, text, footer, quoted, options) {
                let msg = await generateWAMessageFromContent(jid, {
                    interactiveMessage: {
                        body: {
                            text: text
                        },
                        footer: {
                            text: footer
                        },
                        nativeFlowMessage: {
                            buttons: [{ title: '' }]
                        }
                    },
                }, { quoted, ...options });
                await conn.relayMessage(jid, msg.message, {});
            }
        },
        sendThumb: {
            /**
            Reply message using larger thumbnail
            **/
            value(jid, text = '', url, quoted, options) {
                conn.sendMessage(jid, { text: text, contextInfo: {
                        "externalAdReply": {
                            "title": global.namebot,
                            "body": '',
                            "showAdAttribution": true,
                            "mediaType": 1,
                            "sourceUrl": '',
                            "thumbnailUrl": url,
                            "renderLargerThumbnail": true
                        }
                    } }, { quoted, ...options });
            }
        },
        sendAdd: {
            /**
            Reply message using larger thumbnail
            **/
            value(jid, text = '', title = global.wm, bodi = global.sgc, url, quoted, options) {
                conn.sendMessage(jid, { text: text, contextInfo: {
                        "externalAdReply": {
                            "title": title,
                            "body": bodi,
                            "showAdAttribution": true,
                            "mediaType": 1,
                            "sourceUrl": '',
                            "thumbnailUrl": url,
                            "renderLargerThumbnail": true
                        }
                    } }, { quoted, ...options });
            }
        },
        reply: {
            /**
             * Reply to a message
             * @param {String} jid
             * @param {String|Buffer} text
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            value(jid, text = '', quoted, options) {
                let pp = conn.profilePictureUrl(conn.user.jid, 'image');
                const _uptime = process.uptime() * 1000;
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options,
                    text,
                    mentions: conn.parseMention(text),
                    contextInfo: global.setting.addReply ? global.adReply.contextInfo : null,
                    mentions: conn.parseMention(text),
                    ...options }, {
                    quoted,
                    ...options
                });
            }
        },
        msToDate: {
            async value(ms) {
                let days = Math.floor(ms / (24 * 60 * 60 * 1000));
                let daysms = ms % (24 * 60 * 60 * 1000);
                let hours = Math.floor((daysms) / (60 * 60 * 1000));
                let hoursms = ms % (60 * 60 * 1000);
                let minutes = Math.floor((hoursms) / (60 * 1000));
                let minutesms = ms % (60 * 1000);
                let sec = Math.floor((minutesms) / (1000));
                return days + " Hari " + hours + " Jam " + minutes + " Menit";
                // +minutes+":"+sec;
            }
        },
        delay: {
            async value(ms) {
                return new Promise((resolve, reject) => setTimeout(resolve, ms));
            }
        },
        resize: {
            value(buffer, ukur1, ukur2) {
                return new Promise(async (resolve, reject) => {
                    var baper = await jimp_1.default.read(buffer);
                    var ab = await baper.resize(ukur1, ukur2).getBufferAsync(jimp_1.default.MIME_JPEG);
                    resolve(ab);
                });
            }
        },
        cMod: {
            /**
             * cMod
             * @param {String} jid
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} message
             * @param {String} text
             * @param {String} sender
             * @param {*} options
             * @returns
             */
            value(jid, message, text = '', sender = conn.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions))
                    options.mentions = [options.mentions];
                let copy = message.toJSON();
                delete copy.message.messageContextInfo;
                delete copy.message.senderKeyDistributionMessage;
                let mtype = Object.keys(copy.message)[0];
                let msg = copy.message;
                let content = msg[mtype];
                if (typeof content === 'string')
                    msg[mtype] = text || content;
                else if (content.caption)
                    content.caption = text || content.caption;
                else if (content.text)
                    content.text = text || content.text;
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options };
                    msg[mtype].contextInfo = {
                        ...(content.contextInfo || {}),
                        mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                    };
                }
                if (copy.participant)
                    sender = copy.participant = sender || copy.participant;
                else if (copy.key.participant)
                    sender = copy.key.participant = sender || copy.key.participant;
                if (copy.key.remoteJid.includes('@s.whatsapp.net'))
                    sender = sender || copy.key.remoteJid;
                else if (copy.key.remoteJid.includes('@broadcast'))
                    sender = sender || copy.key.remoteJid;
                copy.key.remoteJid = jid;
                copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
                return proto.WebMessageInfo.fromObject(copy);
            },
            enumerable: true
        },
        copyNForward: {
            /**
             * Exact Copy Forward
             * @param {String} jid
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} message
             * @param {Boolean|Number} forwardingScore
             * @param {Object} options
             */
            async value(jid, message, forwardingScore = true, options = {}) {
                let vtype;
                if (options.readViewOnce && message.message.viewOnceMessage?.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    delete message.message.viewOnceMessage.message[vtype].viewOnce;
                    message.message = proto.Message.fromObject(JSON.parse(JSON.stringify(message.message.viewOnceMessage.message)));
                    message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo;
                }
                let mtype = Object.keys(message.message)[0];
                let m = generateForwardMessageContent(message, !!forwardingScore);
                let ctype = Object.keys(m)[0];
                if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1)
                    m[ctype].contextInfo.forwardingScore += forwardingScore;
                m[ctype].contextInfo = {
                    ...(message.message[mtype].contextInfo || {}),
                    ...(m[ctype].contextInfo || {})
                };
                m = generateWAMessageFromContent(jid, m, {
                    ...options,
                    userJid: conn.user.jid
                });
                await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } });
                return m;
            },
            enumerable: true
        },
        fakeReply: {
            /**
             * Fake Replies
             * @param {String} jid
             * @param {String|Object} text
             * @param {String} fakeJid
             * @param {String} fakeText
             * @param {String} fakeGroupJid
             * @param {String} options
             */
            value(jid, text = '', fakeJid = conn.user.jid, fakeText = '', fakeGroupJid, options) {
                return conn.reply(jid, text, { key: { fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }, ...options });
            }
        },
        saveMedia: {
            async value(message, filename, attachExtension = true) {
                let quoted = message.msg ? message.msg : message;
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                const stream = await downloadContentFromMessage(quoted, messageType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                let type = await (0, file_type_1.fileTypeFromBuffer)(buffer);
                let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
                // save to file
                await fs_1.default.writeFileSync(trueFileName, buffer);
                return trueFileName;
            }
        },
        downloadM: {
            /**
             * Download media message
             * @param {Object} m
             * @param {String} type
             * @param {fs.PathLike | fs.promises.FileHandle} saveToFile
             * @returns {Promise<fs.PathLike | fs.promises.FileHandle | Buffer>}
             */
            async value(m, type, saveToFile) {
                let filename;
                if (!m || !(m.url || m.directPath))
                    return Buffer.alloc(0);
                const stream = await downloadContentFromMessage(m, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                if (saveToFile)
                    ({ filename } = await conn.getFile(buffer, true));
                return saveToFile && fs_1.default.existsSync(filename) ? filename : buffer;
            },
            enumerable: true
        },
        parseMention: {
            /**
             * Parses string into mentionedJid(s)
             * @param {String} text
             * @returns {Array<String>}
             */
            value(text = '') {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
            },
            enumerable: true
        },
        saveName: {
            async value(id, name = '') {
                if (!id)
                    return;
                id = conn.decodeJid(id);
                let isGroup = id.endsWith('@g.us');
                if (id in conn.contacts && conn.contacts[id][isGroup ? 'subject' : 'name'] && id in conn.chats)
                    return;
                let metadata = {};
                if (isGroup)
                    metadata = await conn.groupMetadata(id);
                let chat = { ...(conn.contacts[id] || {}), id, ...(isGroup ? { subject: metadata.subject, desc: metadata.desc } : { name }) };
                conn.contacts[id] = chat;
                conn.chats[id] = chat;
            }
        },
        getName: {
            /**
             * Get name from jid
             * @param {String} jid
             * @param {Boolean} withoutContact
             */
            value(jid = '', withoutContact = false) {
                jid = conn.decodeJid(jid);
                withoutContact = conn.withoutContact || withoutContact;
                let v;
                if (jid.endsWith('@g.us'))
                    return new Promise(async (resolve) => {
                        v = conn.chats[jid] || {};
                        if (!(v.name || v.subject))
                            v = await conn.groupMetadata(jid) || {};
                        resolve(v.name || v.subject || (0, awesome_phonenumber_1.default)('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
                    });
                else
                    v = jid === '0@s.whatsapp.net' ? {
                        jid,
                        vname: 'WhatsApp'
                    } : areJidsSameUser(jid, conn.user.id) ?
                        conn.user :
                        (conn.chats[jid] || {});
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || (0, awesome_phonenumber_1.default)('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
            },
            enumerable: true
        },
        loadMessage: {
            /**
             *
             * @param {String} messageID
             * @returns {import('@whiskeysockets/baileys').proto.WebMessageInfo}
             */
            value(messageID) {
                return Object.entries(conn.chats)
                    .filter(([_, { messages }]) => typeof messages === 'object')
                    .find(([_, { messages }]) => Object.entries(messages)
                    .find(([k, v]) => (k === messageID || v.key?.id === messageID)))?.[1].messages?.[messageID];
            },
            enumerable: true
        },
        sendListButton: {
            async value(jid, text, list, footer, options = [], quoted = global.fkon) {
                let msg = await generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: {
                            "messageContextInfo": {
                                "deviceListMetadata": {},
                                "deviceListMetadataVersion": 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: text
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: footer
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [{
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify(list)
                                        },
                                        ...options
                                    ],
                                }), contextInfo: global.adReply.contextInfo
                            })
                        }
                    }
                }, { quoted, userJid: quoted });
                conn.relayMessage(jid, msg.message, {
                    messageId: msg.key.id,
                });
            }
        },
        sendUrlButton: {
            async value(jid, text, row = [], footer, quoted = global.fkon) {
                let msg = await generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: {
                            "messageContextInfo": {
                                "deviceListMetadata": {},
                                "deviceListMetadataVersion": 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: text
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: footer
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [
                                        ...row
                                    ],
                                }), contextInfo: global.adReply.contextInfo
                            })
                        }
                    }
                }, { quoted, userJid: quoted });
                conn.relayMessage(jid, msg.message, {
                    messageId: msg.key.id,
                });
            }
        },
        sendUrlImageButton: {
            async value(jid, text, row = [], footer, url, quoted = global.fkon) {
                let msg = await generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: {
                            "messageContextInfo": {
                                "deviceListMetadata": {},
                                "deviceListMetadataVersion": 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: text
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: footer
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false,
                                    ...await prepareWAMessageMedia({ image: { url: url } }, { upload: conn.waUploadToServer })
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [
                                        ...row
                                    ],
                                }), contextInfo: global.adReply.contextInfo
                            })
                        }
                    }
                }, { quoted, userJid: quoted });
                conn.relayMessage(jid, msg.message, {
                    messageId: msg.key.id,
                });
            }
        },
        sendListImageButton: {
            async value(jid, text, list, footer, url, options = [], quoted = global.fkon) {
                let msg = await generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: {
                            "messageContextInfo": {
                                "deviceListMetadata": {},
                                "deviceListMetadataVersion": 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: text
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: footer
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false,
                                    ...await prepareWAMessageMedia({ image: { url: url } }, { upload: conn.waUploadToServer })
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [{
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify(list)
                                        },
                                        ...options
                                    ],
                                }), contextInfo: global.adReply.contextInfo
                            })
                        }
                    }
                }, { quoted, userJid: quoted });
                conn.relayMessage(jid, msg.message, {
                    messageId: msg.key.id,
                });
            }
        },
        sendGroupV4Invite: {
            /**
             * sendGroupV4Invite
             * @param {String} jid
             * @param {*} participant
             * @param {String} inviteCode
             * @param {Number} inviteExpiration
             * @param {String} groupName
             * @param {String} caption
             * @param {Buffer} jpegThumbnail
             * @param {*} options
             */
            async value(jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', jpegThumbnail, options = {}) {
                const msg = proto.Message.fromObject({
                    groupInviteMessage: proto.GroupInviteMessage.fromObject({
                        inviteCode,
                        inviteExpiration: parseInt(inviteExpiration) || +new Date(new Date().getTime() + (3 * 86400000)),
                        groupJid: jid,
                        groupName: (groupName ? groupName : await conn.getName(jid)) || null,
                        jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
                        caption
                    })
                });
                const message = generateWAMessageFromContent(participant, msg, options);
                await conn.relayMessage(participant, message.message, { messageId: message.key.id, additionalAttributes: { ...options } });
                return message;
            },
            enumerable: true
        },
        processMessageStubType: {
            /**
             * to process MessageStubType
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m
             */
            async value(m) {
                if (!m.messageStubType)
                    return;
                const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '');
                if (!chat || chat === 'status@broadcast')
                    return;
                const emitGroupUpdate = (update) => {
                    conn.ev.emit('groups.update', [{ id: chat, ...update }]);
                };
                switch (m.messageStubType) {
                    case WAMessageStubType.REVOKE:
                    case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                        emitGroupUpdate({ revoke: m.messageStubParameters[0] });
                        break;
                    case WAMessageStubType.GROUP_CHANGE_ICON:
                        emitGroupUpdate({ icon: m.messageStubParameters[0] });
                        break;
                    default: {
                        console.log({
                            messageStubType: m.messageStubType,
                            messageStubParameters: m.messageStubParameters,
                            type: WAMessageStubType[m.messageStubType]
                        });
                        break;
                    }
                }
                const isGroup = chat.endsWith('@g.us');
                if (!isGroup)
                    return;
                let chats = conn.chats[chat];
                if (!chats)
                    chats = conn.chats[chat] = { id: chat };
                chats.isChats = true;
                const metadata = await conn.groupMetadata(chat).catch((_) => null) || {};
                if (!metadata)
                    return;
                chats.subject = metadata.subject;
                chats.metadata = metadata;
            }
        },
        relayWAMessage: {
            async value(pesanfull) {
                if (pesanfull.message.audioMessage) {
                    await conn.sendPresenceUpdate('recording', pesanfull.key.remoteJid);
                }
                else {
                    await conn.sendPresenceUpdate('composing', pesanfull.key.remoteJid);
                }
                var mekirim = await conn.relayMessage(pesanfull.key.remoteJid, pesanfull.message, { messageId: pesanfull.key.id });
                conn.ev.emit('messages.upsert', { messages: [pesanfull], type: 'append' });
                return mekirim;
            }
        },
        insertAllGroup: {
            async value() {
                const groups = await conn.groupFetchAllParticipating().catch((_) => null) || {};
                for (const group in groups)
                    conn.chats[group] = { ...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] };
                return conn.chats;
            },
        },
        sendStimg: {
            async value(jid, path, quoted, options = {}) {
                let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? await (await (0, node_fetch_1.default)(path)).buffer() : fs_1.default.existsSync(path) ? fs_1.default.readFileSync(path) : Buffer.alloc(0);
                let buffer;
                if (options && (options.packname || options.author)) {
                    buffer = await writeExifImg(buff, options);
                }
                else {
                    buffer = await imageToWebp(buff);
                }
                await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            }
        },
        sendContact: {
            /**
             * Send Contact
             * @param {String} jid
             * @param {String[][]|String[]} data
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string')
                    data = [data];
                let contacts = [];
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '');
                    let njid = number + '@s.whatsapp.net';
                    let biz = await conn.getBusinessProfile(njid).catch((_) => null) || {};
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\n')};;;
FN:${name.replace(/\n/g, '\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${(0, awesome_phonenumber_1.default)('+' + number).getNumber('international')}${biz.description ? `\nX-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\n')}\nX-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\n')}`.trim() : ''}
END:VCARD
        `.trim();
                    contacts.push({ vcard, displayName: name });
                }
                return await conn.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, { quoted, ...options });
            },
            enumerable: true
        },
        /**
         * Send Contact Array
         * @param {String} jid
         * @param {String} number
         * @param {String} name
         * @param {Object} quoted
         * @param {Object} options
         */
        sendContactArray: {
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string')
                    data = [data];
                let contacts = [];
                for (let [number, name, isi, isi1, isi2, isi3, isi4, isi5] of data) {
                    number = number.replace(/[^0-9]/g, '');
                    let njid = number + '@s.whatsapp.net';
                    let biz = await conn.getBusinessProfile(njid).catch((_) => null) || {};
                    // N:;${name.replace(/\n/g, '\n').split(' ').reverse().join(';')};;;
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:${name.replace(/\n/g, '\n')}
item.ORG:${isi}
item1.TEL;waid=${number}:${(0, awesome_phonenumber_1.default)('+' + number).getNumber('international')}
item1.X-ABLabel:${isi1}
item2.EMAIL;type=INTERNET:${isi2}
item2.X-ABLabel:📧 Email
item3.ADR:;;${isi3};;;;
item3.X-ABADR:ac
item3.X-ABLabel:📍 Region
item4.URL:${isi4}
item4.X-ABLabel:Website
item5.X-ABLabel:${isi5}
END:VCARD`.trim();
                    contacts.push({ vcard, displayName: name });
                }
                return await conn.sendMessage(jid, {
                    contacts: {
                        displayName: (contacts.length > 1 ? `2013 kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, {
                    quoted,
                    ...options
                });
            }
        },
        sendStvid: {
            async value(jid, path, quoted, options = {}) {
                let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? await global.getBuffer(path) : fs_1.default.existsSync(path) ? fs_1.default.readFileSync(path) : Buffer.alloc(0);
                let buffer;
                if (options && (options.packname || options.author)) {
                    buffer = await writeExifVid(buff, options);
                }
                else {
                    buffer = await videoToWebp(buff);
                }
                await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            }
        },
        pushMessage: {
            /**
             * pushMessage
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo[]} m
             */
            async value(m) {
                if (!m)
                    return;
                if (!Array.isArray(m))
                    m = [m];
                for (const message of m) {
                    try {
                        // if (!(message instanceof proto.WebMessageInfo)) continue // https://github.com/adiwajshing/Baileys/pull/696/commits/6a2cb5a4139d8eb0a75c4c4ea7ed52adc0aec20f
                        if (!message)
                            continue;
                        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT)
                            conn.processMessageStubType(message).catch(console.error);
                        const _mtype = Object.keys(message.message || {});
                        const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                            (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                            _mtype[_mtype.length - 1];
                        const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '');
                        if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                            /**
                             * @type {import('@whiskeysockets/baileys').proto.IContextInfo}
                             */
                            let context = message.message[mtype].contextInfo;
                            let participant = conn.decodeJid(context.participant);
                            const remoteJid = conn.decodeJid(context.remoteJid || participant);
                            /**
                             * @type {import('@whiskeysockets/baileys').proto.IMessage}
                             *
                             */
                            let quoted = message.message[mtype].contextInfo.quotedMessage;
                            if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                                let qMtype = Object.keys(quoted)[0];
                                if (qMtype == 'conversation') {
                                    quoted.extendedTextMessage = { text: quoted[qMtype] };
                                    delete quoted.conversation;
                                    qMtype = 'extendedTextMessage';
                                }
                                if (!quoted[qMtype].contextInfo)
                                    quoted[qMtype].contextInfo = {};
                                quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || [];
                                const isGroup = remoteJid.endsWith('g.us');
                                if (isGroup && !participant)
                                    participant = remoteJid;
                                const qM = {
                                    key: {
                                        remoteJid,
                                        fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                                        id: context.stanzaId,
                                        participant,
                                    },
                                    message: JSON.parse(JSON.stringify(quoted)),
                                    ...(isGroup ? { participant } : {})
                                };
                                let qChats = conn.chats[participant];
                                if (!qChats)
                                    qChats = conn.chats[participant] = { id: participant, isChats: !isGroup };
                                if (!qChats.messages)
                                    qChats.messages = {};
                                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe)
                                    qChats.messages[context.stanzaId] = qM;
                                let qChatsMessages;
                                if ((qChatsMessages = Object.entries(qChats.messages)).length > 40)
                                    qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length)); // maybe avoid memory leak
                            }
                        }
                        if (!chat || chat === 'status@broadcast')
                            continue;
                        const isGroup = chat.endsWith('@g.us');
                        let chats = conn.chats[chat];
                        if (!chats) {
                            if (isGroup)
                                await conn.insertAllGroup().catch(console.error);
                            chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) };
                        }
                        let metadata, sender;
                        if (isGroup) {
                            if (!chats.subject || !chats.metadata) {
                                metadata = await conn.groupMetadata(chat).catch((_) => ({})) || {};
                                if (!chats.subject)
                                    chats.subject = metadata.subject || '';
                                if (!chats.metadata)
                                    chats.metadata = metadata;
                            }
                            sender = conn.decodeJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '');
                            if (sender !== chat) {
                                let chats = conn.chats[sender];
                                if (!chats)
                                    chats = conn.chats[sender] = { id: sender };
                                if (!chats.name)
                                    chats.name = message.pushName || chats.name || '';
                            }
                        }
                        else if (!chats.name)
                            chats.name = message.pushName || chats.name || '';
                        if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype))
                            continue;
                        chats.isChats = true;
                        if (!chats.messages)
                            chats.messages = {};
                        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
                        if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                            delete message.message.messageContextInfo;
                            delete message.message.senderKeyDistributionMessage;
                            chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2));
                            let chatsMessages;
                            if ((chatsMessages = Object.entries(chats.messages)).length > 40)
                                chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length));
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
        },
        /**
    *status
    */
        sendPoll: {
            async value(jid, name = '', values = [], selectableCount = '') {
                return await conn.sendMessage(jid, { poll: { name, values, selectableCount } });
            },
            enumerable: true
        },
        //SEND TEXT
        sendText: {
            async value(jid, text, quoted = '', options) {
                conn.sendMessage(jid, { text: text, ...options }, { quoted });
            }
        },
        // SET BIO
        setBio: {
            async value(status) {
                return await conn.query({
                    tag: 'iq',
                    attrs: {
                        to: 's.whatsapp.net',
                        type: 'set',
                        xmlns: 'status',
                    },
                    content: [
                        {
                            tag: 'status',
                            attrs: {},
                            content: Buffer.from(status, 'utf-8')
                        }
                    ]
                });
                // <iq to="s.whatsapp.net" type="set" xmlns="status" id="21168.6213-69"><status>"Hai, saya menggunakan WhatsApp"</status></iq>
            }
        },
        sendStickerFromUrl: {
            async value(from, PATH, quoted, options = {}) {
                let types = await conn.getFile(PATH, true);
                let { filename, size, ext, mime, data } = types;
                let type = '', mimetype = mime, pathFile = filename;
                let media = { mimetype: mime, data };
                let pathFile1 = await (0, myfunc_js_1.writeExif)(media, { packname: options.packname ? options.packname : 'Nightmare - MD', author: options.author ? options.author : '', categories: options.categories ? options.categories : [] });
                await fs_1.default.promises.unlink(filename);
                await conn.sendMessage(from, { sticker: { url: pathFile1 } }, { quoted: quoted });
                return fs_1.default.promises.unlink(pathFile1);
            }
        },
        serializeM: {
            /**
             * Serialize Message, so it easier to manipulate
             * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m
             */
            value(m) {
                return (0, utils_js_1.smsg)(conn, m);
            }
        },
        updateProfilePicture: {
            async value(jid, content) {
                const { img } = await (0, utils_js_1.generateProfilePicture)(content);
                return conn.query({
                    tag: 'iq',
                    attrs: { to: jidNormalizedUser(jid), type: 'set', xmlns: 'w:profile:picture' },
                    content: [{ tag: 'picture', attrs: { type: 'image' }, content: img }]
                });
            },
            enumerable: true
        },
        ...(typeof conn.chatRead !== 'function' ? {
            chatRead: {
                /**
                 * Read message
                 * @param {String} jid
                 * @param {String|undefined|null} participant
                 * @param {String} messageID
                 */
                value(jid, participant = conn.user.jid, messageID) {
                    return conn.sendReadReceipt(jid, participant, [messageID]);
                },
                enumerable: true
            }
        } : {}),
        ...(typeof conn.setStatus !== 'function' ? {
            setStatus: {
                /**
                 * setStatus bot
                 * @param {String} status
                 */
                value(status) {
                    return conn.query({
                        tag: 'iq',
                        attrs: {
                            to: 's.whatsapp.net',
                            type: 'set',
                            xmlns: 'status',
                        },
                        content: [
                            {
                                tag: 'status',
                                attrs: {},
                                content: Buffer.from(status, 'utf-8')
                            }
                        ]
                    });
                },
                enumerable: true
            }
        } : {})
    });
    if (sock.user?.id)
        sock.user.jid = sock.decodeJid(sock.user.id);
    store_js_1.default.bind(sock.ev);
    return sock;
}
