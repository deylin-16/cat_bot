import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { handler } from '../handler.js';
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = (await import('@whiskeysockets/baileys')).default;

if (!(global.conns instanceof Array)) global.conns = [];

export async function assistant_accessJadiBot(options) {
    let { conn, phoneNumber } = options;
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber);
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    let sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        version,
        browser: Browsers.macOS("Chrome")
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        await handler.call(sock, chatUpdate);
    });

    if (!sock.authState.creds.registered) {
        let code = await sock.requestPairingCode(phoneNumber);
        return code?.match(/.{1,4}/g)?.join("-") || code;
    }
    return "Conectado";
}
