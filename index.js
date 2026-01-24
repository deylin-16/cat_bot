import './config.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import { Low, JSONFile } from 'lowdb';
import { handler } from './handler.js';
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = (await import('@whiskeysockets/baileys')).default;

global.db = new Low(new JSONFile('database.json'));
await global.db.read();
global.db.data ||= { users: {}, chats: {}, settings: {} };

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS("Chrome"),
        auth: state,
        version
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jid.match(/(\d+)(:\d+)?@/gi)[0] || jid;
            return decode.replace(/:\d+@/gi, '@');
        }
        return jid;
    };

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        await handler.call(conn, chatUpdate);
    });

    conn.ev.on('connection.update', (update) => {
        if (update.connection === 'open') console.log(chalk.green('SISTEMA SEGURO Y VELOZ ONLINE'));
    });

    if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30000);

    return conn;
}

start();
