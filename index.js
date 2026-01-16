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
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import store from './lib/store.js';
import NodeCache from 'node-cache';
import readline from 'readline';
import express from 'express';
import cors from 'cors';
import cfonts from 'cfonts';
import { createClient } from '@supabase/supabase-js';
import { createClient as createRedis } from 'redis';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co"; 
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const redis = createRedis({
    url: 'redis://default:AZ6vAAIncDI0NmM4N2VjNTZmZWU0MDkyODI1NDI5NTU5MTY4NGFlMnAyNDA2MjM@positive-quail-40623.upstash.io:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                global.redisDisabled = true;
                return false;
            }
            return 1000;
        }
    }
});
redis.on('error', () => { global.redisDisabled = true; });
if (!redis.isOpen) redis.connect().catch(() => { global.redisDisabled = true; });

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

let { say } = cfonts;
console.log(chalk.bold.hex('#7B68EE')('┌───────────────────────────┐'));
console.log(chalk.bold.hex('#7B68EE')('│      SYSTEM OPTIMIZED...      │'));
console.log(chalk.bold.hex('#7B68EE')('└───────────────────────────┘'));
say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });

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

global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

global.db = new Low(new JSONFile('database.json'));
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (global.db.data !== null) return;
  const { data: cloud } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').single();
  if (cloud) {
    global.db.data = cloud.content;
  } else {
    await global.db.read().catch(() => {});
    global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
  }
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(global.sessions || 'sessions');
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const userDevicesCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const { version } = await fetchLatestBaileysVersion();

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
  keepAliveIntervalMs: 15000,
  maxMsgRetryCount: 3
};

global.conn = makeWASocket(connectionOptions);

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
setInterval(async () => {
  if (global.db.data) {
    await Promise.allSettled([
      global.db.write(),
      supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() })
    ]);
  }
}, 2 * 60 * 1000);

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  if (isNewLogin) conn.isInit = true;
  if (connection === 'close') {
    if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) await global.reloadHandler(true);
  }
}

process.on('uncaughtException', () => {});

global.reloadHandler = async function(restatConn) {
  let handler = await import(`./handler.js?update=${Date.now()}`);
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions);
  }

  conn.handler = async (chatUpdate) => {
    setImmediate(async () => {
        try {
            await handler.handler.call(global.conn, chatUpdate);
        } catch (e) { }
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
global.plugins = {};
async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (/\.js$/.test(filename)) {
      const module = await import(global.__filename(file));
      global.plugins[file.replace(pluginFolder + '/', '')] = module.default || module;
    }
  }
}

await readRecursive(pluginFolder);
watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (/\.js$/.test(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
    global.plugins[filename.replace(pluginFolder + '/', '')] = module.default || module;
  }
});

await global.reloadHandler();

async function autostartSubBots() {
    const jadibtsPath = join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsPath)) return;
    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
    const folders = readdirSync(jadibtsPath).filter(f => statSync(join(jadibtsPath, f)).isDirectory());

    for (const folder of folders) {
        await new Promise(r => setTimeout(r, 1500));
        assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
    }
}
autostartSubBots();

const app = express().use(cors()).use(express.json());

app.get('/api/get-pairing-code', async (req, res) => {
    let { number } = req.query; 
    if (!number) return res.status(400).send({ error: "Número requerido" });
    try {
        const num = number.replace(/\D/g, '');
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const code = await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: num, fromCommand: false, apiCall: true }); 
        res.status(200).send({ code });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.listen(PORT, () => console.log(chalk.greenBright(`PORT: ${PORT}`)));
