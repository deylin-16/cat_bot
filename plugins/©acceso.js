import axios from 'axios'
import FormData from 'form-data'
import { Buffer } from 'node:buffer'
import fs from "fs"
import path from "path"
import sharp from "sharp"
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { fileURLToPath } from 'url'

const { 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion 
} = (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!(global.conns instanceof Array)) global.conns = []

let m_code = (botJid) => {
    const config = global.getAssistantConfig?.(botJid) || { 
        assistantName: 'Sub-Bot', 
        assistantImage: 'https://www.deylin.xyz/logo.jpg' 
    }
    const isBuffer = Buffer.isBuffer(config.assistantImage)
    return {
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE EMPAREJAMIENTO`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: true,
                ...(isBuffer ? { thumbnail: config.assistantImage } : { thumbnailUrl: config.assistantImage }),
                sourceUrl: 'https://www.deylin.xyz/1' 
            }
        }
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
       // if (!globalThis.db.data.settings[conn.user.jid]?.jadibotmd) return m.reply(`Comando desactivado.`)
        let socklimit = global.conns.filter(sock => sock?.user).length
        if (socklimit >= 50) return m.reply(`No hay espacios disponibles.`)
        let phoneNumber = m.sender.split('@')[0]
        let pathAssistantAccess = path.join(process.cwd(), global.jadi, phoneNumber)
        if (!fs.existsSync(pathAssistantAccess)) fs.mkdirSync(pathAssistantAccess, { recursive: true })
        assistant_accessJadiBot({ pathAssistantAccess, m, conn, phoneNumber, fromCommand: true })
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { pathAssistantAccess, m, conn, phoneNumber, fromCommand } = options
    let isPairingSent = false 
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(pathAssistantAccess)

    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'})) 
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        version: version,
        markOnlineOnConnect: false
    }

    let sock = makeWASocket(connectionOptions)

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        const chatID = m?.chat || (phoneNumber ? phoneNumber + '@s.whatsapp.net' : null)

        if (qr && !sock.authState.creds.registered && fromCommand && !isPairingSent) {
            if (!chatID) return
            isPairingSent = true 
            setTimeout(async () => {
                try {
                    let secret = await sock.requestPairingCode(phoneNumber)
                    secret = secret.match(/.{1,4}/g)?.join("-")
                    await conn.sendMessage(chatID, { text: secret, ...m_code(conn.user.jid) }, { quoted: m })
                } catch (e) {
                    isPairingSent = false 
                }
            }, 3000)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                assistant_accessJadiBot(options) 
            } else {
                try { fs.rmSync(pathAssistantAccess, { recursive: true, force: true }) } catch {}
                global.conns = global.conns.filter(s => s.user?.jid !== sock.user?.jid)
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            if (!global.conns.some(s => s.user?.jid === sock.user.jid)) global.conns.push(sock)
        }
    }

    sock.ev.on("connection.update", connectionUpdate)
    sock.ev.on("creds.update", saveCreds)
    let handlerImport = await import('../handler.js')
    sock.ev.on("messages.upsert", handlerImport.handler.bind(sock))
}
