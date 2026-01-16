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
    useMultiFileAuthState,
    jidNormalizedUser
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))


const { makeWASocket } = await import('../lib/simple.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

const name = (conn) => global.botname || conn.user?.name || 'Bot'

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

handler.help = ['qr', 'code', 'subbot']
handler.tags = ['serbot']
handler.command = /^(qr|code|subbot)$/i 

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
            markOnlineOnConnect: true,
            syncFullHistory: false,
            keepAliveIntervalMs: 30000,
            
            getMessage: async (key) => {
                return { conversation: 'Dynamic Bot' }
            }
        }

        
        let sock = makeWASocket(connectionOptions)
        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            if (!fromCommand && !apiCall) {
                
                return
            }

            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''))
                        code = code?.match(/.{1,4}/g)?.join("-") || code

                        if (fromCommand && m && conn) {
                            await conn.sendMessage(m.chat, { text: `CÓDIGO: ${code}` }, { quoted: m })
                        }

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
        console.error(e)
        throw e
    }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const botNumber = path.basename(authFolder)

        if (connection === 'open') {
            console.log(chalk.bold.greenBright(`[SUB-BOT] +${botNumber} ONLINE`))
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) {
                global.conns.push(sock)
            }
            await joinChannels(sock)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            const sessionDead = [DisconnectReason.loggedOut, 401, 403, 405].includes(reason)

            if (sessionDead) {
                console.log(chalk.redBright(`[SESIÓN] Murió: +${botNumber}. Limpiando...`))
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => c.user?.id !== sock.user?.id)
            } else {
                
                assistant_accessJadiBot({ m, conn, phoneNumber: botNumber, fromCommand: false, apiCall: false })
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!global.db.data) return 
        setImmediate(async () => {
            try {
                const { handler } = await import('../handler.js?update=' + Date.now())
                await handler.call(sock, chatUpdate)
            } catch (e) { }
        })
    })
}

async function joinChannels(sock) {
    if (!global.ch) return
    for (const channelId of Object.values(global.ch)) {
        await sock.newsletterFollow(channelId).catch(() => {})
    }
}
