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
const { CONNECTING } = ws;
const { chain } = lodash;

protoType();
serialize();

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());

global.db = new Low(new JSONFile('database.json'));
global.loadDatabase = async function loadDatabase() {
  if (global.db.data !== null) return;
  await global.db.read().catch(console.error);
  global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}), };
};
loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
const { version } = await fetchLatestBaileysVersion();

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
  },
  version: version,
};

global.conn = makeWASocket(connectionOptions);

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update;
  if (connection === "open") {
    console.log(chalk.green(`\n:: BOT PRINCIPAL CONECTADO ::\n`));
    await autoConnectSubBots();
  }
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (reason !== DisconnectReason.loggedOut) await global.reloadHandler(true);
  }
}

async function autoConnectSubBots() {
  let subBotsDir = path.join(__dirname, `./${jadi}`);
  if (!existsSync(subBotsDir)) return;
  let folders = readdirSync(subBotsDir);
  console.log(chalk.blue(`:: RECONECTANDO ${folders.length} SUB-BOTS... ::`));
  for (let folder of folders) {
    if (existsSync(path.join(subBotsDir, folder, 'creds.json'))) {
        assistant_accessJadiBot({
            pathAssistantAccess: path.join(subBotsDir, folder),
            phoneNumber: folder,
            fromCommand: false,
            conn: global.conn
        });
    }
  }
}

global.reloadHandler = async function(restatConn) {
  let handler = await import('./handler.js');
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    global.conn = makeWASocket(connectionOptions);
  }
  global.conn.handler = handler.handler.bind(global.conn);
  global.conn.connectionUpdate = connectionUpdate.bind(global.conn);
  global.conn.credsUpdate = saveCreds.bind(global.conn, true);
  global.conn.ev.on('messages.upsert', global.conn.handler);
  global.conn.ev.on('connection.update', global.conn.connectionUpdate);
  global.conn.ev.on('creds.update', global.conn.credsUpdate);
  return true;
};

await global.reloadHandler();

async function isValidPhoneNumber(number) {
  try {
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch { return false; }
}
