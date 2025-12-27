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
    if (command === 'hd2') {
        try {
            const q = m.quoted ? m.quoted : m
            const mime = (q.msg || q).mimetype || q.mediaType || ''
            if (!mime || !mime.startsWith('image/')) {
                return conn.reply(m.chat, `Envía o responde a una imagen con el comando:\n\n${usedPrefix + command} [method] [quality]\n\n*Methods:* 1, 2, 3, 4\n*Quality:* low, medium, high`, m)
            }
            const method = parseInt(args[0]) || 1
            const quality = args[1]?.toLowerCase() || 'medium'
            await conn.sendMessage(m.chat, { text: `⌛ Procesando imagen...` }, { quoted: m })
            const buffer = await q.download()
            const enhancedBuffer = await ihancer(buffer, { method, size: quality })
            await conn.sendMessage(m.chat, { 
                image: enhancedBuffer,
                caption: `✅ Imagen mejorada\n- Método: ${method}\n- Calidad: ${quality}`,
                fileName: 'enhanced.jpg'
            }, { quoted: m })        
        } catch (error) {
            conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
        }
    }

    if (command === 'toimg') {
        try {
            const q = m.quoted ? m.quoted : m
            if (!/stickerMessage/i.test(q.mtype)) return m.reply(`⚠️ Responde a un sticker`)
            let stickerBuffer = await q.download()
            let outPath = path.join(process.cwd(), `temp_${Date.now()}.jpg`)
            await sharp(stickerBuffer).jpeg().toFile(outPath)
            await conn.sendFile(m.chat, outPath, "sticker.jpg", "✅ Sticker convertido", m)
            if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
        } catch (e) {
            m.reply("❌ Error al convertir.")
        }
    }

    if (command === 'conectar' || command === 'conectar_assistant') {
        if (!globalThis.db.data.settings[conn.user.jid]?.jadibotmd) return m.reply(`Comando desactivado.`)
        let socklimit = global.conns.filter(sock => sock?.user).length
        if (socklimit >= 50) return m.reply(`No hay espacios disponibles.`)
        let phoneNumber = m.sender.split('@')[0]
        let pathAssistantAccess = path.join(process.cwd(), 'sessions', phoneNumber)
        if (!fs.existsSync(pathAssistantAccess)) fs.mkdirSync(pathAssistantAccess, { recursive: true })
        assistant_accessJadiBot({ pathAssistantAccess, m, conn, phoneNumber, fromCommand: true })
    }
}

handler.help = ['hd2', 'toimg', 'conectar']
handler.tags = ['ia', 'tools', 'jadibot']
handler.command = /^(hd2|toimg|conectar|conectar_assistant)$/i 

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
        version: version
    }

    let sock = makeWASocket(connectionOptions)

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        const chatID = m?.chat || phoneNumber + '@s.whatsapp.net'

        if (qr && !sock.authState.creds.registered && fromCommand && !isPairingSent) {
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
            await conn.sendMessage(chatID, { text: `✅ Sub-Bot conectado: @${phoneNumber}`, mentions: [`${phoneNumber}@s.whatsapp.net`] })
        }
    }

    sock.ev.on("connection.update", connectionUpdate)
    sock.ev.on("creds.update", saveCreds)
    let handlerImport = await import('../handler.js')
    sock.ev.on("messages.upsert", handlerImport.handler.bind(sock))
}

async function ihancer(buffer, { method = 1, size = 'low' } = {}) {
    const _size = ['low', 'medium', 'high']
    const form = new FormData()
    form.append('method', method.toString())
    form.append('is_pro_version', 'false')
    form.append('is_enhancing_more', 'false')
    form.append('max_image_size', size)
    form.append('file', buffer, `image_${Date.now()}.jpg`)
    const { data } = await axios.post('https://ihancer.com/api/enhance', form, {
        headers: { ...form.getHeaders(), 'user-agent': 'Dart/3.5 (dart:io)' },
        responseType: 'arraybuffer'
    })
    return Buffer.from(data)
}
