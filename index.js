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
    Browsers,
    extractMessageContent
} = (await import('@whiskeysockets/baileys')).default;

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

cfonts.say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
cfonts.say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') => rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));
global.__require = (dir = import.meta.url) => createRequire(dir);

const __dirname = global.__dirname(import.meta.url);

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
    syncFullHistory: false,
    markOnlineOnConnect: false,
    getMessage: async (key) => (await (await import('./lib/store.js')).default.loadMessage(jidNormalizedUser(key.remoteJid), key.id))?.message || ""
};

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

const serialize = (conn, m) => {
    if (!m) return m;
    m.id = m.key.id;
    m.chat = jidNormalizedUser(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : (m.key.participant || m.key.remoteJid));
    
    let vM = m.message;
    if (vM) {
        m.type = Object.keys(vM)[0];
        m.msg = extractMessageContent(vM[m.type]);
        m.body = m.msg?.text || m.msg?.caption || m.msg?.selectedId || m.msg?.contentText || m.msg?.code || m.text || "";
        m.text = m.body; // Compatibilidad con handlers viejos
        
        m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo : null;
        if (m.quoted) {
            let qM = m.quoted.quotedMessage;
            m.quoted.type = Object.keys(qM)[0];
            m.quoted.msg = extractMessageContent(qM[m.quoted.type]);
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant || m.chat);
            m.quoted.fromMe = m.quoted.sender === jidNormalizedUser(conn.user.id);
            m.quoted.body = m.quoted.msg?.text || m.quoted.msg?.caption || "";
            m.quoted.text = m.quoted.body;
        }
    }
    
    m.reply = (text, chatId, options) => conn.sendMessage(chatId || m.chat, { text }, { quoted: m, ...options });
    m.react = (text) => conn.sendMessage(m.chat, { react: { text, key: m.key } });
    
    return m;
};

global.conn = makeWASocket(connectionOptions);

if (!existsSync(`./${global.sessions || 'sessions'}/creds.json`)) {
    let phoneNumber = global.botNumber;
    if (!phoneNumber) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        phoneNumber = await new Promise(res => rl.question(chalk.blueBright('\n[ INPUT ] Ingrese el número del Bot: '), res));
        rl.close();
    }
    const cleanNumber = (phoneNumber || '').replace(/\D/g, '');
    if (cleanNumber) {
        setTimeout(async () => {
            let code = await global.conn.requestPairingCode(cleanNumber);
            console.log(chalk.black.bgMagenta(`\n CÓDIGO DE VINCULACIÓN: ${code?.match(/.{1,4}/g)?.join("-") || code} \n`));
        }, 3000);
    }
}

global.reloadHandler = async function (restatConn) {
    try {
        const handlerPath = `./handler.js?update=${Date.now()}`;
        let handler = await import(handlerPath);
        if (restatConn) {
            try { global.conn.ws.close(); } catch {}
            global.conn.ev.removeAllListeners();
            global.conn = makeWASocket(connectionOptions);
        }

        global.conn.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
                let rawMsg = chatUpdate.messages[0];
                if (rawMsg.key.remoteJid === 'status@broadcast') return;
                
                const m = serialize(global.conn, rawMsg);
                if (!m) return;
                
                await handler.handler.call(global.conn, m, chatUpdate);
            } catch (e) { formatError(e); }
        });

        global.conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (code !== DisconnectReason.loggedOut) await global.reloadHandler(true);
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
