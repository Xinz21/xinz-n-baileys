import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { spawn } from 'child_process'

export function toAudio(buffer, ext) {
  return new Promise((resolve, reject) => {
    const tmp = `/tmp/${Date.now()}.${ext}`
    const out = `${tmp}.mp3`
    writeFileSync(tmp, buffer)
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
        unlinkSync(tmp)
        resolve(readFileSync(out))
        unlinkSync(out)
      })
  })
}


