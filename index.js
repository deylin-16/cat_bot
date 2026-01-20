process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join } from 'path';
import fs, { existsSync, readdirSync, statSync, watch } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import lodash from 'lodash';
import { Low, JSONFile } from 'lowdb';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import express from 'express';
import cors from 'cors';
import cfonts from 'cfonts';

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser, 
    Browsers 
} = (await import('@whiskeysockets/baileys')).default;

const { protoType, serialize } = await import('./lib/simple.js');
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

cfonts.say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
cfonts.say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') => rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));
global.__require = (dir = import.meta.url) => createRequire(dir);

const __dirname = global.__dirname(import.meta.url);
protoType();
serialize();

global.db = new Low(new JSONFile('database.json'));
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((res) => {
        const itv = setInterval(async () => {
            if (!global.db.READ) { clearInterval(itv); res(global.db.data || global.loadDatabase()); }
        }, 1000);
    });
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
    global.db.READ = false;
};
await global.loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(global.sessions || 'sessions');
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();
const userDevicesCache = new NodeCache();

const connectionOptions = {
    version,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
    },
    browser: Browsers.macOS("Chrome"),
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache,
    userDevicesCache,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    getMessage: async (key) => (await (await import('./lib/store.js')).default.loadMessage(jidNormalizedUser(key.remoteJid), key.id))?.message || ""
};

global.conn = makeWASocket(connectionOptions);

if (!existsSync(`./${global.sessions || 'sessions'}/creds.json`)) {
    let phoneNumber = global.botNumber;
    if (!phoneNumber) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        phoneNumber = await new Promise(res => rl.question(chalk.blueBright('\n[ INPUT ] Ingrese el número del Bot: '), res));
        rl.close();
    }
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        let code = await global.conn.requestPairingCode(cleanNumber);
        console.log(chalk.black.bgMagenta(`\n CÓDIGO DE VINCULACIÓN: ${code?.match(/.{1,4}/g)?.join("-") || code} \n`));
    }, 3000);
}

const formatError = (err) => {
    const stack = err.stack || String(err);
    const lines = stack.split('\n');
    const relevantLine = lines.find(l => l.includes('.js') && !l.includes('node_modules')) || lines[1];
    console.log(chalk.redBright.bold('\n┌─ 「 SYSTEM ERROR 」'));
    console.log(chalk.redBright(`│ 📝 Mensaje: ${err.message || err}`));
    console.log(chalk.yellow(`│ 📍 Ubicación: ${relevantLine ? relevantLine.trim() : 'Desconocida'}`));
    console.log(chalk.redBright('└─────────────────────\n'));
};

process.on('uncaughtException', formatError);
process.on('unhandledRejection', formatError);

global.reloadHandler = async function (restatConn) {
    try {
        const handlerPath = `./handler.js?update=${Date.now()}`;
        let handler = await import(handlerPath);
        if (restatConn) {
            try { global.conn.ws.close(); } catch {}
            global.conn.ev.removeAllListeners();
            global.conn = makeWASocket(connectionOptions);
        }
        global.conn.handler = async (chatUpdate) => {
            try {
                await handler.handler.call(global.conn, chatUpdate);
            } catch (e) { formatError(e); }
        };
        global.conn.ev.on('messages.upsert', global.conn.handler);
        global.conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) await global.reloadHandler(true);
            }
        });
        global.conn.ev.on('creds.update', saveCreds);
        return true;
    } catch (e) { formatError(e); }
};

global.plugins = {};
const pluginFolder = join(__dirname, 'plugins');
const loadPlugins = async (dir) => {
    const files = readdirSync(dir);
    for (const file of files) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) await loadPlugins(fullPath);
        else if (/\.js$/.test(file)) {
            try {
                const module = await import(global.__filename(fullPath) + `?update=${Date.now()}`);
                global.plugins[fullPath.replace(pluginFolder + path.sep, '')] = module.default || module;
            } catch (e) { formatError(e); }
        }
    }
};

await loadPlugins(pluginFolder);
watch(pluginFolder, { recursive: true }, async (event, filename) => {
    if (/\.js$/.test(filename)) {
        const fullPath = join(pluginFolder, filename);
        try {
            const module = await import(global.__filename(fullPath) + `?update=${Date.now()}`);
            global.plugins[filename.replace(pluginFolder + path.sep, '')] = module.default || module;
        } catch (e) { formatError(e); }
    }
});

await global.reloadHandler();

const app = express();
app.use(cors(), express.json());
app.get('/api/get-pairing-code', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: "Número requerido" });
    try {
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const code = await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: number.replace(/\D/g, ''), fromCommand: false, apiCall: true });
        res.status(200).json({ code });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(chalk.greenBright(`\nSISTEMA INDEPENDIENTE ACTIVO: Puerto ${PORT}`)));

setInterval(async () => { if (global.db.data) await global.db.write().catch(() => {}); }, 30000);
