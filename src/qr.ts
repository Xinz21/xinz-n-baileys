import qrcode from 'qrcode-terminal'

export function showQR(qr: string) {
  console.log('[XINZ] Scan this QR or use pairing code:')
  qrcode.generate(qr, { small: true })
}