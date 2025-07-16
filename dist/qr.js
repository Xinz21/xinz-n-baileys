"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showQR = showQR;
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
function showQR(qr) {
    console.log('[XINZ] Scan this QR or use pairing code:');
    qrcode_terminal_1.default.generate(qr, { small: true });
}
