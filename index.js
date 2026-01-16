process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import NodeCache from 'node-cache';
import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import { loadDatabase, saveDatabase } from './lib/database.js';
import { getSocket, setupPairing } from './lib/auth.js';
import { startOptimization } from './lib/optimizer.js';

const { state, saveCreds } = await useMultiFileAuthState('sessions');
const msgRetry = new NodeCache();
const devCache = new NodeCache();

await loadDatabase();
global.conn = await getSocket(state, msgRetry, devCache);
await setupPairing(global.conn, 'sessions');

async function init() {
    const handler = await import('./handler.js');
    global.conn.ev.on('messages.upsert', async (m) => {
        setImmediate(async () => {
            try { await handler.handler.call(global.conn, m); } catch (e) {}
        });
    });
    global.conn.ev.on('creds.update', saveCreds);
    global.conn.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log(chalk.green('>>> BOT READY'));
    });
}

init();
startOptimization(global.conn);
setInterval(saveDatabase, 2 * 60 * 1000);

const app = express().use(cors()).use(express.json());
app.listen(process.env.PORT || 3000);
