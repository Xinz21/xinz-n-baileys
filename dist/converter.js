"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAudio = toAudio;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const qrcode_1 = require("qrcode");
function toAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        const tmp = `/tmp/${Date.now()}.${ext}`;
        const out = `${tmp}.mp3`;
        (0, fs_1.readFileSync)(tmp, buffer);
        (0, child_process_1.spawn)('ffmpeg', [
            '-i',
            tmp,
            '-vn',
            '-acodec',
            'libopus',
            '-b:a',
            '128k',
            '-vbr',
            'on',
            out
        ])
            .on('error', reject)
            .on('close', () => {
            unlinkSync(tmp);
            resolve((0, fs_1.readFileSync)(out));
            unlinkSync(out);
        });
    });
}
