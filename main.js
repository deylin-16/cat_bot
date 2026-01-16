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

const supabase = createClient("https://kzuvndqicwcclhayyttc.supabase.co", "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M");
global.db = new Low(new JSONFile('database.json'));

export async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();
    
    await loadDatabase();

    global.conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        markOnlineOnConnect: true,
        msgRetryCounterCache: new NodeCache(),
        keepAliveIntervalMs: 30000
    });

    if (!existsSync('./sessions/creds.json')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const num = global.botNumber || await new Promise(r => rl.question(chalk.blueBright('Número del Bot:\n> '), r));
        const code = await global.conn.requestPairingCode(num.replace(/\D/g, ''));
        console.log(chalk.magentaBright(`\nCÓDIGO PRINCIPAL: ${code?.match(/.{1,4}/g)?.join("-")}\n`));
        rl.close();
    }

    global.conn.ev.on('creds.update', saveCreds);
    global.conn.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') {
            console.log(chalk.greenBright('>>> BOT PRINCIPAL CONECTADO'));
            await autostartSubBots();
        }
        if (u.connection === 'close') startBot();
    });

    const handler = await import('./handler.js');
    global.conn.ev.on('messages.upsert', m => {
        setImmediate(() => handler.handler.call(global.conn, m));
    });

    setInterval(async () => {
        if (global.db.data) {
            await global.db.write();
            await supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() });
        }
    }, 2 * 60 * 1000);
}

async function loadDatabase() {
    const { data } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').maybeSingle();
    global.db.data = data?.content || (await global.db.read(), global.db.data) || { users: {}, chats: {}, settings: {} };
    global.db.chain = lodash.chain(global.db.data);
}

async function autostartSubBots() {
    const path = join(process.cwd(), 'jadibts');
    if (!existsSync(path)) return;
    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
    const folders = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
    
    console.log(chalk.yellow(`[SISTEMA] Iniciando ${folders.length} sub-bots...`));
    for (const folder of folders) {
        await new Promise(r => setTimeout(r, 2000));
        assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
    }
}
