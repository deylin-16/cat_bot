const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"))
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import util from 'util'
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'
let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assistant_accessJBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []
function isSubBotConnected(jid) { return global.conns.some(sock => sock?.user?.jid && sock.user.jid.split("@")[0] === jid.split("@")[0]) }
let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`El comando *${command}* está desactivado.`)
let time = global.db.data.users[m.sender].Subs + 120000
let socklimit = global.conns.filter(sock => sock?.user).length
if (socklimit >= 50) {
return m.reply(`No se han encontrado espacios para Sub-Bots disponibles.`)
}
if (!args[0]) return m.reply(`Por favor, proporciona el número de teléfono. Ejemplo: ${usedPrefix + command} 50432955554`)

let phoneNumber = args[0].replace(/[^0-9]/g, '')
if (!phoneNumber) return m.reply(`Número de teléfono no válido.`)

let id = phoneNumber
let pathAssistantAccess = path.join(`./${jadi}/`, id)
if (!fs.existsSync(pathAssistantAccess)){
fs.mkdirSync(pathAssistantAccess, { recursive: true })
}
assistant_accessJBOptions.pathAssistantAccess = pathAssistantAccess
assistant_accessJBOptions.m = m
assistant_accessJBOptions.conn = conn
assistant_accessJBOptions.args = args
assistant_accessJBOptions.usedPrefix = usedPrefix
assistant_accessJBOptions.command = command
assistant_accessJBOptions.fromCommand = true
assistant_accessJBOptions.phoneNumber = phoneNumber // Pasar el número para la generación del código
assistant_accessJadiBot(assistant_accessJBOptions)
global.db.data.users[m.sender].Subs = new Date * 1
}
handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']
export default handler 

export async function assistant_accessJadiBot(options) {
let { pathAssistantAccess, m, conn, args, usedPrefix, command, phoneNumber } = options
const mcode = true 
let codeBot
const pathCreds = path.join(pathAssistantAccess, "creds.json")
if (!fs.existsSync(pathAssistantAccess)){
fs.mkdirSync(pathAssistantAccess, { recursive: true })}
try {
args[1] && args[1] != undefined ? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[1], "base64").toString("utf-8")), null, '\t')) : ""
} catch {
conn.reply(m.chat, `Use correctamente el comando » ${usedPrefix + command} [número] [sesión base64 opcional]`, m)
return
}
const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
const drmer = Buffer.from(drm1 + drm2, `base64`)
let { version, isLatest } = await fetchLatestBaileysVersion()
const msgRetry = (MessageRetryMap) => { }
const msgRetryCache = new NodeCache()
const { state, saveState, saveCreds } = await useMultiFileAuthState(pathAssistantAccess)
const connectionOptions = {
logger: pino({ level: "fatal" }),
printQRInTerminal: false,
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'})) },
msgRetry,
msgRetryCache, 
browser: ['Windows', 'Firefox'],
version: version,
generateHighQualityLinkPreview: true
}
let sock = makeWASocket(connectionOptions)
sock.isInit = false
let isInit = true
setTimeout(async () => {
if (!sock.user) {
try { fs.rmSync(pathAssistantAccess, { recursive: true, force: true }) } catch {}
try { sock.ws?.close() } catch {}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i >= 0) global.conns.splice(i, 1)
console.log(`[AUTO-LIMPIEZA] Sesión ${path.basename(pathAssistantAccess)} eliminada - credenciales invalidas.`)
}}, 60000)
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr } = update
if (isNewLogin) sock.isInit = false
if (qr && mcode) {
let secret = await sock.requestPairingCode(phoneNumber) // Genera el código para el phoneNumber pasado
secret = secret.match(/.{1,4}/g)?.join("-")
codeBot = await m.reply(`*CÓDIGO DE EMPAREJAMIENTO para +${phoneNumber}:*\n${secret}`)
console.log(`[CODE] Sesión ${path.basename(pathAssistantAccess)}: ${secret}`)
}
const endSesion = async (loaded) => {
if (!loaded) {
try {
sock.ws.close()
} catch {
}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)                
if (i < 0) return 
delete global.conns[i]
global.conns.splice(i, 1)
}}
const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (connection === 'close') {
if (reason === 428 || reason === 408 || reason === 515) {
console.log(`La conexión (+${path.basename(pathAssistantAccess)}) fue cerrada, perdida o reinicio. Intentando reconectar...`)
await creloadHandler(true).catch(console.error)
}
if (reason === 440) {
console.log(`La conexión (+${path.basename(pathAssistantAccess)}) fue reemplazada por otra sesión activa.`)
try {
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistantAccess)}@s.whatsapp.net`, {text : 'Advertencia: Nueva sesión detectada.' }, { quoted: m || null }) : ""
} catch (error) {
console.error(`Error 440: No se pudo enviar mensaje a: +${path.basename(pathAssistantAccess)}`)
}}
if (reason == 405 || reason == 401) {
console.log(`Sesión (+${path.basename(pathAssistantAccess)}) fue cerrada. Credenciales no válidas.`)
try {
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistantAccess)}@s.whatsapp.net`, {text : 'Advertencia: Sesión cerrada/no válida. Intente conectarse de nuevo.' }, { quoted: m || null }) : ""
} catch (error) {
console.error(`Error 405: No se pudo enviar mensaje a: +${path.basename(pathAssistantAccess)}`)
}
fs.rmdirSync(pathAssistantAccess, { recursive: true })
}
if (reason === 500) {
console.log(`Conexión perdida en la sesión (+${path.basename(pathAssistantAccess)}). Reiniciando...`)
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistantAccess)}@s.whatsapp.net`, {text : 'Advertencia: Conexión perdida. Intentar conectarse manualmente.' }, { quoted: m || null }) : ""
return creloadHandler(true).catch(console.error)
}
if (reason === 403) {
console.log(`Sesión (+${path.basename(pathAssistantAccess)}) cerrada o cuenta en soporte. Borrando.`)
fs.rmdirSync(pathAssistantAccess, { recursive: true })
}}
if (global.db.data == null) loadDatabase()
if (connection == `open`) {
if (!global.db.data?.users) loadDatabase()
await joinChannels(conn)
let userName, userJid 
userName = sock.authState.creds.me.name || 'Anónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathAssistantAccess)}@s.whatsapp.net`
console.log(`[CONECTADO] ${userName} (+${path.basename(pathAssistantAccess)}) conectado exitosamente.`)
sock.isInit = true
global.conns.push(sock)
m?.chat ? await conn.sendMessage(m.chat, { text: isSubBotConnected(m.sender) ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `Has registrado un nuevo Sub-Bot: @${m.sender.split('@')[0]}`, mentions: [m.sender] }, { quoted: m }) : ''
}}
setInterval(async () => {
if (!sock.user) {
try { sock.ws.close() } catch (e) {}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i < 0) return
delete global.conns[i]
global.conns.splice(i, 1)
}}, 60000)
let handler = await import('../handler.js')
let creloadHandler = async function (restatConn) {
try {
const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error('Error: ', e)
}
if (restatConn) {
const oldChats = sock.chats
try { sock.ws.close() } catch { }
sock.ev.removeAllListeners()
sock = makeWASocket(connectionOptions, { chats: oldChats })
isInit = true
}
if (!isInit) {
sock.ev.off("messages.upsert", sock.handler)
sock.ev.off("connection.update", sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}
sock.handler = handler.handler.bind(sock)
sock.connectionUpdate = connectionUpdate.bind(sock)
sock.credsUpdate = saveCreds.bind(sock, true)
sock.ev.on("messages.upsert", sock.handler)
sock.ev.on("connection.update", sock.connectionUpdate)
sock.ev.on("creds.update", sock.credsUpdate)
isInit = false
return true
}
creloadHandler(false)
})
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));}
function msToTime(duration) {
var milliseconds = parseInt((duration % 1000) / 100),
seconds = Math.floor((duration / 1000) % 60),
minutes = Math.floor((duration / (1000 * 60)) % 60),
hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
hours = (hours < 10) ? '0' + hours : hours
minutes = (minutes < 10) ? '0' + minutes : minutes
seconds = (seconds < 10) ? '0' + seconds : seconds
return minutes + ' m y ' + seconds + ' s '
}

