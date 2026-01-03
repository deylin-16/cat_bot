process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import chalk from 'chalk'
import pino from 'pino'
import express from 'express'
import cors from 'cors'
import readline from 'readline'
import { Low, JSONFile } from 'lowdb'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { handler } from './handler.js'

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys')

const args_terminal = process.argv.slice(2)
const session_arg = args_terminal.find(a => a.startsWith('--session='))
const chat_arg = args_terminal.find(a => a.startsWith('--chatId='))
const isSubBot = !!session_arg
const subBotNumber = isSubBot ? session_arg.split('=')[1] : null
const targetChat = chat_arg ? chat_arg.split('=')[1] : null

const folder_session = isSubBot ? `./jadibts/${subBotNumber}` : (global.sessions || 'sessions')
if (!existsSync('./jadibts')) mkdirSync('./jadibts', { recursive: true })

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}

const __dirname = global.__dirname(import.meta.url)
global.db = new Low(new JSONFile(isSubBot ? `./jadibts/db_${subBotNumber}.json` : 'database.json'))

global.loadDatabase = async function loadDatabase() {
  await global.db.read().catch(() => {})
  global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) }
}
await global.loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(folder_session)
const { version } = await fetchLatestBaileysVersion()

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  browser: Browsers.macOS("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
  },
  markOnlineOnConnect: false,
  syncFullHistory: false,
  version,
}

global.conn = makeWASocket(connectionOptions)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

if (!state.creds.registered) {
    if (isSubBot) {
        setTimeout(async () => {
            try {
                let codeBot = await global.conn.requestPairingCode(subBotNumber)
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
                if (targetChat) {
                    await global.conn.sendMessage(targetChat, { text: codeBot })
                }
            } catch (e) { console.error(e) }
        }, 5000)
    } else {
        rl.question(chalk.cyan.bold('\n\nNúmero del Bot Principal:\n> '), async (phoneNumber) => {
            phoneNumber = phoneNumber.replace(/\D/g, '')
            let code = await global.conn.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join("-") || code
            console.log(chalk.black.bgGreen('\n CÓDIGO: '), chalk.bold.white(code), '\n')
            rl.close()
        })
    }
}

global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const m = chatUpdate.messages[0]
        if (!m || (m.key.fromMe && isSubBot)) return
        await handler.call(global.conn, chatUpdate)
    } catch (e) { console.error(e) }
})

global.conn.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update
  if (connection === 'open') {
      console.log(chalk.greenBright(`\n[ OK ] ${isSubBot ? 'SUB ' + subBotNumber : 'PRINCIPAL'} ONLINE`))
  }
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (reason !== DisconnectReason.loggedOut) {
        process.exit()
    } else {
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
      const module = await import(global.__filename(file))
      global.plugins[file.replace(pluginFolder + '/', '')] = module.default || module
    }
  }
}
await readRecursive(pluginFolder)

if (!isSubBot) {
    const app = express()
    app.use(cors())
    app.listen(process.env.PORT || 3000)
}

setInterval(async () => { if (global.db.data) await global.db.write() }, 30 * 1000)
