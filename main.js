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
import './lib/simple.js'; // Asegura que las protoTypes se carguen

const supabase = createClient("https://kzuvndqicwcclhayyttc.supabase.co", "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M");
global.db = new Low(new JSONFile('database.json'));

export async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();
    
    await loadDatabase();

    const connectionOptions = {
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
    };

    global.conn = makeWASocket(connectionOptions);

    if (!existsSync('./sessions/creds.json')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const num = global.botNumber || await new Promise(r => rl.question(chalk.blueBright('\n[ INPUT ] Número del Bot Principal:\n> '), r));
        const code = await global.conn.requestPairingCode(num.replace(/\D/g, ''));
        console.log(chalk.magentaBright(`\nCÓDIGO PRINCIPAL: ${code?.match(/.{1,4}/g)?.join("-")}\n`));
        rl.close();
    }

    global.conn.ev.on('creds.update', saveCreds);
    
    global.conn.ev.on('connection.update', async (u) => {
        const { connection } = u;
        if (connection === 'open') {
            console.log(chalk.greenBright('>>> BOT PRINCIPAL ONLINE'));
            await autostartSubBots();
        }
        if (connection === 'close') startBot();
    });

    global.conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (!global.db.data) return;
        try {
            const handler = await import(`./handler.js?update=${Date.now()}`);
            await handler.handler.call(global.conn, chatUpdate);
        } catch (e) { console.error(e); }
    });

    setInterval(async () => {
        if (global.db.data) {
            await global.db.write();
            await supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() }).then(); 
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
        console.log(chalk.yellow(`[SISTEMA] Cargando ${folders.length} sub-bots de golpe...`));
        
        // Carga masiva paralela
        folders.forEach(folder => {
            assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
        });
    } catch (e) { }
}
