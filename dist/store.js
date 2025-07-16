"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importDefault(require("@whiskeysockets/baileys"));
const store = (0, baileys_1.default)({ logger: console });
exports.default = store;
