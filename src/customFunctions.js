import Jimp from 'jimp'
import { toBuffer } from 'qrcode'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from './exif.js'
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { smsg } from './utils.js'

export { makeWASocket, useMultiFileAuthState, DisconnectReason, Boom, smsg, toBuffer, writeFileSync, unlinkSync, readFileSync, spawn, tmpdir, join, imageToWebp, videoToWebp, writeExifImg, writeExifVid }


