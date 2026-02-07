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
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import axios from 'axios'; 
import { smsg } from './lib/serializer.js';

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

let { say } = cfonts;
console.clear();
console.log(chalk.bold.cyan('┌────────────────────────────────────────────────────────┐'));
console.log(chalk.bold.cyan('│') + chalk.bold.yellow('            SISTEMA DE AUTOMATIZACIÓN ACTIVO            ') + chalk.bold.cyan('│'));
console.log(chalk.bold.cyan('└────────────────────────────────────────────────────────┘'));
say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

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

const { state, saveCreds } = await useMultiFileAuthState('sessions');
const { version } = await fetchLatestBaileysVersion();

const connectionOptions = {
  version,
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
  getMessage: async (key) => { return ""; } 
};

global.conn = makeWASocket(connectionOptions);

if (!existsSync(`./sessions/creds.json`)) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

    console.log(chalk.bold.magenta('\n┌──────────────────────────────────────────────────┐'));
    console.log(chalk.bold.magenta('│') + chalk.bold.white('         CONFIGURACIÓN DE EMPAREJAMIENTO          ') + chalk.bold.magenta('│'));
    console.log(chalk.bold.magenta('└──────────────────────────────────────────────────┘'));

    let phoneNumber = await question(chalk.cyanBright(`\n➤ Ingrese el número del Bot (Ej: +504 5178-2571):\n> `));
    let addNumber = phoneNumber.replace(/\D/g, '');

    setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(addNumber);
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
        console.log(chalk.bold.white('\n  CÓDIGO DE VINCULACIÓN: ') + chalk.bold.greenBright(codeBot) + '\n');
    }, 3000);
}

if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30 * 1000);

global.reloadHandler = async function(restatConn) {
  let handler = await import(`./handler.js?update=${Date.now()}`);
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    global.conn = makeWASocket(connectionOptions);
  }

  
conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg) return;
        if (!msg.message && !msg.messageStubType) return;  
        const m = await smsg(conn, msg);     
        const handlerPath = `./handler.js?update=${Date.now()}`;
        const { handler } = await import(handlerPath);      
        if (typeof handler === 'function') {
            await handler.call(conn, m, chatUpdate);
        } else {
            console.error('El archivo handler.js no exporta una función llamada handler');
        }

    } catch (e) {
        console.error('Error en el sistema de mensajes:', e);
    }
});



  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
        console.log(chalk.bold.greenBright(`\n[ OK ] Conectado a: ${conn.user.name || 'WhatsApp Bot'}`));
        console.log(chalk.bold.blue(`[ INFO ] ID: ${jidNormalizedUser(conn.user.id)}\n`));
    }
    if (connection === 'close') {
      if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) await global.reloadHandler(true);
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reloadHandler();

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
  }
});

async function descargarLicencia() {
  if (!existsSync('.gen_license')) return;
  const url = 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770169108387_MVhCH9VHOe.jpeg';
  const localPath = path.join(process.cwd(), 'LICENCIA_AUTORIZADA.png');
  try {
      const response = await axios({ url, method: 'GET', responseType: 'stream' });
      const writer = createWriteStream(localPath);
      response.data.pipe(writer);
      return new Promise((resolve) => {
          writer.on('finish', () => {
              console.log(chalk.greenBright(`✅ SISTEMA: Licencia verificada.`));
              unlinkSync('.gen_license'); 
              resolve();
          });
      });
  } catch (err) {}
}

await descargarLicencia();
