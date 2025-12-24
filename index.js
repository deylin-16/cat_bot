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

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'));
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

const filterStrings = [
  "Q2xvc2luZyBzdGFsZSBvcGVu",
  "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
  "RmFpbGVkIHRvIGRlY3J5cHQ=",
  "U2Vzc2lvbiBlcnJvcg==",
  "RXJyb3I6IEJhZCBNQUM=",
  "RGVjcnlwdGVkIG1lc3NhZ2U="
];

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
  getMessage: async (key) => {
    try {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    } catch (error) {
      return "";
    }
  },
  msgRetryCounterCache: msgRetryCounterCache || new Map(),
  userDevicesCache: userDevicesCache || new Map(),
  defaultQueryTimeoutMs: undefined,
  cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
  version: version,
  keepAliveIntervalMs: 55000,
  maxIdleTimeMs: 60000,
};

global.conn = makeWASocket(connectionOptions);

let opcion;
if (!methodCodeQR && !methodCode && !existsSync(`./${sessions}/creds.json`)) {
  opcion = '2';
  if (global.conn && !global.conn.authState.creds.registered) {
    console.log(consoleAccent(":: INICIO :: Conexión por código de emparejamiento seleccionada."));
  }
}

if (!existsSync(`./${sessions}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2';
    if (!conn.authState.creds.registered) {
      let addNumber;
      if (!!phoneNumber) {
        addNumber = phoneNumber.replace(/[^0-9]/g, '');
      } else {
        do {
          phoneNumber = await question(consoleInfo(`[ INPUT ] Ingrese el número de WhatsApp para conectar (Ej: +505 7631 5903):\n> `));
          phoneNumber = phoneNumber.replace(/\D/g, '');
        } while (!await isValidPhoneNumber(phoneNumber));
        rl.close();
        addNumber = phoneNumber.replace(/\D/g, '');
        setTimeout(async () => {
          let codeBot = await conn.requestPairingCode(addNumber);
          codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
          console.log(consoleAccent(`\n╔═══════════════════════════════════════╗`));
          console.log(consoleAccent(`║  CÓDIGO DE VINCULACIÓN: `), chalk.bold.hex('#F0E68C')(`${codeBot}`));
          console.log(consoleAccent(`╚═══════════════════════════════════════╝\n`));
        }, 3000);
      }
    }
  }
}

conn.isInit = false;
conn.well = false;
console.log(consoleSuccess(`:: ESTADO :: Conexión lista para handler. ${chalk.bold.hex('#1E90FF')(`(v${version.join('.')})`)}\n`));

if (!opts['test']) {
  if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write();
    if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [tmpdir(), 'tmp', `${jadi}`], tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])));
  }, 30 * 1000);
}

async function resolveLidToRealJid(lidJid, groupJid, maxRetries = 3, retryDelay = 1000) {
  if (!lidJid?.endsWith("@lid") || !groupJid?.endsWith("@g.us")) return lidJid?.includes("@") ? lidJid : `${lidJid}@s.whatsapp.net`;
  const cached = lidCache.get(lidJid);
  if (cached) return cached;
  const lidToFind = lidJid.split("@")[0];
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const metadata = await conn.groupMetadata(groupJid);
      if (!metadata?.participants) throw new Error("No se obtuvieron participantes");
      for (const participant of metadata.participants) {
        try {
          if (!participant?.jid) continue;
          const contactDetails = await conn.onWhatsApp(participant.jid);
          if (!contactDetails?.[0]?.lid) continue;
          const possibleLid = contactDetails[0].lid.split("@")[0];
          if (possibleLid === lidToFind) {
            lidCache.set(lidJid, participant.jid);
            return participant.jid;
          }
        } catch (e) {
          continue;
        }
      }
      lidCache.set(lidJid, lidJid);
      return lidJid;
    } catch (e) {
      attempts++;
      if (attempts >= maxRetries) {
        lidCache.set(lidJid, lidJid);
        return lidJid;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  return lidJid;
}

async function extractAndProcessLids(text, groupJid) {
  if (!text) return text;
  const lidMatches = text.match(/\d+@lid/g) || [];
  let processedText = text;
  for (const lid of lidMatches) {
    try {
      const realJid = await resolveLidToRealJid(lid, groupJid);
      processedText = processedText.replace(new RegExp(lid, 'g'), realJid);
    } catch (e) {
      console.error(`Error procesando LID ${lid}:`, e);
    }
  }
  return processedText;
}

async function processLidsInMessage(message, groupJid) {
  if (!message || !message.key) return message;
  try {
    const messageCopy = {
      key: { ...message.key },
      message: message.message ? { ...message.message } : undefined,
      ...(message.quoted && { quoted: { ...message.quoted } }),
      ...(message.mentionedJid && { mentionedJid: [...message.mentionedJid] })
    };
    const remoteJid = messageCopy.key.remoteJid || groupJid;
    if (messageCopy.key?.participant?.endsWith('@lid')) {
      messageCopy.key.participant = await resolveLidToRealJid(messageCopy.key.participant, remoteJid);
    }
    if (messageCopy.message?.extendedTextMessage?.contextInfo?.participant?.endsWith('@lid')) {
      messageCopy.message.extendedTextMessage.contextInfo.participant = await resolveLidToRealJid(messageCopy.message.extendedTextMessage.contextInfo.participant, remoteJid);
    }
    if (messageCopy.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentionedJid = messageCopy.message.extendedTextMessage.contextInfo.mentionedJid;
      if (Array.isArray(mentionedJid)) {
        for (let i = 0; i < mentionedJid.length; i++) {
          if (mentionedJid[i]?.endsWith('@lid')) {
            mentionedJid[i] = await resolveLidToRealJid(mentionedJid[i], remoteJid);
          }
        }
      }
    }
    if (messageCopy.message?.conversation) {
      messageCopy.message.conversation = await extractAndProcessLids(messageCopy.message.conversation, remoteJid);
    }
    if (messageCopy.message?.extendedTextMessage?.text) {
      messageCopy.message.extendedTextMessage.text = await extractAndProcessLids(messageCopy.message.extendedTextMessage.text, remoteJid);
    }
    return messageCopy;
  } catch (e) {
    console.error('Error en processLidsInMessage:', e);
    return message;
  }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  global.stopped = connection;
  if (isNewLogin) conn.isInit = true;
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }
  if (global.db.data == null) loadDatabase();
  if (connection === "open") {
    const userJid = jidNormalizedUser(conn.user.id);
    const userName = conn.user.name || conn.user.verifiedName || "Desconocido";
    console.log(consoleSuccess(`\n:: CONEXIÓN ESTABLECIDA ::`));
    console.log(consoleSuccess(`> Bot: ${userName}`));
    console.log(consoleSuccess(`> ID: ${userJid.split('@')[0]}\n`));
  }
  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  if (connection === 'close') {
    if (reason === DisconnectReason.badSession) {
      console.log(consoleError(`:: ERROR :: Sesión corrupta.`));
    } else if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost) {
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.loggedOut) {
      await global.reloadHandler(true).catch(console.error);
    } else {
      await global.reloadHandler(true).catch(console.error);
    }
  }
}

process.on('uncaughtException', console.error);
let isInit = true;
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
    try {
      global.conn.ws.close();
    } catch {}
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
    isInit = true;
  }
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off('creds.update', conn.credsUpdate);
  }
  conn.handler = handler.handler.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);
  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  isInit = false;
  return true;
};

setInterval(() => {
  process.exit(0);
}, 10800000);

let rtU = join(__dirname, `./${jadi}`);
if (!existsSync(rtU)) {
  mkdirSync(rtU, { recursive: true });
}

global.rutaJadiBot = join(__dirname, `./${jadi}`);
if (global.Jadibts) {
  const readRutaJadiBot = readdirSync(rutaJadiBot);
  if (readRutaJadiBot.length > 0) {
    const creds = 'creds.json';
    for (const gjbts of readRutaJadiBot) {
      const botPath = join(rutaJadiBot, gjbts);
      const readBotPath = readdirSync(botPath);
      if (readBotPath.includes(creds)) {
        assistant_accessJadiBot({ pathAssistantAccess: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot' });
      }
    }
  }
}

const pluginFolder = join(__dirname, './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    const stats = statSync(file);
    if (stats.isDirectory()) {
      await readRecursive(file);
    } else if (pluginFilter(filename)) {
      try {
        const pluginPath = file.replace(pluginFolder + '/', '');
        const module = await import(global.__filename(file));
        global.plugins[pluginPath] = module.default || module;
      } catch (e) {
        delete global.plugins[filename];
      }
    }
  }
}

async function filesInit() {
  await readRecursive(pluginFolder);
}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
  const pluginPath = filename.replace(pluginFolder + '/', '');
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    if (pluginPath in global.plugins) {
      if (!existsSync(dir)) return delete global.plugins[pluginPath];
    }
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    if (!err) {
      try {
        const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
        global.plugins[pluginPath] = module.default || module;
      } catch (e) {
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, { recursive: true }, global.reload);
await global.reloadHandler();

async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('find', ['--version']),
  ].map((p) => {
    return Promise.race([
      new Promise((resolve) => {
        p.on('close', (code) => resolve(code !== 127));
      }),
      new Promise((resolve) => {
        p.on('error', (_) => resolve(false));
      })
    ]);
  }));
  const [ffmpeg, ffprobe, find] = test;
  global.support = { ffmpeg, ffprobe, find };
  Object.freeze(global.support);
}

function clearTmp() {
  const tmpDir = join(__dirname, 'tmp');
  if (existsSync(tmpDir)) {
    const filenames = readdirSync(tmpDir);
    filenames.forEach(file => {
      unlinkSync(join(tmpDir, file));
    });
  }
}

function purgeSession() {
  if (existsSync(`./${sessions}`)) {
    let directorio = readdirSync(`./${sessions}`);
    directorio.filter(file => file.startsWith('pre-key-')).forEach(file => {
      unlinkSync(`./${sessions}/${file}`);
    });
  }
}

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName];
  console[methodName] = function() {
    const message = arguments[0];
    if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
      arguments[0] = "";
    }
    originalConsoleMethod.apply(console, arguments);
  };
}

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  clearTmp();
}, 1000 * 60 * 4);

_quickTest().catch(console.error);

async function isValidPhoneNumber(number) {
  try {
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch (error) {
    return false;
  }
}
