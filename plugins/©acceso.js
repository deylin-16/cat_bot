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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assistant_accessJBOptions = {}

if (global.conns instanceof Array) console.log()
else global.conns = []


let m_code = (botJid) => {
    const config = global.getAssistantConfig(botJid) || { assistantName: 'Sub-Bot', assistantImage: 'https://www.deylin.xyz/logo.jpg' };
    return {
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE EMPAREJAMIENTO`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: true, 
                thumbnailUrl: config.assistantImage,
                sourceUrl: 'https://www.deylin.xyz' 
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

    global.getAssistantConfig(conn.user.jid)

    let phoneNumber = m.sender.split('@')[0]
    let id = phoneNumber
    let pathAssistantAccess = path.join(`./${jadi}/`, id)

    if (!fs.existsSync(pathAssistantAccess)){
        fs.mkdirSync(pathAssistantAccess, { recursive: true })
    }

    assistant_accessJBOptions.pathAssistantAccess = pathAssistantAccess
    assistant_accessJBOptions.m = m
    assistant_accessJBOptions.conn = conn
    assistant_accessJBOptions.usedPrefix = usedPrefix
    assistant_accessJBOptions.command = command
    assistant_accessJBOptions.fromCommand = true
    assistant_accessJBOptions.phoneNumber = phoneNumber 
    
    assistant_accessJadiBot(assistant_accessJBOptions)
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.command = ['conectar_assistant', 'conectar']
export default handler 

export async function assistant_accessJadiBot(options) {
    let { pathAssistantAccess, m, conn, usedPrefix, command, phoneNumber } = options
    const mcode = true 
    const pathCreds = path.join(pathAssistantAccess, "creds.json")

    if (!fs.existsSync(pathAssistantAccess)){
        fs.mkdirSync(pathAssistantAccess, { recursive: true })
    }

    const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
    exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const msgRetry = (MessageRetryMap) => { }
        const msgRetryCache = new NodeCache()
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathAssistantAccess)
        
        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'})) 
            },
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
            }
        }, 60000)

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update
            if (isNewLogin) sock.isInit = false
            
            
            if (qr && mcode && !sock.authState.creds.registered) {
                let secret = await sock.requestPairingCode(phoneNumber);
                secret = secret.match(/.{1,4}/g)?.join("-");
                
                
                const extraConfig = m_code(conn.user.jid);
                await conn.sendMessage(m.chat, { text: secret, ...extraConfig }, { quoted: m });
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
                if ([428, 408, 515, 500].includes(reason)) {
                    await creloadHandler(true).catch(console.error)
                }
                if (reason === 440) {
                    if (options.fromCommand) await conn.sendMessage(`${phoneNumber}@s.whatsapp.net`, { text: 'Advertencia: Nueva sesión detectada.' })
                }
                if (reason == 405 || reason == 401 || reason === 403) {
                    fs.rmSync(pathAssistantAccess, { recursive: true, force: true })
                }
            }

            if (connection == `open`) {
                sock.isInit = true
                global.conns.push(sock)
                await conn.sendMessage(m.chat, { 
                    text: `Has registrado un nuevo Sub-Bot: @${m.sender.split('@')[0]}`, 
                    mentions: [m.sender] 
                }, { quoted: m })
            }
        }

        let handler = await import('../handler.js')
        let creloadHandler = async function (restatConn) {
            try {
                const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
                if (Object.keys(Handler || {}).length) handler = Handler
            } catch (e) {}
            
            if (restatConn) {
                try { sock.ws.close() } catch { }
                sock.ev.removeAllListeners()
                sock = makeWASocket(connectionOptions)
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
