process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
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
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js';
import store from './lib/store.js';
const { proto } = (await import('@whiskeysockets/baileys')).default;
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');
import readline, { createInterface } from 'readline';
import NodeCache from 'node-cache';

const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const userDevicesCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

let { say } = cfonts;
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

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'));
global.DATABASE = global.db;
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};
loadDatabase();

const { state, saveState, saveCreds } = await useMultiFileAuthState(global.sessions);
const { version } = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber;
const methodCodeQR = process.argv.includes("qr");
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

const filterStrings = ["Q2xvc2luZyBzdGFsZSBvcGVu", "Q2xvc2luZyBvcGVuIHNlc3Npb24=", "RmFpbGVkIHRvIGRlY3J5cHQ=", "U2Vzc2lvbiBlcnJvcg==", "RXJyb3I6IEJhZCBNQUM=", "RGVjcnlwdGVkIG1lc3NhZ2U="];
console.info = () => {};
console.debug = () => {};

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  mobile: MethodMobile,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: false,
  syncFullHistory: false,
  shouldSyncHistoryMessage: () => false,
  getMessage: async (key) => {
    try {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    } catch {
      return "";
    }
  },
  msgRetryCounterCache,
  userDevicesCache,
  defaultQueryTimeoutMs: 30000,
  version
};

global.conn = makeWASocket(connectionOptions);

if (!methodCodeQR && !methodCode && !existsSync(`./${sessions}/creds.json`)) {
  if (global.conn && !global.conn.authState.creds.registered) {
    let addNumber = phoneNumber.replace(/[^0-9]/g, '');
    setTimeout(async () => {
      let codeBot = await conn.requestPairingCode(addNumber);
      codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
      console.log(chalk.bold.hex('#F0E68C')(`CÓDIGO: ${codeBot}`));
    }, 3000);
  }
}

conn.isInit = false;
conn.well = false;

if (!opts['test']) {
  if (global.db) setInterval(async () => {
    if (global.db.data) {
        await global.db.write();
        global.db.chain = chain(global.db.data);
    }
  }, 60 * 1000);
}

setInterval(() => {
  if (global.gc) global.gc();
}, 300000);

async function autoConnectSubBots() {
  let subBotsDir = path.join(__dirname, `./${jadi}`);
  if (!existsSync(subBotsDir)) return;
  let folders = readdirSync(subBotsDir).filter(f => statSync(path.join(subBotsDir, f)).isDirectory());
  for (const [i, folder] of folders.entries()) {
    setTimeout(() => {
      let pathAcc = path.join(subBotsDir, folder);
      if (existsSync(path.join(pathAcc, 'creds.json'))) {
        assistant_accessJadiBot({
          pathAssistantAccess: pathAcc,
          phoneNumber: folder,
          fromCommand: false,
          conn: global.conn
        });
      }
    }, i * 5000);
  }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  if (isNewLogin) conn.isInit = true;
  if (connection === "open") {
    await autoConnectSubBots();
  }
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (reason !== DisconnectReason.loggedOut) {
        await global.reloadHandler(true).catch(console.error);
    }
  }
}

process.on('uncaughtException', console.error);
let handler = await import('./handler.js');
global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error(e);
  }
  if (restatConn) {
    const oldChats = global.conn.chats;
    try { global.conn.ws.close(); } catch {}
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
  }
  conn.handler = handler.handler.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);
  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  return true;
};

setInterval(() => { process.exit(0); }, 10800000);

const pluginFolder = join(__dirname, './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    const stats = statSync(file);
    if (stats.isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      const module = await import(global.__filename(file));
      global.plugins[file.replace(pluginFolder + '/', '')] = module.default || module;
    }
  }
}

await readRecursive(pluginFolder).catch(console.error);

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
    global.plugins[filename.replace(pluginFolder + '/', '')] = module.default || module;
  }
};

watch(pluginFolder, { recursive: true }, global.reload);
await global.reloadHandler();

async function _quickTest() {
  const test = await Promise.all([spawn('ffmpeg'), spawn('ffprobe')].map((p) => {
    return Promise.race([
      new Promise((resolve) => { p.on('close', (code) => resolve(code !== 127)); }),
      new Promise((resolve) => { p.on('error', () => resolve(false)); })
    ]);
  }));
  global.support = { ffmpeg: test[0], ffprobe: test[1] };
}
_quickTest().catch(console.error);
