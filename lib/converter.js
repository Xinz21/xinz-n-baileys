import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { toBuffer } from 'qrcode';
export function toAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        const tmp = `/tmp/${Date.now()}.${ext}`;
        const out = `${tmp}.mp3`;
        readFileSync(tmp, buffer);
        spawn('ffmpeg', [
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
            resolve(readFileSync(out));
            unlinkSync(out);
        });
    });
}
