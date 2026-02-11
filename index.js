process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, createWriteStream, unlinkSync, rmSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import axios from 'axios'; 
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = function () {
  const args = Array.from(arguments);
  const msg = args.join(' ');
  if (msg.includes('Closing session') || msg.includes('SessionEntry') || msg.includes('Verifying identity') || msg.includes('registrationId') || msg.includes('currentRatchet') || msg.includes('_chains') || msg.includes('chainKey') || msg.includes('publicKey') || msg.includes('privateKey')) {
    return; 
  }
  originalLog.apply(console, args);
};

const originalDir = console.dir;
console.dir = function () {
  const args = Array.from(arguments);
  if (args[0] && (args[0].constructor?.name === 'SessionEntry' || args[0].sessionConfig || args[0].registrationId || args[0]._chains)) {
    return;
  }
  originalDir.apply(console, args);
};

EventEmitter.defaultMaxListeners = 0;

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser,
    Browsers
} = await import('@whiskeysockets/baileys');

const { chain } = lodash;

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();
cfonts.say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
cfonts.say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const adapter = new JSONFile('database.json');
global.db = new Low(adapter, {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {}
});

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = global.db.data || {
    users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}
  };
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();

const connectionOptions = {
  version,
  logger: pino({ level: 'silent' }), 
  printQRInTerminal: false,
  browser: Browsers.ubuntu("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })), 
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 5000,
  getMessage: async (key) => { return ""; } 
};

global.conn = makeWASocket(connectionOptions);

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));
    console.log(chalk.bold.magenta('\n➤ VINCULACIÓN REFORZADA'));
    let phoneNumber = await question(chalk.cyanBright(`\n➤ Ingrese el número:\n> `));
    let addNumber = phoneNumber.replace(/\D/g, '');

    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
            console.log(chalk.magentaBright(`\nCÓDIGO: ${codeBot}\n`));
        } catch {
            console.log(chalk.red('\n[ ! ] Error de red.'));
        }
    }, 3000);
}

if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30 * 1000);

global.reload = async function(restatConn) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 10000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg) return;
        if (!msg.message && !msg.messageStubType) return;
        const m = await smsg(conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default?.message || module.default;

        if (typeof Func === 'function') {
            await Func.call(conn, m, chatUpdate);
        }
    } catch (e) {}
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.yellow(`[ ✿ ] Conectando...`));

    if (connection === 'open') {
        console.log(chalk.greenBright(`[ ✿ ] ¡CONECTADO! a: ${conn.user.name || 'WhatsApp Bot'}`));
        global.isBotReady = true;
        await monitorBot(conn, 'online');

        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }

    if (connection === 'close') {
      await monitorBot(conn, 'offline');
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

      if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.connectionLost) {
          console.log(chalk.blue("[ ! ] Estabilizando conexión..."));
          await global.reload(true);
      } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red("[ ! ] Sesión cerrada."));
          rmSync(sessionPath, { recursive: true, force: true });
          process.exit(1);
      } else {
          console.log(chalk.red(`[ ! ] Reintentando en 10s... (Motivo: ${reason})`));
          await global.reload(true);
      }
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();
