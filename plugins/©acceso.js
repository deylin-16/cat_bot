import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import * as ws from 'ws'
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

let handler = async (m, { conn, command }) => {
    if (command === 'code') {
        let userNumber = m.sender.split('@')[0]
        try {
            let code = await assistant_accessJadiBot({ 
                m, 
                conn, 
                phoneNumber: userNumber, 
                fromCommand: true 
            })

            await conn.sendMessage(m.chat, { 
                text: `${code}`,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406846602793@newsletter',
                        newsletterName: `SIGUE EL CANAL DE: ${conn.getName(conn.user.jid)}`,
                        serverMessageId: 1
                    },
                    externalAdReply: {
                        title: 'VINCULAR SUB-BOT',
                        body: `Pairing code generado directamente`,
                        thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                        mediaType: 1,
                        sourceUrl: 'https://deylin.xyz',
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
        } catch (e) {
            console.error(e)
        }
    }
}

handler.command = /^(code)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)

    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true })
    }

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

        const connectionOptions = {
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.macOS("Chrome"),
            version,
            msgRetryCache,
            markOnlineOnConnect: false,
            syncFullHistory: false,
            keepAliveIntervalMs: 30000,
        }

        let sock = makeWASocket(connectionOptions)
        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(phoneNumber)
                        code = code?.match(/.{1,4}/g)?.join("-") || code
                        setupSubBotEvents(sock, authFolder, m, conn)
                        resolve(code)
                    } catch (err) {
                        reject(err)
                    }
                }, 2500)
            })
        } else {
            setupSubBotEvents(sock, authFolder, m, conn)
            return "Conectado"
        }

    } catch (e) {
        console.error(e)
        throw e
    }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const botNumber = path.basename(authFolder)

        if (connection === 'open') {
            console.log(chalk.bold.cyanBright(`\n+${botNumber} CONECTADO.`))
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) {
                global.conns.push(sock)
            }
            await joinChannels(sock)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            const sessionDead = [401, 403, 405, DisconnectReason.loggedOut, DisconnectReason.badSession].includes(reason)

            if (sessionDead) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => c.user?.id !== sock.user?.id)
            } else {
                assistant_accessJadiBot({ m, conn, phoneNumber: botNumber, fromCommand: false })
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        setImmediate(async () => {
            try {
                const { handler } = await import('../handler.js?update=' + Date.now())
                await handler.call(sock, chatUpdate)
            } catch (e) {}
        })
    })
}

async function joinChannels(sock) {
    if (!global.ch) return
    for (const channelId of Object.values(global.ch)) {
        await sock.newsletterFollow(channelId).catch(() => {})
    }
}
