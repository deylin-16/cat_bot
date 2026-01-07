import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    useMultiFileAuthState
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant' || command === 'subbot') {
        const url = 'https://deylin.xyz/pairing_code?v=5'
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
                    title: 'VINCULAR SUB-BOT ',
                    body: 'dynamic bot - pairing code',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                    mediaUrl: url,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
    }
}

handler.command = /^(conectar|vídeo|subbot|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand, apiCall } = options
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)

    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true })
    }

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)
        const msgRetryCounterCache = new NodeCache()

        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.macOS("Chrome"),
            version,
            msgRetryCounterCache,
            markOnlineOnConnect: false,
            syncFullHistory: false
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            if (!fromCommand && !apiCall) return; 

            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        const code = await sock.requestPairingCode(phoneNumber)
                        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code
                        if (fromCommand && m && conn) {
                            await conn.sendMessage(m.chat, { text: `${formattedCode}` }, { quoted: m })
                        }
                        configurarEventos(sock, authFolder, m, conn)
                        resolve(formattedCode)
                    } catch (err) { 
                        reject(err) 
                    }
                }, 3000)
            })
        } else {
            configurarEventos(sock, authFolder, m, conn)
            return "Conectado"
        }
    } catch (e) {
        throw e
    }
}

function configurarEventos(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log(chalk.greenBright(`[SUB-BOT] Conectado: ${path.basename(authFolder)}`))
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) global.conns.push(sock)
            await joinChannels(sock)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => {
                    assistant_accessJadiBot({ m, conn, phoneNumber: path.basename(authFolder), fromCommand: false, apiCall: false })
                }, 5000)
            } else {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => c.user?.id !== sock.user?.id)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0]
            if (!msg || msg.key.remoteJid !== '120363406846602793@newsletter') {
                const handlerImport = await import('../handler.js')
                await handlerImport.handler.call(sock, chatUpdate)
                return
            }
            const emojis = ['✅', '🔥', '🚀', '⭐', '🤖']
            await sock.sendMessage(msg.key.remoteJid, { 
                react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key } 
            }, { newsletter: true })
        } catch (e) {}
    })
}

async function joinChannels(sock) {
    try {
        await sock.newsletterFollow('120363406846602793@newsletter')
    } catch (e) {}
}

const loadSubBots = async () => {
    const jadibtsPath = path.join(process.cwd(), 'jadibts')
    if (!fs.existsSync(jadibtsPath)) return
    const folders = fs.readdirSync(jadibtsPath)
    for (const folder of folders) {
        const folderPath = path.join(jadibtsPath, folder)
        if (fs.statSync(folderPath).isDirectory() && fs.existsSync(path.join(folderPath, 'creds.json'))) {
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false, apiCall: false })
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
}

loadSubBots()
