"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTemp = clearTemp;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function clearTemp() {
    const tmpPath = path_1.default.join(__dirname, '../../tmp');
    if (!fs_1.default.existsSync(tmpPath))
        return;
    for (const file of fs_1.default.readdirSync(tmpPath)) {
        if (!file.includes('creds.json'))
            fs_1.default.unlinkSync(path_1.default.join(tmpPath, file));
    }
    console.log('[XINZ] Temp folder cleaned.');
}
