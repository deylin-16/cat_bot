process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import express from 'express';
import cors from 'cors';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

import { loadDatabase, saveDatabase } from './lib/database.js';
import { getSocket, setupPairing } from './lib/auth.js';

const { state, saveCreds } = await useMultiFileAuthState('sessions');
const msgRetry = new NodeCache();
const devCache = new NodeCache();

await loadDatabase();
global.conn = await getSocket(state, msgRetry, devCache);
await setupPairing(global.conn);

async function init() {
    let handler = await import(`./handler.js?update=${Date.now()}`);
    global.conn.ev.on('messages.upsert', async (m) => {
        if (!global.db.data) return;
        setImmediate(async () => {
            try { await handler.handler.call(global.conn, m); } catch (e) { }
        });
    });
    global.conn.ev.on('creds.update', saveCreds);
    global.conn.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') console.log(chalk.greenBright('>>> BOT PRINCIPAL ONLINE'));
        if (connection === 'close') process.exit();
    });
}

init();
setInterval(saveDatabase, 2 * 60 * 1000);
const app = express().use(cors()).use(express.json());
app.listen(process.env.PORT || 3000, () => console.log(chalk.cyanBright(`SERVIDOR API ACTIVO`)));
