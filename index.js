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
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers, initInMemoryKeyStore } = await import('@whiskeysockets/baileys');
import readline, { createInterface } from 'readline';
import NodeCache from 'node-cache';
import mongoose from 'mongoose';

const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

let { say } = cfonts;
console.log(chalk.bold.hex('#7B68EE')('┌───────────────────────────┐'));
console.log(chalk.bold.hex('#7B68EE')('│      SYSTEM INITATING...      │'));
console.log(chalk.bold.hex('#7B68EE')('└───────────────────────────┘'));
say('WhatsApp_bot', {
  font: 'chrome',
  align: 'center',
  gradient: ['#00BFFF', '#FF4500'] 
});
say('by Deylin', {
  font: 'console',
  align: 'center',
  colors: ['#DAA520', '#FF69B4', '#ADFF2F']
});
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

const mongoUrl = 'mongodb+srv://deylin1616_db_user:xZLcdCWwMUt7bdw6@cluster0.p7vky.mongodb.net/WhatsAppBot?retryWrites=true&w=majority';

global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') 
    ? new cloudDBAdapter(opts['db']) 
    : /mongodb/.test(opts['db'] || mongoUrl) 
      ? new mongoDB(opts['db'] || mongoUrl) 
      : new JSONFile('database.json')
);
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (/mongodb/.test(opts['db'] || mongoUrl)) {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      }).then(() => console.log(chalk.greenBright("✅ Conectado a MongoDB Atlas")))
        .catch(e => console.error(chalk.redBright("❌ Error en MongoDB:"), e));
    }
  }

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
await loadDatabase();

async function useMongooseAuthState(modelName) {
    const SessionSchema = new mongoose.Schema({
        _id: String,
        data: String
    });
    const SessionModel = mongoose.models[modelName] || mongoose.model(modelName, SessionSchema);

    const writeData = async (data, id) => {
        const json = JSON.stringify(data, (k, v) => Buffer.isBuffer(v) ? { type: 'Buffer', data: v.toString('base64') } : v);
        await SessionModel.replaceOne({ _id: id }, { data: json }, { upsert: true });
    };

    const readData = async (id) => {
        try {
            const res = await SessionModel.findOne({ _id: id });
            if (!res) return null;
            return JSON.parse(res.data, (k, v) => v?.type === 'Buffer' ? Buffer.from(v.data, 'base64') : v);
        } catch { return null; }
    };

    const removeData = async (id) => {
        try { await SessionModel.deleteOne({ _id: id }); } catch {}
    };

    let creds = await readData('creds');
    if (!creds) {
        creds = initInMemoryKeyStore().creds;
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            tasks.push(value ? writeData(value, sId) : removeData(sId));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

const { state, saveCreds } = (global.db instanceof mongoDB || global.db instanceof mongoDBV2) 
    ? await useMongooseAuthState('SessionMain') 
    : await useMultiFileAuthState(global.sessions);

const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const { version } = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber;
const methodCodeQR = process.argv.includes("qr");
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

const consoleAccent = chalk.bold.hex('#FF69B4');
const consoleSuccess = chalk.bold.hex('#32CD32');
const consoleError = chalk.bold.hex('#FF4500');
const consoleWarning = chalk.bold.hex('#FFA500');
const consoleInfo = chalk.bold.hex('#1E90FF');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

const filterStrings = ["Q2xvc2luZyBzdGFsZSBvcGVu", "Q2xvc2luZyBvcGVuIHNlc3Npb24=", "RmFpbGVkIHRvIGRlY3J5cHQ=", "U2Vzc2lvbiBlcnJvcg==", "RXJyb3I6IEJhZCBNQUM=", "RGVjcnlwdGVkIG1lc3NhZ2U="];

console.info = () => {};
console.debug = () => {};
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings));

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  mobile: MethodMobile,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  patchMessageBeforeSending: (message) => {
    const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage || message.interactiveMessage);
    if (requiresPatch) return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
    return message;
  },
  getMessage: async (key) => {
    try {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    } catch { return ""; }
  },
  msgRetryCounterCache,
  userDevicesCache,
  defaultQueryTimeoutMs: undefined,
  cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
  version,
  keepAliveIntervalMs: 55000,
  maxIdleTimeMs: 60000,
};

global.conn = makeWASocket(connectionOptions);

let opcion;
if (!methodCodeQR && !methodCode && !existsSync(`./${sessions}/creds.json`)) {
  opcion = '2';
}

if (!existsSync(`./${sessions}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2';
    if (!conn.authState.creds.registered) {
      let addNumber = !!phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : null;
      if (!addNumber) {
        while (true) {
          phoneNumber = await question(consoleInfo(`[ INPUT ] Ingrese el número de WhatsApp:\n> `));
          let cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
          if (!cleanNumber.startsWith('+')) cleanNumber = `+${cleanNumber}`;
          if (await isValidPhoneNumber(cleanNumber)) {
            addNumber = cleanNumber.replace(/\D/g, '');
            break;
          } else console.log(consoleError(":: ERROR :: Número inválido."));
        }
        rl.close();
      }
      setTimeout(async () => {
          let codeBot = await conn.requestPairingCode(addNumber);
          codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
          console.log(consoleAccent(`\n╔═══════════════════════════════════════╗\n║  CÓDIGO DE VINCULACIÓN: ${codeBot}\n╚═══════════════════════════════════════╝\n`));
      }, 3000);
    }
  }
}

conn.isInit = false;
if (!opts['test']) {
  if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30 * 1000);
}

async function autoConnectSubBots() {
  let subBotsDir = path.join(__dirname, `./${jadi}`);
  if (!existsSync(subBotsDir)) return;
  for (let folder of readdirSync(subBotsDir)) {
    let pathAcc = path.join(subBotsDir, folder);
    if (statSync(pathAcc).isDirectory() && existsSync(path.join(pathAcc, 'creds.json'))) {
      assistant_accessJadiBot({ pathAssistantAccess: pathAcc, phoneNumber: folder, fromCommand: false, conn: global.conn });
    }
  }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  if (isNewLogin) conn.isInit = true;
  if (connection === "open") await autoConnectSubBots();
  if (connection === 'close') {
    if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) await global.reloadHandler(true);
  }
}

process.on('uncaughtException', console.error);
let handler = await import('./handler.js');
global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) { console.error(e); }
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
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      const module = await import(global.__filename(file));
      global.plugins[file.replace(pluginFolder + '/', '')] = module.default || module;
    }
  }
}
await readRecursive(pluginFolder);
watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
    global.plugins[filename.replace(pluginFolder + '/', '')] = module.default || module;
  }
});
await global.reloadHandler();

function redefineConsoleMethod(methodName, filterStrings) {
  const original = console[methodName];
  console[methodName] = function() {
    if (typeof arguments[0] === 'string' && filterStrings.some(s => arguments[0].includes(atob(s)))) arguments[0] = "";
    original.apply(console, arguments);
  };
}

async function isValidPhoneNumber(number) {
  try { return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(number)); } catch { return false; }
}
