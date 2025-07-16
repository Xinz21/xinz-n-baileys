import qrcode from 'qrcode-terminal';
export function showQR(qr) {
    console.log('[XINZ] Scan this QR or use pairing code:');
    qrcode.generate(qr, { small: true });
}
