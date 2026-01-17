import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';
import fs, { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import NodeCache from 'node-cache';
import chalk from 'chalk';
import readline from 'readline';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
import { createClient } from '@supabase/supabase-js';
import { makeWASocket as makeSimpleSocket, protoType } from './lib/simple.js';

const supabase = createClient("https://kzuvndqicwcclhayyttc.supabase.co", "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M");
global.db = new Low(new JSONFile('database.json'));

export async function startBot() {
    protoType();
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();
    
    await loadDatabase();

    global.conn = makeSimpleSocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: new NodeCache(),
        keepAliveIntervalMs: 30000
    });

    if (!existsSync('./sessions/creds.json')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const num = global.botNumber || await new Promise(r => rl.question(chalk.blueBright('Número:\n> '), r));
        const code = await global.conn.requestPairingCode(num.replace(/\D/g, ''));
        console.log(chalk.magentaBright(`\nCODE: ${code?.match(/.{1,4}/g)?.join("-")}\n`));
        rl.close();
    }

    global.conn.ev.on('creds.update', saveCreds);
    global.conn.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') {
            console.log(chalk.greenBright('>>> CONEXIÓN EXITOSA'));
            await autostartSubBots();
        }
        if (u.connection === 'close') startBot();
    });

    global.conn.ev.on('messages.upsert', async (m) => {
        // Blindaje: Si no hay base de datos o el mensaje no tiene texto, ignorar
        if (!global.db?.data?.settings || !m.messages[0]) return;
        
        try {
            const handler = await import(`./handler.js?update=${Date.now()}`);
            setImmediate(() => handler.handler.call(global.conn, m));
        } catch (e) { }
    });

    setInterval(async () => {
        if (global.db.data && Object.keys(global.db.data).length > 0) {
            await global.db.write();
            supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() }).then();
        }
    }, 60 * 1000);
}

async function loadDatabase() {
    try {
        const { data } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').maybeSingle();
        if (data?.content) {
            global.db.data = data.content;
        } else {
            await global.db.read();
            global.db.data = global.db.data || { users: {}, chats: {}, settings: { [global.conn?.user?.jid]: { prefix: ['/'] } } };
        }
        global.db.chain = lodash.chain(global.db.data);
    } catch (e) {
        global.db.data = { users: {}, chats: {}, settings: {} };
    }
}

async function autostartSubBots() {
    const path = join(process.cwd(), 'jadibts');
    if (!existsSync(path)) return;
    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
    const folders = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
    
    console.log(chalk.yellow(`[SISTEMA] Cargando ${folders.length} sub-bots de golpe...`));
    folders.forEach(folder => {
        assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
    });
}
