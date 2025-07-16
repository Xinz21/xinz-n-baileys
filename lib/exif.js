import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { exec } from 'child_process';
const webp = require('node-webpmux');
async function imageToWebp(media) {
    const tmpFileOut = join(tmpdir(), `${Math.random().toString(36).substring(2, 12)}.webp`);
    const tmpFileIn = join(tmpdir(), `${Math.random().toString(36).substring(2, 12)}.tmp`);
    writeFileSync(tmpFileIn, media);
    await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tmpFileIn} -vcodec libwebp -vf \"scale=\'min(320,iw)\':\'min(320,ih)\':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split[a][b]; [a]palettegen[p]; [b][p]paletteuse\" -loop 0 -ss 00:00:00.0 -t 00:00:05.0 -preset default -an -vsync 0 -s 512:512 ${tmpFileOut}`, (error, stdout, stderr) => {
            if (error)
                return reject(error);
            resolve(true);
        });
    });
    const buff = readFileSync(tmpFileOut);
    unlinkSync(tmpFileOut);
    unlinkSync(tmpFileIn);
    return buff;
}
async function videoToWebp(media) {
    const tmpFileOut = join(tmpdir(), `${Math.random().toString(36).substring(2, 12)}.webp`);
    const tmpFileIn = join(tmpdir(), `${Math.random().toString(36).substring(2, 12)}.tmp`);
    writeFileSync(tmpFileIn, media);
    await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tmpFileIn} -vcodec libwebp -vf \"scale=\'min(320,iw)\':\'min(320,ih)\':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split[a][b]; [a]palettegen[p]; [b][p]paletteuse\" -loop 0 -ss 00:00:00.0 -t 00:00:05.0 -preset default -an -vsync 0 -s 512:512 ${tmpFileOut}`, (error, stdout, stderr) => {
            if (error)
                return reject(error);
            resolve(true);
        });
    });
    const buff = readFileSync(tmpFileOut);
    unlinkSync(tmpFileOut);
    unlinkSync(tmpFileIn);
    return buff;
}
async function writeExifImg(media, metadata) {
    const wMedia = await imageToWebp(media);
    const img = new webp.Image();
    const json = { 'sticker-pack-id': metadata.packname, 'sticker-pack-name': metadata.packname, 'sticker-pack-publisher': metadata.author, 'emojis': metadata.categories || [] };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const extendedAtt = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const extendedBuff = Buffer.from(jsonBuff.length.toString(16).padStart(2, '0') + jsonBuff.toString('hex'), 'hex');
    img.load(wMedia);
    img.exif = Buffer.concat([exifAttr, extendedAtt, extendedBuff]);
    return await img.save(null);
}
async function writeExifVid(media, metadata) {
    const wMedia = await videoToWebp(media);
    const img = new webp.Image();
    const json = { 'sticker-pack-id': metadata.packname, 'sticker-pack-name': metadata.packname, 'sticker-pack-publisher': metadata.author, 'emojis': metadata.categories || [] };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const extendedAtt = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const extendedBuff = Buffer.from(jsonBuff.length.toString(16).padStart(2, '0') + jsonBuff.toString('hex'), 'hex');
    img.load(wMedia);
    img.exif = Buffer.concat([exifAttr, extendedAtt, extendedBuff]);
    return await img.save(null);
}
export { imageToWebp, videoToWebp, writeExifImg, writeExifVid };
