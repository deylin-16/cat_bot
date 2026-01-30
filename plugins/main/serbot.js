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

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

const name = (conn) => global.botname || conn.user?.name || 'Bot'

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',
    run: async (m, { conn, command, usedPrefix }) => {
        const url = 'https://deylin.xyz/pairing_code?v=5'

        if (command === 'code') {
            let phoneNumber = m.sender.split('@')[0]
            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true, apiCall: false })

            if (typeof code === 'string' && code !== "Conectado") {
                await conn.sendMessage(m.chat, { 
                    text: `${code}`,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363406846602793@newsletter',
                            newsletterName: `SIGUE EL CANAL DE: ${name(conn)}`,
                            serverMessageId: 1
                        },
                        externalAdReply: {
                            title: 'VINCULAR SUB-BOT',
                            body: `${name(conn)} pairing code`,
                            thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                            mediaType: 1,
                            mediaUrl: url,
                            sourceUrl: url,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m })
            }
            return
        }

        await conn.sendMessage(m.chat, { 
            text: `Sólo te puedes hacer subbot desde la web:\n${url}`,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406846602793@newsletter',
                    newsletterName: `SIGUE EL CANAL DE: ${name(conn)}`,
                    serverMessageId: 1
                },
                externalAdReply: {
                    title: 'VINCULAR SUB-BOT',
                    body: 'dynamic bot pairing code',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                    mediaType: 1,
                    mediaUrl: url,
                    sourceUrl: url,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
    }
}

export default serbot

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand, apiCall } = options
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
            if (!fromCommand && !apiCall) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                return
            }

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
                }, 3000)
            })
        } else {
            setupSubBotEvents(sock, authFolder, m, conn)
            return "Conectado"
        }
    } catch (e) {
        throw e
    }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const botNumber = path.basename(authFolder)

        if (connection === 'open') {
            console.log(chalk.bold.cyanBright(`\n۝⸺⸺⸺⸺∭ SUB-BOT •\n🍪 +${botNumber} CONECTADO exitosamente.`))
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) {
                global.conns.push(sock)
            }
            await joinChannels(sock)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            const sessionDead = [DisconnectReason.loggedOut, 401, 403, 405, DisconnectReason.badSession].includes(reason)

            if (sessionDead) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => c.user?.id !== sock.user?.id)
            } else {
                assistant_accessJadiBot({ m, conn, phoneNumber: botNumber, fromCommand: false, apiCall: false })
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        setImmediate(async () => {
            try {
                const { handler } = await import('../handler.js?update=' + Date.now())
                await handler.call(sock, chatUpdate)
            } catch (e) {
                console.error(e)
            }
        })
    })
}

async function joinChannels(sock) {
    if (!global.ch) return
    for (const channelId of Object.values(global.ch)) {
        await sock.newsletterFollow(channelId).catch(() => {})
    }
}
