import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import * as ws from 'ws'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const { 
    default: makeWASocket,
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    useMultiFileAuthState 
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',
    run: async (m, { conn, command, usedPrefix }) => {
        if (command === 'code') {
            const instruccion = `*VINCULACIÓN DE SUB-BOT*\n\n1. Abre WhatsApp y ve a 'Dispositivos vinculados'.\n2. Toca en 'Vincular un dispositivo' y luego en 'Vincular con el número de teléfono'.\n3. Ingresa el código que te enviaré a continuación.`

            await conn.sendMessage(m.chat, {
                text: instruccion,
                contextInfo: {
                    externalAdReply: {
                        title: `\t\t\t\t\t\t${global.name()}`,
                        thumbnailUrl: global.img(),
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true,
                        sourceUrl: 'https://deylin.xyz'
                    }
                }
            }, { quoted: m })

            let phoneNumber = m.sender.split('@')[0]
            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })

            if (typeof code === 'string' && code !== "Conectado") {
                await conn.sendMessage(m.chat, { 
                    text: code,
                    contextInfo: {
                        externalAdReply: {
                            title: 'CÓDIGO DE VINCULACIÓN',
                            body: 'Copia y pega este código en WhatsApp',
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: m })
            }
            return
        }

        m.reply(`Usa el comando *${usedPrefix}code* para obtener tu código de vinculación.`)
    }
}
export default serbot

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.ubuntu("Chrome"),
            version,
            msgRetryCache,
            markOnlineOnConnect: true,
            syncFullHistory: false,
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            if (!fromCommand) {
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
                    } catch (err) { reject(err) }
                }, 3000)
            })
        } else {
            setupSubBotEvents(sock, authFolder, m, conn)
            return "Conectado"
        }
    } catch (e) { throw e }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const botNumber = path.basename(authFolder)

        if (connection === 'open') {
            const userJid = jidNormalizedUser(sock.user.id)
            console.log(chalk.bold.cyanBright(`\n🍪 SUB-BOT +${botNumber} CONECTADO.`))
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === userJid)) {
                global.conns.push(sock)
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user.id))
            } else {
                assistant_accessJadiBot({ m, conn, phoneNumber: botNumber, fromCommand: false })
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const handlerPath = path.join(process.cwd(), 'handler.js')
            const { handler } = await import(`file://${handlerPath}?update=${Date.now()}`)

            for (let msg of chatUpdate.messages) {
                if (!msg.message) continue
                await handler.call(sock, msg, chatUpdate)
            }
        } catch (e) { console.error(chalk.red('[ERROR SUBBOT]:'), e) }
    })
}
