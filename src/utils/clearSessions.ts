import fs from 'fs'
import path from 'path'

export function clearTemp() {
  const tmpPath = path.join(__dirname, '../../tmp')
  if (!fs.existsSync(tmpPath)) return
  for (const file of fs.readdirSync(tmpPath)) {
    if (!file.includes('creds.json')) fs.unlinkSync(path.join(tmpPath, file))
  }
  console.log('[XINZ] Temp folder cleaned.')
}