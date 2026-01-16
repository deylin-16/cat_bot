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
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co"; 
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');
const { chain } = lodash;
const PORT = process.env.PORT || 3000;

protoType();
serialize();

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') => rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));
const __dirname = global.__dirname(import.meta.url);

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.db = new Low(new JSONFile('database.json'));

global.loadDatabase = async function loadDatabase() {
  if (global.db.data !== null) return;
  const { data: cloudData } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').single();
  if (cloudData) {
    global.db.data = cloudData.content;
  } else {
    await global.db.read().catch(() => {});
    global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
  }
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState('sessions');
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const userDevicesCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const { version } = await fetchLatestBaileysVersion();

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
  },
  printQRInTerminal: false,
  markOnlineOnConnect: false,
  syncFullHistory: false,
  getMessage: async (key) => (await store.loadMessage(jidNormalizedUser(key.remoteJid), key.id))?.message || "",
  msgRetryCounterCache,
  userDevicesCache,
  version,
  connectTimeoutMs: 60000,
  keepAliveIntervalMs: 10000,
};

global.conn = makeWASocket(connectionOptions);

if (!existsSync('./sessions/creds.json')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let phoneNumber = global.botNumber || await new Promise(res => rl.question(chalk.blue('\nNúmero:\n> '), res));
  let addNumber = phoneNumber.replace(/\D/g, '');
  setTimeout(async () => {
    let code = await conn.requestPairingCode(addNumber);
    console.log(chalk.magenta(`\nCÓDIGO: ${code?.match(/.{1,4}/g)?.join("-") || code}\n`));
    rl.close();
  }, 3000);
}

setInterval(async () => {
  if (global.db.data) {
    await Promise.allSettled([
      global.db.write(),
      supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() })
    ]);
  }
}, 5 * 60 * 1000);

global.reloadHandler = async function(restatConn) {
  let handler = await import(`./handler.js?update=${Date.now()}`);
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions);
  }

  conn.handler = (chatUpdate) => {
    setImmediate(async () => {
      try { await handler.handler.call(global.conn, chatUpdate); } catch (e) { }
    });
  };

  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close' && new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) global.reloadHandler(true);
  });
  conn.ev.on('creds.update', saveCreds);
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
await global.reloadHandler();

async function autostartSubBots() {
  const jadibtsPath = join(process.cwd(), 'jadibts');
  if (!existsSync(jadibtsPath)) return;
  const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
  const folders = readdirSync(jadibtsPath).filter(f => statSync(join(jadibtsPath, f)).isDirectory());
  for (const folder of folders) {
    await new Promise(r => setTimeout(r, 2000));
    assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
  }
}
autostartSubBots();

const app = express().use(cors()).use(express.json());
app.get('/api/get-pairing-code', async (req, res) => {
  let { number } = req.query;
  if (!number) return res.status(400).json({ error: "Requerido" });
  try {
    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
    const code = await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: number.replace(/\D/g, ''), fromCommand: false, apiCall: true });
    res.json({ code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.listen(PORT);

process.on('uncaughtException', () => {});
