const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, generateWAMessageFromContent, proto } = (await import("@whiskeysockets/baileys"));
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
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
// Se elimina la definición de emojis/decoración

let botname = 'hjnkk'

// Se eliminan las definiciones de fkontak y fkontak1
/*
    const res = await fetch('https://i.postimg.cc/vHqc5x17/1756169140993.jpg');
    const thumb2 = Buffer.from(await res.arrayBuffer());

    const fkontak = {
        key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "assistantHalo"
        },
        message: {
            locationMessage: {
                name: `𝗦𝗨𝗕𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗠𝗢𝗗𝗘 𝗖𝗢𝗗𝗘 ✦ 8\n ${botname}`,
                jpegThumbnail: thumb2
            }
        },
        participant: "0@s.whatsapp.net"
    };

const res1 = await fetch('https://files.catbox.moe/dz34fo.jpg');
const thumb3 = Buffer.from(await res1.arrayBuffer());

    const fkontak1 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        orderMessage: {
          itemCount: 1,
          status: 1,
          surface: 1,
          message: `𝗖𝗢𝗡𝗘𝗖𝗧𝗔𝗗𝗢 𝗖𝗢𝗡 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣`,
          orderTitle: "Mejor assistant",
          jpegThumbnail: thumb3
        }
      }
    };
*/

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []
let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`Comando desactivado temporalmente.`)
let time = global.db.data.users[m.sender].Subs + 120000
//if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Assistant.*`, m)
const sub_assistant = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])]
const sub_assistantCount = sub_assistant.length
if (sub_assistantCount === 21) {
return conn.reply(m.chat, `No se han encontrado espacios para sub_assistant disponibles. Espera a que un sub_assistant se desconecte e intenta más tarde.`, m)
}
if (!args[0]) return m.reply(`Debes proporcionar el número de teléfono para conectar. Ejemplo: ${usedPrefix + command} 50576315903`)
let phoneNumber = args[0].replace(/[^0-9]/g, '')
if (!phoneNumber) return m.reply(`Número de teléfono no válido.`)
let id = phoneNumber
let pathJadiBot = path.join(`./access_assistant/`, id)
if (!fs.existsSync(pathJadiBot)){
fs.mkdirSync(pathJadiBot, { recursive: true })
}
JBOptions.pathJadiBot = pathJadiBot
JBOptions.m = m
JBOptions.conn = conn
JBOptions.args = args
JBOptions.usedPrefix = usedPrefix
JBOptions.command = command
JBOptions.fromCommand = true
JBOptions.phoneNumber = phoneNumber
JadiBot(JBOptions)
global.db.data.users[m.sender].Subs = new Date * 1
} 
handler.help = ['conectar']
handler.tags = ['serbot']
handler.command = ['conectar']
export default handler 

export async function JadiBot(options) {
let { pathJadiBot, m, conn, args, usedPrefix, command, phoneNumber } = options
const pathCreds = path.join(pathJadiBot, "creds.json")
if (!fs.existsSync(pathJadiBot)){
fs.mkdirSync(pathJadiBot, { recursive: true })}
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
const { state, saveState, saveCreds } = await useMultiFileAuthState(pathJadiBot)

const connectionOptions = {
logger: pino({ level: "silent" }),
printQRInTerminal: false,
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) },
msgRetry,
msgRetryCache,
browser: ['assistant', 'Chrome', '2.0.0'],
version: version,
generateHighQualityLinkPreview: false,
// Se elimina la función patchMessageBeforeSending para quitar la funcionalidad de botón/vista única.
/*
patchMessageBeforeSending: (message) => {
const requiresPatch = !!(
message.buttonsMessage ||
message.templateMessage ||
message.listMessage
);
if (requiresPatch) {
message = {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadataVersion: 2,
deviceListMetadata: {},
},
...message,
},
},
};
}
return message;
},
*/
};

let sock = makeWASocket(connectionOptions)
sock.isInit = false
let isInit = true

async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr } = update
if (isNewLogin) sock.isInit = false
if (qr) {
let secret = await sock.requestPairingCode(phoneNumber)
secret = secret.match(/.{1,4}/g)?.join("-")

console.log(secret)

const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (connection === 'close') {
if (reason === 428 || reason === 408 || reason === 515) {
console.log(`\nLa conexión (+${path.basename(pathJadiBot)}) fue cerrada, perdida o reinicio automático. Intentando reconectar...\n`) // Sin chalk
await creloadHandler(true).catch(console.error)
}
if (reason === 440) {
console.log(`\nLa conexión (+${path.basename(pathJadiBot)}) fue reemplazada por otra sesión activa.\n`) // Sin chalk
try {
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathJadiBot)}@s.whatsapp.net`, {text : '*HEMOS DETECTADO UNA NUEVA SESIÓN, BORRE LA NUEVA SESIÓN PARA CONTINUAR*\n\n> *SI HAY ALGÚN PROBLEMA VUELVA A CONECTARSE*' }, { quoted: m || null }) : ""
} catch (error) {
console.error(`Error 440 no se pudo enviar mensaje a: +${path.basename(pathJadiBot)}`) // Sin chalk
}}
if (reason == 405 || reason == 401 || reason == 403) {
console.log(`\nSesión cerrada, credenciales no válidas o cuenta en soporte (+${path.basename(pathJadiBot)}). Borrando sesión.\n`) // Sin chalk
try {
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathJadiBot)}@s.whatsapp.net`, {text : '*SESIÓN CERRADA/NO VÁLIDA*\n\n> *INTENTÉ NUEVAMENTE VOLVER A SER SUB-ASSISTANT*' }, { quoted: m || null }) : ""
} catch (error) {
console.error(`Error 405/401/403 no se pudo enviar mensaje a: +${path.basename(pathJadiBot)}`) // Sin chalk
}
fs.rmdirSync(pathJadiBot, { recursive: true })
}
if (reason === 500) {
console.log(`\nConexión perdida en la sesión (+${path.basename(pathJadiBot)}). Reiniciando...\n`) // Sin chalk
if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathJadiBot)}@s.whatsapp.net`, {text : '*CONEXIÓN PÉRDIDA*\n\n> *INTENTÉ MANUALMENTE VOLVER A SER SUB-ASSISTANT*' }, { quoted: m || null }) : ""
return creloadHandler(true).catch(console.error)
}
}}
if (global.db.data == null) loadDatabase()
if (connection == `open`) {
if (!global.db.data?.users) loadDatabase()
let userName, userJid 
userName = sock.authState.creds.me.name || 'assistantAnónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathJadiBot)}@s.whatsapp.net`
console.log(`\nSUB-ASSISTANT\n\n🟢 ${userName} (+${path.basename(pathJadiBot)}) conectado exitosamente.\n\nCONECTADO`) // Sin chalk y sin la decoración de caja
sock.isInit = true
global.conns.push(sock)
await joinChannels(sock)

m?.chat ? await conn.sendMessage(m.chat, {text: args[1] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : ` 
Bienvenido @${m.sender.split('@')[0]}, a la familia de 
 ${botname} disfruta del assistant.
 ${dev}`, mentions: [m.sender]}, { quoted: m || null }) : '' // Se envía como texto normal (quoted: m || null)

}}
setInterval(async () => {
if (!sock.user) {
try { sock.ws.close() } catch (e) {      
}
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
console.error('⚠️ Nuevo error: ', e)
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

async function joinChannels(conn) {
for (const channelId of Object.values(global.ch)) {
await conn.newsletterFollow(channelId).catch(() => {})
}}
