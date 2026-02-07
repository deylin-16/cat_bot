import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import { 
    makeWASocket, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion, 
    Browsers, 
    useMultiFileAuthState,
    jidNormalizedUser
} from '@whiskeysockets/baileys'

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',
    run: async (m, { conn, command, usedPrefix }) => {
        if (command === 'code') {
            // Extraer solo números del sender para evitar el error del @lid
            let phoneNumber = m.sender.replace(/\D/g, '')
            
            if (!phoneNumber || phoneNumber.length < 8) {
                return m.reply('> *No pude obtener tu número real (PN). Intenta escribirme un mensaje normal primero.*')
            }

            const instruccion = `*VINCULACIÓN DE SUB-BOT*\n\n1. Abre WhatsApp y ve a 'Dispositivos vinculados'.\n2. Toca en 'Vincular un dispositivo' y luego en 'Vincular con el número de teléfono'.\n3. Ingresa el código que te enviaré a continuación.`

            await conn.sendMessage(m.chat, {
                text: instruccion,
                contextInfo: {
                    externalAdReply: {
                        title: `${global.name?.() || 'Deylin Bot'}`,
                        thumbnailUrl: global.img?.() || '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true,
                        sourceUrl: 'https://deylin.xyz'
                    }
                }
            }, { quoted: m })

            // Iniciar proceso de código
            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })

            if (code && code !== "Conectado") {
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
        m.reply(`Usa el comando *${usedPrefix}code* para obtener tu código.`)
    }
}
export default serbot

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const id = phoneNumber.replace(/\D/g, '') // Limpieza extra del ID
    const authFolder = path.join(process.cwd(), 'jadibts', id)

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
            browser: Browsers.macOS("Chrome"), // MacOS suele ser más rápido para pairing
            version,
            msgRetryCache,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered && fromCommand) {
            // Solicitud ultra rápida: Esperamos solo a que el socket inicie el handshake
            return new Promise(async (resolve) => {
                let codeSent = false
                sock.ev.on('connection.update', async (update) => {
                    const { connection } = update
                    if ((connection === 'connecting' || connection === 'open') && !codeSent) {
                        codeSent = true
                        await new Promise(r => setTimeout(r, 2500)) // Reducido a 2.5s para mayor velocidad
                        try {
                            let code = await sock.requestPairingCode(id)
                            code = code?.match(/.{1,4}/g)?.join("-") || code
                            setupSubBotEvents(sock, authFolder, m, conn)
                            resolve(code)
                        } catch (err) {
                            console.error(`Error pairing: ${err.message}`)
                            resolve(null)
                        }
                    }
                })
            })
        } else {
            setupSubBotEvents(sock, authFolder, m, conn)
            return "Conectado"
        }
    } catch (e) { console.error(e) }
}

function setupSubBotEvents(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const botNumber = path.basename(authFolder)

        if (connection === 'open') {
            const userJid = jidNormalizedUser(sock.user.id)
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === userJid)) {
                global.conns.push(sock)
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason === DisconnectReason.loggedOut || reason === 401) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user.id))
            } else {
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: botNumber, fromCommand: false }), 5000)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const handlerPath = path.join(process.cwd(), 'handler.js')
            const { handler } = await import(`file://${handlerPath}?update=${Date.now()}`)
            for (let msg of chatUpdate.messages) {
                if (!msg.message || msg.key.fromMe) continue
                await handler.call(sock, msg, chatUpdate)
            }
        } catch (e) { console.error(e) }
    })
}
