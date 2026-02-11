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
  if (msg.includes('Closing session') || msg.includes('SessionEntry') || msg.includes('Verifying identity') || msg.includes('registrationId') || msg.includes('currentRatchet')) return; 
  originalLog.apply(console, args);
};

EventEmitter.defaultMaxListeners = 0;

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();
cfonts.say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });

const adapter = new JSONFile('database.json');
global.db = new Low(adapter, { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} });
await global.db.read().catch(() => {});

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
  syncFullHistory: false, // CLAVE: No descarga chats viejos para no saturar
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 5000
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

global.reload = async function(restatConn) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos para que el hosting se calme
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') console.log(chalk.yellow(`[ ✿ ] Conectando...`));

    if (connection === 'open') {
        console.log(chalk.greenBright(`[ ✿ ] ¡CONECTADO!`));
        global.isBotReady = true; // Marcamos que ya entró
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
      
      // Si el bot se estaba conectando y se cerró, NO BORRAMOS NADA, solo esperamos
      if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.connectionLost) {
          console.log(chalk.blue("[ ! ] Estabilizando conexión..."));
          await global.reload(true);
      } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red("[ ! ] Sesión cerrada."));
          rmSync(sessionPath, { recursive: true, force: true });
          process.exit(1);
      } else {
          // Para cualquier otro error (como el 401 falso), esperamos más tiempo antes de reintentar
          console.log(chalk.red(`[ ! ] Reintentando en 10s... (Motivo: ${reason})`));
          await global.reload(true);
      }
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
  
  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
      try {
          const msg = chatUpdate.messages[0];
          if (!msg || !msg.message) return;
          const m = await smsg(conn, msg);
          const Path = path.join(process.cwd(), 'lib/message.js');
          const module = await import(`file://${Path}?update=${Date.now()}`);
          const Func = module.message || module.default?.message || module.default;
          if (typeof Func === 'function') await Func.call(conn, m, chatUpdate);
      } catch (e) {}
  });
};

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      const module = await import(`file://${file}`);
      const plugin = module.default || module;
      global.plugins.set(plugin.name || filename, plugin);
    }
  }
}
await readRecursive(pluginFolder);
