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
import { getRealJid, cleanNumber } from '../../lib/identifier.js'

if (!(global.conns instanceof Array)) global.conns = []
const msgRetryCache = new NodeCache()

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',
    run: async (m, { conn, command, usedPrefix }) => {
        if (command === 'code') {
            const realJid = await getRealJid(conn, null, m)
            const phoneNumber = cleanNumber(realJid)

            if (!phoneNumber || phoneNumber.length < 8) {
                return m.reply('> *No pude obtener tu número real (PN). Intenta enviarme un mensaje al privado primero.*')
            }

            const instruccion = `*VINCULACIÓN DE SUB-BOT*\n\n1. Ve a 'Dispositivos vinculados' > 'Vincular con número'.\n2. Ingresa el código que aparecerá abajo.`

            await conn.sendMessage(m.chat, {
                text: instruccion,
                contextInfo: {
                    externalAdReply: {
                        title: `${global.name?.() || 'Deylin Bot'}`,
                        thumbnailUrl: global.img?.() || '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })

            if (code && code !== "Conectado") {
                await conn.sendMessage(m.chat, { text: code }, { quoted: m })
            }
            return
        }
        m.reply(`Usa *${usedPrefix}code*`)
    }
}
export default serbot

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const id = phoneNumber.replace(/\D/g, '')
    const authFolder = path.join(process.cwd(), 'jadibts', id)

    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.macOS("Chrome"),
            version,
            msgRetryCache,
            syncFullHistory: false,
            markOnlineOnConnect: true
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered && fromCommand) {
            return new Promise(async (resolve) => {
                let codeSent = false
                sock.ev.on('connection.update', async (update) => {
                    const { connection } = update
                    if (connection === 'connecting' && !codeSent) {
                        codeSent = true
                        await new Promise(r => setTimeout(r, 3000))
                        try {
                            let code = await sock.requestPairingCode(id)
                            code = code?.match(/.{1,4}/g)?.join("-") || code
                            setupSubBotEvents(sock, authFolder, m, conn)
                            resolve(code)
                        } catch { resolve(null) }
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
        const { connection, lastDisconnect } = update;
        const id = path.basename(authFolder);

        if (connection === 'open') {
            console.log(chalk.greenBright(`[ SUB-BOT ] Sesión abierta: ${id}`));
            const userJid = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === userJid)) {
                global.conns.push(sock);
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            
            const deleteSessionErrors = [
                DisconnectReason.loggedOut,
                DisconnectReason.badSession,
                403,
                405 
            ];

            if (deleteSessionErrors.includes(reason)) {
                console.log(chalk.redBright(`[ SUB-BOT ] Sesión inválida (${reason}). Eliminando carpeta: ${id}`));
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user.id));
            } else {
                
                console.log(chalk.yellowBright(`[ SUB-BOT ] Reintentando conexión: ${id} (Razón: ${reason})`));
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), 10000);
            }
        }
    });


    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const smsgPath = path.join(process.cwd(), 'lib/serializer.js')
            const handlerPath = path.join(process.cwd(), 'handler.js')
            
            const { smsg } = await import(`file://${smsgPath}?update=${Date.now()}`)
            const { handler } = await import(`file://${handlerPath}?update=${Date.now()}`)

            for (let msg of chatUpdate.messages) {
                if (!msg.message || msg.key.fromMe) continue
                let m = await smsg(sock, msg) 
                await handler.call(sock, m, chatUpdate)
            }
        } catch (e) { console.error(e) }
    })
}
