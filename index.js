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
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'; // Cambio crítico aquí
import { Boom } from '@hapi/boom';
import { decodeJid } from './lib/message.js';
import store from './lib/store.js';
import NodeCache from 'node-cache';
import readline from 'readline';
import express from 'express';
import cors from 'cors';
import cfonts from 'cfonts';

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

let { say } = cfonts;
console.log(chalk.bold.hex('#7B68EE')('┌───────────────────────────┐'));
console.log(chalk.bold.hex('#7B68EE')('│      SYSTEM INITATING...      │'));
console.log(chalk.bold.hex('#7B68EE')('└───────────────────────────┘'));
say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

// Inicialización de base de datos corregida
const adapter = new JSONFile('database.json');
global.db = new Low(adapter, {
    users: {}, 
    chats: {}, 
    stats: {}, 
    msgs: {}, 
    sticker: {}, 
    settings: {}
});
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => setInterval(async function() {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1 * 1000));
  }
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(global.sessions || 'sessions');
const msgRetryCounterCache = new NodeCache();
const userDevicesCache = new NodeCache();
const { version } = await fetchLatestBaileysVersion();

const filterStrings = ["Q2xvc2luZyBzdGFsZSBvcGVu", "Q2xvc2luZyBvcGVuIHNlc3Npb24=", "RmFpbGVkIHRvIGRlY3J5cHQ=", "U2Vzc2lvbiBlcnJvcg==", "RXJyb3I6IEJhZCBNQUM=", "RGVjcnlwdGVkIG1lc3NhZ2U="];
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings));

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  getMessage: async (key) => {
    try {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    } catch { return ""; }
  },
  msgRetryCounterCache,
  userDevicesCache,
  version,
  keepAliveIntervalMs: 30000,
};

global.conn = makeWASocket(connectionOptions);
conn.decodeJid = decodeJid;

if (!existsSync(`./${global.sessions || 'sessions'}/creds.json`)) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));
    let phoneNumber = global.botNumber;
    if (!phoneNumber) {
        phoneNumber = await question(chalk.blueBright(`\n[ INPUT ] Ingrese el número del Bot:\n> `));
    }
    let addNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(addNumber);
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
        console.log(chalk.magentaBright(`\n╔═══════════════════════════════════════╗\n║  CÓDIGO DE VINCULACIÓN: ${codeBot}\n╚═══════════════════════════════════════╝\n`));
    }, 3000);
}

conn.isInit = false;
if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30 * 1000);

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  if (isNewLogin) conn.isInit = true;
  if (connection === 'close') {
    if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) await global.reloadHandler(true);
  }
}

process.on('uncaughtException', console.error);

global.reloadHandler = async function(restatConn) {
  let handler = await import(`./handler.js?update=${Date.now()}`);
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions);
    conn.decodeJid = decodeJid;
  }

  conn.handler = async (chatUpdate) => {
    setImmediate(async () => {
        try {
            await handler.handler.call(global.conn, chatUpdate);
        } catch (e) { console.error(e); }
    });
  };

  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  return true;
};

const pluginFolder = join(__dirname, './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      await readRecursive(file);
    } else if (pluginFilter(filename)) {
      try {
        const module = await import(pathToFileURL(file).href);
        const pluginName = path.relative(pluginFolder, file).replace(/\\/g, '/');
        global.plugins[pluginName] = module.default || module;
      } catch (e) {
        console.error(e);
      }
    }
  }
}

await readRecursive(pluginFolder);
watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const file = join(pluginFolder, filename);
    if (existsSync(file)) {
      try {
        const module = await import(`${pathToFileURL(file).href}?update=${Date.now()}`);
        const pluginName = filename.replace(/\\/g, '/');
        global.plugins[pluginName] = module.default || module;
      } catch (e) {
        console.error(e);
      }
    }
  }
});

await global.reloadHandler();

async function autostartSubBots() {
    const jadibtsPath = join(process.cwd(), 'jadibts');
    if (existsSync(jadibtsPath)) {
        const folders = readdirSync(jadibtsPath);
        folders.forEach(async (folder) => {
            if (statSync(join(jadibtsPath, folder)).isDirectory()) {
                try {
                    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
                    assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
                } catch (e) {}
            }
        });
    }
}
autostartSubBots();

function redefineConsoleMethod(methodName, filterStrings) {
  const original = console[methodName];
  console[methodName] = function() {
    if (typeof arguments[0] === 'string' && filterStrings.some(s => arguments[0].includes(atob(s)))) arguments[0] = "";
    original.apply(console, arguments);
  };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/get-pairing-code', async (req, res) => {
    let { number } = req.query; 
    if (!number) return res.status(400).send({ error: "Número requerido" });
    try {
        const num = number.replace(/\D/g, '');
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const code = await assistant_accessJadiBot({ 
            m: null, 
            conn: global.conn, 
            phoneNumber: num, 
            fromCommand: false,
            apiCall: true
        }); 
        res.status(200).send({ code });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(chalk.greenBright(`\nPUERTO: ${PORT}`));
});
