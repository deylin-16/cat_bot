import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    useMultiFileAuthState 
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

let handler = async (m, { conn }) => {
    const url = 'https://deylin.xyz/pairing_code?v=5'
    await conn.sendMessage(m.chat, { 
        text: `Sólo te puedes hacer subbot desde la web:\n${url}`,
        contextInfo: {
            externalAdReply: {
                title: 'VINCULAR SUB-BOT',
                body: 'dynamic bot pairing code',
                thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                mediaType: 1,
                sourceUrl: url,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(qr|code|subbot)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand, apiCall } = options
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)

    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

        let sock = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.macOS("Chrome"),
            version,
            msgRetryCache,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            keepAliveIntervalMs: 30000,
            getMessage: async (key) => { return { conversation: 'Bot' } }
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            if (!fromCommand && !apiCall) return
            return new Promise((resolve) => {
                setTimeout(async () => {
                    let code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''))
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    if (fromCommand && m && conn) await conn.sendMessage(m.chat, { text: code }, { quoted: m })
                    setupSubBotEvents(sock, authFolder, m, conn)
                    resolve(code)
                }, 3000)
            })
        } else {
            setupSubBotEvents(sock, authFolder, m, conn)
            return "Conectado"
        }
    } catch (e) { throw e }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u
        const botNumber = path.basename(authFolder)
        if (connection === 'open') {
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) global.conns.push(sock)
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if ([401, 403, 405].includes(reason)) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
            } else assistant_accessJadiBot({ m, conn, phoneNumber: botNumber, fromCommand: false, apiCall: false })
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!global.db?.data?.settings || !chatUpdate.messages[0]?.message) return 
        setImmediate(async () => {
            try {
                const { handler } = await import('../handler.js?update=' + Date.now())
                await handler.call(sock, chatUpdate)
            } catch (e) { }
        })
    })
}
