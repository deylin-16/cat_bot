process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, createWriteStream, unlinkSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import store from './lib/store.js';
import NodeCache from 'node-cache';
import readline from 'readline';
import express from 'express';
import cors from 'cors';
import cfonts from 'cfonts';
import axios from 'axios'; 

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

if (!existsSync('./tmp')) mkdirSync('./tmp');
async function descargarLicencia() {
  if (!existsSync('.gen_license')) return;
  
  const url = 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770169108387_MVhCH9VHOe.jpeg';
  const localPath = path.join(process.cwd(), 'LICENCIA_AUTORIZADA.png');
  const galleryPath = '/sdcard/Download/LICENCIA_AUTORIZADA.png';

  try {
      console.log(chalk.cyanBright("📡 Accediendo a la Red Z para descargar certificado..."));
      
      const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream'
      });

      const writer = createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
          writer.on('finish', () => {
              console.log(chalk.greenBright(`✅ SISTEMA: Licencia verificada localmente.`));
              
              try {
                  if (existsSync('/sdcard')) {
                      fs.copyFileSync(localPath, galleryPath);
                      console.log(chalk.magentaBright(`📸 GALERÍA: Certificado guardado en Descargas.`));
                  }
              } catch (e) {
                  console.log(chalk.yellow("⚠️ Nota: No se pudo enviar a Galería. Ejecuta 'termux-setup-storage' para dar permisos."));
              }

              unlinkSync('.gen_license'); 
              resolve();
          });
          writer.on('error', reject);
      });
  } catch (err) {
      console.error(chalk.red("❌ Error crítico en el despliegue de licencia:"), err.message);
  }
}


let { say } = cfonts;
console.log(chalk.bold.hex('#7B68EE')('┌───────────────────────────┐'));
console.log(chalk.bold.hex('#7B68EE')('│      SYSTEM INITATING...      │'));
console.log(chalk.bold.hex('#7B68EE')('└───────────────────────────┘'));
say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

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

global.conns = [];

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
  }

  const setupInstance = (instance) => {
    instance.handler = async (chatUpdate) => {
      setImmediate(async () => {
          try {
              await handler.handler.call(instance, chatUpdate);
          } catch (e) { console.error(e); }
      });
    };
    instance.connectionUpdate = connectionUpdate.bind(instance);
    instance.credsUpdate = saveCreds.bind(instance, true);
    instance.ev.on('messages.upsert', instance.handler);
    instance.ev.on('connection.update', instance.connectionUpdate);
    instance.ev.on('creds.update', instance.credsUpdate);
  };

  setupInstance(global.conn);
  global.conns.forEach(c => setupInstance(c));
  return true;
};

const pluginFolder = join(__dirname, './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      const module = await import(global.__filename(file));
      const plugin = module.default || module;
      const pluginName = plugin.name || filename.replace('.js', '');
      global.plugins.set(pluginName, plugin);

      if (plugin.alias && Array.isArray(plugin.alias)) {
          plugin.alias.forEach(a => global.aliases.set(a, pluginName));
      }
    }
  }
}


await readRecursive(pluginFolder);
watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
    const plugin = module.default || module;
    const pluginName = plugin.name || filename.replace('.js', '');
    global.plugins.set(pluginName, plugin);

    if (plugin.alias && Array.isArray(plugin.alias)) {
        plugin.alias.forEach(a => global.aliases.set(a, pluginName));
    }
  }
});


await global.reloadHandler();

async function autostartSubBots() {
    const jadibtsPath = join(process.cwd(), 'jadibts');
    if (existsSync(jadibtsPath)) {
        const folders = readdirSync(jadibtsPath);
        for (const folder of folders) {
            if (statSync(join(jadibtsPath, folder)).isDirectory()) {
                try {
                    const { assistant_accessJadiBot } = await import('./plugins/main/serbot.js');
                    await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false });
                } catch (e) {}
            }
        }
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

app.listen(PORT, () => {
    console.log(chalk.greenBright(`\nSISTEMA INDEPENDIENTE ACTIVO: Puerto ${PORT}`));
});

await descargarLicencia();
