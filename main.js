import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser } from '@whiskeysockets/baileys';
import fs, { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import NodeCache from 'node-cache';
import chalk from 'chalk';
import readline from 'readline';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
import { createClient } from '@supabase/supabase-js';
import store from './lib/store.js';

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
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        },
        msgRetryCounterCache: new NodeCache(),
        keepAliveIntervalMs: 30000
    });

    if (!existsSync('./sessions/creds.json')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const question = (t) => new Promise((r) => rl.question(t, r));
        let num = global.botNumber || await question(chalk.blueBright('\nNúmero:\n> '));
        let addNumber = num.replace(/\D/g, '');
        
        setTimeout(async () => {
            let code = await global.conn.requestPairingCode(addNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.magentaBright(`\nCODE: ${code}\n`));
            rl.close();
        }, 3000);
    }

    global.conn.ev.on('creds.update', saveCreds);
    
    global.conn.ev.on('connection.update', async (u) => {
        const { connection } = u;
        if (connection === 'open') {
            console.log(chalk.greenBright('>>> ONLINE'));
            await autostartSubBots();
        }
        if (connection === 'close') startBot();
    });

    const handler = await import(`./handler.js?update=${Date.now()}`);
    global.conn.ev.on('messages.upsert', m => {
        if (!global.db.data) return;
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
    try {
        const { data } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').maybeSingle();
        global.db.data = data?.content || (await global.db.read(), global.db.data) || { users: {}, chats: {}, settings: {} };
        global.db.chain = lodash.chain(global.db.data);
    } catch (e) {
        global.db.data = { users: {}, chats: {}, settings: {} };
    }
}

async function autostartSubBots() {
    const path = join(process.cwd(), 'jadibts');
    if (!existsSync(path)) return;
    try {
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const folders = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
        for (const folder of folders) {
            assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
        }
    } catch (e) { }
}
