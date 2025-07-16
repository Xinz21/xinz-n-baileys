import { makeInMemoryStore } from '@whiskeysockets/baileys';
const store = makeInMemoryStore({ logger: console });
export default store;
