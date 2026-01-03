Process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { setupMaster, fork } from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import cfonts from 'cfonts';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn, execSync } from 'child_process';
import lodash from 'lodash';
import { assistant_accessJadiBot } from './plugins/©acceso.js';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import boxen from 'boxen';
import pino from 'pino';
import path, { join, dirname } from 'path';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import store from './lib/store.js';
const { proto } = (await import('@whiskeysockets/baileys')).default;
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');
import readline, { createInterface } from 'readline';
import NodeCache from 'node-cache';
import express from 'express';
import cors from 'cors';

const { CONNECTING } = ws;
const { chain } = lodash;

// --- LÓGICA DE ARGUMENTOS PARA SUB-BOTS ---
const args_terminal = process.argv.slice(2);
const session_arg = args_terminal.find(a => a.startsWith('--session='));
const chat_arg = args_terminal.find(a => a.startsWith('--chatId='));

const isSubBot = !!session_arg;
const subBotNumber = isSubBot ? session_arg.split('=')[1] : null;
const targetChat = chat_arg ? chat_arg.split('=')[1] : null;

// Carpeta de sesión dinámica
const folder_session = isSubBot ? `./jadibots/${subBotNumber}` : (global.sessions || 'sessions');
if (isSubBot && !existsSync('./jadibots')) mkdirSync('./jadibots');
// ------------------------------------------

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

let { say } = cfonts;
if (!isSubBot) {
    console.log(chalk.bold.hex('#7B68EE')('┌───────────────────────────┐'));
    console.log(chalk.bold.hex('#7B68EE')('│      SYSTEM INITATING...      │'));
    console.log(chalk.bold.hex('#7B68EE')('└───────────────────────────┘'));
    say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
    say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });
}

protoType();
serialize();

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

global.db = new Low(new JSONFile(isSubBot ? `./jadibots/db_${subBotNumber}.json` : 'database.json'));
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  await global.db.read().catch(console.error);
  global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
};
await loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(folder_session);
const msgRetryCounterCache = new NodeCache();
const { version } = await fetchLatestBaileysVersion();

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: !isSubBot,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
  },
  markOnlineOnConnect: false,
  syncFullHistory: false, // Optimizado para servidores baratos
  getMessage: async (key) => { return "" },
  msgRetryCounterCache,
  version,
};

global.conn = makeWASocket(connectionOptions);

if (isSubBot && !conn.authState.creds.registered) {
    setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(subBotNumber);
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
        if (targetChat) {
            await conn.sendMessage(targetChat, { 
                text: `✅ *CÓDIGO PARA TU SUB-BOT*\n\nNúmero: ${subBotNumber}\nCódigo: *${codeBot}*\n\n_Úsalo en Dispositivos Vinculados._` 
            });
        }
    }, 3000);
} else if (!isSubBot && !existsSync(`./${folder_session}/creds.json`)) {
    
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
        // En servidores baratos, un reinicio limpio es mejor
        process.exit(); 
    }
  }
}

// Vinculación de Handlers
conn.handler = handler.handler.bind(global.conn);
conn.connectionUpdate = connectionUpdate.bind(global.conn);
conn.credsUpdate = saveCreds.bind(global.conn, true);
conn.ev.on('messages.upsert', conn.handler);
conn.ev.on('connection.update', conn.connectionUpdate);
conn.ev.on('creds.update', conn.credsUpdate);

const pluginFolder = join(__dirname, './plugins');
const readRecursive = async (folder) => {
    for (const filename of readdirSync(folder)) {
        const file = join(folder, filename);
        if (statSync(file).isDirectory()) await readRecursive(file);
        else if (/\.js$/.test(filename)) {
            const module = await import(global.__filename(file));
            global.plugins[file.replace(pluginFolder + '/', '')] = module.default || module;
        }
    }
};
global.plugins = {};
await readRecursive(pluginFolder);

if (!isSubBot) {
    const app = express();
    app.use(cors());
    app.listen(PORT, () => console.log(chalk.greenBright(`API WEB ACTIVA: ${PORT}`)));
}
