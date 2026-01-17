process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, rmSync } from 'fs';
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
import { createClient } from '@supabase/supabase-js';

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { chain } = lodash;
const PORT = process.env.PORT || 3000;
const supabase = createClient("https://kzuvndqicwcclhayyttc.supabase.co", "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M");

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

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.db = new Low(new JSONFile('database.json'));

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  global.db.READ = true;
  try {
    const { data } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').maybeSingle();
    global.db.data = data?.content || (await global.db.read(), global.db.data) || { users: {}, chats: {}, settings: {} };
  } catch {
    global.db.data = { users: {}, chats: {}, settings: {} };
  }
  global.db.READ = null;
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS("Chrome"),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    version,
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    msgRetryCounterCache: new NodeCache(),
    keepAliveIntervalMs: 30000,
  };

  global.conn = makeWASocket(connectionOptions);

  if (!existsSync('./sessions/creds.json')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const num = global.botNumber || await new Promise(r => rl.question(chalk.blueBright('Número:\n> '), r));
    const code = await global.conn.requestPairingCode(num.replace(/\D/g, ''));
    console.log(chalk.magentaBright(`\nCÓDIGO PRINCIPAL: ${code}\n`));
    rl.close();
  }

  global.conn.ev.on('creds.update', saveCreds);
  global.conn.ev.on('connection.update', async (u) => {
    if (u.connection === 'open') {
        console.log(chalk.greenBright('>>> BOT PRINCIPAL ONLINE'));
        await autostartSubBots();
    }
    if (u.connection === 'close') startBot();
  });

  global.conn.ev.on('messages.upsert', async (m) => {
    if (!global.db?.data?.settings || !m.messages[0]) return;
    const handler = await import(`./handler.js?update=${Date.now()}`);
    setImmediate(() => handler.handler.call(global.conn, m));
  });

  setInterval(async () => {
    if (global.db.data) {
        supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() }).then();
    }
  }, 60 * 1000);
}

async function autostartSubBots() {
  const path = join(process.cwd(), 'jadibts');
  if (!existsSync(path)) return;
  const folders = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
  const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
  folders.forEach(folder => {
    assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: folder, fromCommand: false }).catch(() => {});
  });
}

const app = express().use(cors()).use(express.json());
app.get('/api/get-pairing-code', async (req, res) => {
  let { number } = req.query;
  if (!number) return res.status(400).send({ error: "Número requerido" });
  const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
  const code = await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: number.replace(/\D/g, ''), fromCommand: false, apiCall: true });
  res.status(200).send({ code });
});

app.listen(PORT, () => {
  console.log(chalk.greenBright(`SISTEMA DEYLIN-16 ACTIVO EN PUERTO ${PORT}`));
  startBot();
});
