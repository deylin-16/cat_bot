process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import chalk from 'chalk'
import pino from 'pino'
import readline from 'readline'
import yargs from 'yargs'
import { Low, JSONFile } from 'lowdb'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { handler } from './handler.js'

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys')

const args = process.argv.slice(2)
const subBotNumber = args.find(a => a.startsWith('--session='))?.split('=')[1]
const targetChat = args.find(a => a.startsWith('--chatId='))?.split('=')[1]
const targetMessageId = args.find(a => a.startsWith('--msgId='))?.split('=')[1]
const isSubBot = !!subBotNumber

const folder_session = isSubBot ? `./jadibts/${subBotNumber}` : (global.sessions || 'sessions')
if (!existsSync('./jadibts')) mkdirSync('./jadibts', { recursive: true })

protoType()
serialize()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.db = new Low(new JSONFile(isSubBot ? `./jadibts/db_${subBotNumber}.json` : 'database.json'))
global.loadDatabase = async function loadDatabase() {
  await global.db.read().catch(() => {})
  global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) }
}
await global.loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(folder_session)
const { version } = await fetchLatestBaileysVersion()

global.conn = makeWASocket({
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
  },
  version,
})

if (!state.creds.registered && isSubBot) {
    let codeSent = false
    global.conn.ev.on('connection.update', async (update) => {
        const { connection } = update
        if (connection === 'connecting' && !codeSent) {
            codeSent = true
            setTimeout(async () => {
                try {
                    let codeBot = await global.conn.requestPairingCode(subBotNumber)
                    codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
                    
                    if (targetChat) {
                        const fakeMsg = targetMessageId ? { key: { remoteJid: targetChat, fromMe: false, id: targetMessageId } } : null
                        await global.conn.sendMessage(targetChat, { 
                            text: `🔑 *CÓDIGO DE VINCULACIÓN*\n\nUsa este código en tu WhatsApp:\n\n*${codeBot}*` 
                        }, { quoted: fakeMsg })
                    }
                } catch (e) { console.error(e) }
            }, 8000)
        }
    })
}

global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        if (!chatUpdate.messages[0]) return
        await handler.call(global.conn, chatUpdate)
    } catch (e) { console.error(e) }
})

global.conn.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update
  if (connection === 'open') console.log(chalk.greenBright(`\n[ OK ] SUB ${subBotNumber} ONLINE`))
  if (connection === 'close') {
    if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) process.exit()
    else {
        if (existsSync(folder_session)) rmSync(folder_session, { recursive: true, force: true })
        process.exit()
    }
  }
})

global.conn.ev.on('creds.update', saveCreds)

const pluginFolder = join(__dirname, './plugins')
global.plugins = {}
async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename)
    if (statSync(file).isDirectory()) await readRecursive(file)
    else if (/\.js$/.test(filename)) {
      const module = await import(pathToFileURL(file).href)
      global.plugins[file.replace(pluginFolder + path.sep, '')] = module.default || module
    }
  }
}
await readRecursive(pluginFolder)
setInterval(async () => { if (global.db.data) await global.db.write() }, 30 * 1000)
