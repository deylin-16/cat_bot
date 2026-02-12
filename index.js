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
import { uploadCriticalError } from './lib/db_logs.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = function () {
  const args = Array.from(arguments);
  const msg = args.join(' ');
  if (msg.includes('Closing session') || msg.includes('SessionEntry') || msg.includes('Verifying identity') || msg.includes('registrationId') || msg.includes('currentRatchet') || msg.includes('rate-overlimit') || msg.includes('429')) {
    return; 
  }
  originalLog.apply(console, args);
};

const originalDir = console.dir;
console.dir = function () {
  const args = Array.from(arguments);
  if (!args[0]) return originalDir.apply(console, args);
  const isSessionData = args[0].constructor?.name === 'SessionEntry' || args[0].sessionConfig || args[0].registrationId || args[0].currentRatchet || args[0]._chains;
  if (isSessionData) {
    return;
  }
  originalDir.apply(console, args);
};

const originalError = console.error;
console.error = function () {
  const args = Array.from(arguments);
  const msg = args.join(' ');
  if (msg.includes('rate-overlimit') || msg.includes('429')) {
    return;
  }
  originalError.apply(console, args);
};

EventEmitter.defaultMaxListeners = 0;

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

console.clear();
cfonts.say('WhatsApp_bot', { font: 'chrome', align: 'center', gradient: ['#00BFFF', '#FF4500'] });
cfonts.say('by Deylin', { font: 'console', align: 'center', colors: ['#DAA520', '#FF69B4', '#ADFF2F'] });

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
  await global.db.read().catch(() => {});
  global.db.READ = null;
  global.db.data = global.db.data || {
    users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}
  };
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

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
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 5000,
  getMessage: async (key) => { return ""; } 
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

if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30 * 1000);

global.reload = async function(restatConn) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 10000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg) return;
        if (!msg.message && !msg.messageStubType) return;
        const m = await smsg(conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default?.message || module.default;

        if (typeof Func === 'function') {
            await Func.call(conn, m, chatUpdate);
        }
    } catch (e) {
        await uploadCriticalError(e, 'Message Upsert Handler');
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.yellow(`➠ Conectando...`));

    if (connection === 'open') {
        console.log(chalk.greenBright(`➠ ¡CONECTADO! a: ➜ ${conn.user.name || 'WhatsApp Bot'}`));
        global.isBotReady = true;
        await monitorBot(conn, 'online');

        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }

    if (connection === 'close') {
      await monitorBot(conn, 'offline');
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

      if (reason !== DisconnectReason.loggedOut) {
          await uploadCriticalError(lastDisconnect?.error || `Reason: ${reason}`, 'Connection Update');
      }

      if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.connectionLost) {
          console.log(chalk.blue("[ ! ] Estabilizando conexión..."));
          await global.reload(true);
      } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red("[ ! ] Sesión cerrada."));
          rmSync(sessionPath, { recursive: true, force: true });
          process.exit(1);
      } else {
          console.log(chalk.red(`[ ! ] Reintentando en 10s... (Motivo: ${reason})`));
          await global.reload(true);
      }
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

global.lastRestartTime = Date.now();
const botID = "unidad_" + Math.random().toString(36).substring(7); // ID único por sesión

const monitorRemoteOrders = async () => {
    try {
        
        await axios.post('https://script.google.com/macros/s/AKfycbxnJ_BRuW2DdNDCtnspyL1qHvedn4Ue5k3OFfzZK4aFH50aVz1hgO094d02DEqKFB8gCg/exec', {
            action: 'REPORT_STATUS',
            botId: botID,
            name: conn.user.name || 'Bot_Unidad',
            platform: process.platform
        });

        
        const response = await axios.get('https://script.google.com/macros/s/AKfycbxnJ_BRuW2DdNDCtnspyL1qHvedn4Ue5k3OFfzZK4aFH50aVz1hgO094d02DEqKFB8gCg/exec');
        const { config } = response.data;
        
        if (config.restart && config.timestamp > global.lastRestartTime) {
            console.log(chalk.bgRed.white(' [!] REINICIO REMOTO RECIBIDO '));
            global.lastRestartTime = config.timestamp;
            setTimeout(() => { process.exit(0); }, 1000);
        }
    } catch (e) {}
};

setInterval(monitorRemoteOrders, 30000); 

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      const module = await import(`file://${file}`);
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
    const dir = join(pluginFolder, filename);
    if (existsSync(dir) && statSync(dir).isFile()) {
        const module = await import(`file://${dir}?update=${Date.now()}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || filename.replace('.js', '');
        global.plugins.set(pluginName, plugin);
    }
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

async function initSubBots() {
    const jadibtsDir = path.join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsDir)) return;

    const folders = readdirSync(jadibtsDir).filter(f => 
        statSync(join(jadibtsDir, f)).isDirectory() && existsSync(join(jadibtsDir, f, 'creds.json'))
    );

    if (folders.length > 0) {
        console.log(chalk.bold.blue(`[ SISTEMA ] Re-conectando ${folders.length} sub-bots activos...`));
    }

    for (const folder of folders) {
        try {
            const { assistant_accessJadiBot } = await import(`./plugins/main/serbot.js?update=${Date.now()}`);
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false });
            await new Promise(r => setTimeout(r, 2000)); 
        } catch (e) {
            console.log(chalk.red(`[ ERROR ] No se pudo iniciar el sub-bot ${folder}. Posible sesión corrupta.`));
        }
    }
}
