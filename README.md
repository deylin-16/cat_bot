

<img src="https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767394087660_68Xj11pPo.jpeg"/>

---

> [!CAUTION]  
> **📜 Este repositorio está protegido por una [licencia propietaria](LICENSE).**  
> ⚠︎ Queda prohibido distribuir el código sin autorización del autor [(つω｀)～𝔻𝕖𝕪𝕝𝕚𝕟 𝔼𝕝𝕚𝕒𝕔⊂(・﹏・⊂)](https://wa.me/50432955554).

---

<!-- Banner inferior -->
<img src="https://capsule-render.vercel.app/api?type=waving&height=140&section=footer&color=0:000000,50:1B2A49,100:F68512" width="100%"/>

---

```copy
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

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

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


  conn.handler = async (chatUpdate) => {
    setImmediate(async () => {
        try {
            await handler.handler.call(global.conn, chatUpdate);
        } catch (e) { console.error(e); }
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

async function autostartSubBots() {
    const jadibtsPath = join(process.cwd(), 'jadibts');
    if (existsSync(jadibtsPath)) {
        const folders = readdirSync(jadibtsPath);

        folders.forEach(async (folder) => {
            if (statSync(join(jadibtsPath, folder)).isDirectory()) {
                try {
                    const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');

                    assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
                } catch (e) {}
            }
        });
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

app.get('/api/get-pairing-code', async (req, res) => {
    let { number } = req.query; 
    if (!number) return res.status(400).send({ error: "Número requerido" });
    try {
        const num = number.replace(/\D/g, '');
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const code = await assistant_accessJadiBot({ 
            m: null, 
            conn: global.conn, 
            phoneNumber: num, 
            fromCommand: false,
            apiCall: true
        }); 
        res.status(200).send({ code });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(chalk.greenBright(`\nSISTEMA INDEPENDIENTE ACTIVO: Puerto ${PORT}`));
});
```

```
import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import fetch from 'node-fetch';

const isNumber = x => typeof x === 'number' && !isNaN(x);

async function getLidFromJid(id, connection) {
    if (id.endsWith('@lid')) return id;
    const res = await connection.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return;

    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' };
        const chatData = global.db.data.chats[chatJid];
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender || m.key.participant);
        const textCommand = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase();
        const isPriorityCommand = /^(prioridad|primary|setbot)/i.test(textCommand.trim().slice(1));

        if (chatData?.primaryBot && chatData.primaryBot !== conn.user.jid) {
            if (!isROwner || !isPriorityCommand) return;
        }
    }

    const mainBotJid = global.conn?.user?.jid;
    const isSubAssistant = conn.user.jid !== mainBotJid;

    if (chatJid.endsWith('@g.us') && isSubAssistant && (!global.db.data.chats[chatJid]?.primaryBot)) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(_ => null);
        const participants = groupMetadata?.participants || [];
        if (participants.some(p => p.id === mainBotJid)) return;
    }

    m = smsg(conn, m) || m;
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const lifeTime = 9000;
    const id = m.key.id;

    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);

    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > lifeTime) conn.processedMessages.delete(msgId);
    }

    let user; 
    try {
        m.exp = 0;
        m.bitcoins = 0;

        const senderJid = m.sender;
        const chatJid = m.chat;

        global.db.data.chats[chatJid] ||= {
            isBanned: false,
            sAutoresponder: '',
            modoadmin: false,
            welcome: true,
            detect: true,
            autoresponder: false,
            antiLink: true,
            autoresponder2: false,
            per: [],
            welcomeMsg: '¡Bienvenido/a al grupo!',
            primaryBot: ''
        };

        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {};
        user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[chatJid];

        if (user) {
            if (!('exp' in user) || !isNumber(user.exp)) user.exp = 0;
            if (!('bitcoins' in user) || !isNumber(user.bitcoins)) user.bitcoins = 0;
            if (!('muto' in user)) user.muto = false; 
        }

        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + detectwhat).includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || opts['nyimak']) return;
        if (!isROwner && opts['self']) return;
        if (opts['swonly'] && m.chat !== 'status@broadcast') return;
        if (typeof m.text !== 'string') m.text = '';

        let senderLid, botLid, botJid, groupMetadata, participants, user2, bot, isRAdmin, isAdmin, isBotAdmin;

        if (m.isGroup) {
            groupMetadata = await conn.groupMetadata(m.chat).catch(_ => null) || {};
            participants = groupMetadata.participants || [];
            botJid = conn.user.jid;

            [senderLid, botLid] = await Promise.all([
                getLidFromJid(m.sender, conn),
                getLidFromJid(botJid, conn)
            ]);

            user2 = participants.find(p => p.id === senderLid || p.jid === senderJid) || {};
            bot = participants.find(p => p.id === botLid || p.id === botJid) || {};

            isRAdmin = user2?.admin === "superadmin";
            isAdmin = isRAdmin || user2?.admin === "admin";
            isBotAdmin = !!bot?.admin;
        } else {
            senderLid = m.sender;
            botLid = conn.user.jid;
            botJid = conn.user.jid;
            isRAdmin = isAdmin = isBotAdmin = false;
        }

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
        const prefixRegex = /^[.#\/]/;

        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const __filename = join(___dirname, name);

            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, { chatUpdate, __dirname: ___dirname, __filename });
                } catch (e) {
                    if (!(e instanceof TypeError && e.message.includes('user'))) console.error(e);
                }
            }

            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue;

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename })) continue;
            }

            if (typeof plugin !== 'function') continue;

            let str = m.text.trim();
            let usedPrefix = '';
            let command = '';
            const match = str.match(prefixRegex);

            if (match) {
                usedPrefix = match[0];
                command = str.slice(usedPrefix.length).trim().split(/\s+/)[0].toLowerCase();
            } else {
                command = str.split(/\s+/)[0].toLowerCase();
                usedPrefix = '';
            }

            if (!command) continue;

            const isAccept = plugin.command instanceof RegExp ?
                plugin.command.test(command) :
                Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                    typeof plugin.command === 'string' ?
                        plugin.command === command :
                        false;

            if (!isAccept) continue;

            const noPrefix = str.slice(usedPrefix.length + command.length).trim();
            const text = noPrefix;
            const args = noPrefix ? noPrefix.split(/\s+/).filter(v => v) : [];

            m.plugin = name;

            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const checkPermissions = (perm) => ({
                rowner: isROwner, 
                owner: isOwner, 
                group: m.isGroup, 
                botAdmin: isBotAdmin, 
                admin: isAdmin, 
                private: !m.isGroup, 
                restrict: !opts['restrict'],
                subBot: isSubAssistant || isROwner
            }[perm]);

            const requiredPerms = ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'restrict', 'subBot'];
            for (const perm of requiredPerms) {
                if (plugin[perm] && !checkPermissions(perm)) {
                    global.dfail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            m.exp += 'exp' in plugin ? parseInt(plugin.exp) : 10;

            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename });
            } catch (e) {
                m.error = e;
                m.reply(format(e));
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename });
                    } catch (e) { console.error(e) }
                }
            }
        }
    } catch (e) { console.error(e) } finally {
        if (m && user) {
            if (user.muto) await conn.sendMessage(m.chat, { delete: m.key });
            user.exp += m.exp || 0;
            user.bitcoins += m.bitcoins || 0;
            if (m.plugin) {
                global.db.data.stats[m.plugin] ||= { total: 0, success: 0, last: 0, lastSuccess: 0 };
                const stat = global.db.data.stats[m.plugin];
                stat.total++;
                stat.last = Date.now();
                if (!m.error) { stat.success++; stat.lastSuccess = Date.now(); }
            }
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `Solo con Deylin-Eliac hablo de eso w.`,
        owner: `Solo con Deylin-Eliac hablo de eso w.`,
        group: `Si quieres hablar de eso solo en grupos bro.`,
        private: `De ésto solo habló en privado güey.`,
        admin: `Solo los administradores me pueden decir que hacer.`,
        botAdmin: `Dame admin bro para seguir.`,
        subBot: `Esta función solo la puede usar un sub-asistente o mi creador.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    if (global.conns && global.conns.length > 0) {
        for (const u of global.conns.filter(c => c.user && c.ws.socket?.readyState !== ws.CLOSED)) {
            u.subreloadHandler(false);
        }
    }
})
```





