const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"))
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import util from 'util'
import * as ws from 'ws'
import { Boom } from '@hapi/boom'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assistant_accessJBOptions = {}

if (global.conns instanceof Array) console.log()
else global.conns = []

let m_code = (botJid) => {
    const config = global.getAssistantConfig(botJid) || { 
        assistantName: 'Sub-Bot', 
        assistantImage: 'https://www.deylin.xyz/logo.jpg' 
    };
    const isBuffer = Buffer.isBuffer(config.assistantImage);
    return {
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE EMPAREJAMIENTO`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: true,
                ...(isBuffer ? { thumbnail: config.assistantImage } : { thumbnailUrl: config.assistantImage }),
                sourceUrl: 'https://www.deyli.xyz/1' 
            }
        }
    };
};

function isSubBotConnected(jid) { 
    return global.conns.some(sock => sock?.user?.jid && sock.user.jid.split("@")[0] === jid.split("@")[0]) 
}

let handler = async (m, { conn, usedPrefix, command }) => {
    if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`El comando *${command}* está desactivado.`)
    let socklimit = global.conns.filter(sock => sock?.user).length
    if (socklimit >= 50) return m.reply(`No se han encontrado espacios para Sub-Bots disponibles.`)
    let phoneNumber = m.sender.split('@')[0]
    let pathAssistantAccess = path.join(`./${jadi}/`, phoneNumber)
    if (!fs.existsSync(pathAssistantAccess)) fs.mkdirSync(pathAssistantAccess, { recursive: true })
    assistant_accessJadiBot({ pathAssistantAccess, m, conn, usedPrefix, command, phoneNumber, fromCommand: true })
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.command = ['conectar_assistant', 'conectar']
export default handler 

export async function assistant_accessJadiBot(options) {
    let { pathAssistantAccess, m, conn, usedPrefix, command, phoneNumber, fromCommand } = options
    const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
    exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(pathAssistantAccess)
        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'})) 
            },
            browser: ['Windows', 'Firefox'],
            version: version,
            generateHighQualityLinkPreview: true
        }
        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        async function connectionUpdate(update) {
            const { connection, lastDisconnect, qr } = update
            if (qr && !sock.authState.creds.registered && fromCommand) {
                let secret = await sock.requestPairingCode(phoneNumber);
                secret = secret.match(/.{1,4}/g)?.join("-");
                await conn.sendMessage(m.chat, { text: secret, ...m_code(conn.user.jid) }, { quoted: m });
            }
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) {
                    await creloadHandler(true).catch(console.error)
                } else {
                    try { fs.rmSync(pathAssistantAccess, { recursive: true, force: true }) } catch {}
                    let i = global.conns.indexOf(sock)
                    if (i >= 0) global.conns.splice(i, 1)
                }
            }
            if (connection == `open`) {
                sock.isInit = true
                if (!global.conns.includes(sock)) global.conns.push(sock)
                if (fromCommand) await conn.sendMessage(m.chat, { text: `Sub-Bot conectado: @${phoneNumber}`, mentions: [`${phoneNumber}@s.whatsapp.net`] }, { quoted: m })
            }
        }
        let handler = await import('../handler.js')
        let creloadHandler = async function (restatConn) {
            if (restatConn) {
                try { sock.ws.close() } catch { }
                sock.ev.removeAllListeners()
                sock = makeWASocket(connectionOptions)
            }
            sock.handler = handler.handler.bind(sock)
            sock.connectionUpdate = connectionUpdate.bind(sock)
            sock.credsUpdate = saveCreds.bind(sock, true)
            sock.ev.on("messages.upsert", sock.handler)
            sock.ev.on("connection.update", sock.connectionUpdate)
            sock.ev.on("creds.update", sock.credsUpdate)
            return true
        }
        creloadHandler(false)
    })
}