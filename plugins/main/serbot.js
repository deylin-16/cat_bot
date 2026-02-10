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
            if (!phoneNumber || phoneNumber.length < 8) return m.reply('> *⚠️ No se pudo determinar el número de origen.*')
            
            const instruccion = `*───「 VINCULACIÓN 」───*\n\n` +
                `*Sigue estos pasos para activar tu sub-bot:*\n\n` +
                `*1.* *Entra a Ajustes o Configuración*\n` +
                `*2.* *Selecciona Dispositivos vinculados*\n` +
                `*3.* *Toca en Vincular un dispositivo*\n` +
                `*4.* *Selecciona "Vincular con el número de teléfono"*\n\n` 

            await conn.sendMessage(m.chat, {
                text: instruccion,
                contextInfo: {
                    externalAdReply: {
                        title: `${global.name?.() || 'SISTEMA JADIBOT'}`,
                        thumbnailUrl: global.img?.() || '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
            if (code && code !== "Conectado") {
                await conn.sendMessage(m.chat, { 
                    text: `> *CÓDIGO DE ACCESO:*\n\n#️⃣  *${code}*` 
                }, { quoted: m })
            }
            return
        }
        m.reply(`Usa *${usedPrefix}code*`)
    }
}
export default serbot

export async function assistant_accessJadiBot(options) {
    let { phoneNumber, fromCommand } = options
    const id = phoneNumber.replace(/\D/g, '')
    const authFolder = path.join(process.cwd(), 'jadibts', id)
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })
    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)
        
        
        const silentLogger = pino({ level: 'silent' })

        const sock = makeWASocket({
            logger: silentLogger,
            auth: { 
                creds: state.creds, 
                
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger) 
            },
            browser: Browsers.macOS("Chrome"),
            version,
            msgRetryCache,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            
            printQRInTerminal: false 
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
                            setupSubBotEvents(sock, authFolder)
                            resolve(code?.match(/.{1,4}/g)?.join("-") || code)
                        } catch { resolve(null) }
                    }
                })
            })
        } else {
            setupSubBotEvents(sock, authFolder)
            return "Conectado"
        }
    } catch (e) {}
}

function setupSubBotEvents(sock, authFolder) {
    sock.ev.removeAllListeners('connection.update')
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const id = path.basename(authFolder)
        if (connection === 'open') {
            console.log(chalk.bold.greenBright(`\n[ SUB-BOT ] Conexión exitosa: ${id}`))
            const userJid = jidNormalizedUser(sock.user.id)
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === userJid)) global.conns.push(sock)
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            const errorMessages = {
                [DisconnectReason.loggedOut]: "Sesión cerrada desde el teléfono. Eliminando datos...",
                [DisconnectReason.badSession]: "Archivo de sesión corrupto. Limpiando...",
                [DisconnectReason.connectionClosed]: "Conexión finalizada por el servidor.",
                [DisconnectReason.connectionLost]: "Se perdió la señal de red.",
                [DisconnectReason.restartRequired]: "Reinicio necesario.",
                [DisconnectReason.timedOut]: "Tiempo de espera agotado.",
                403: "Acceso denegado (Posible baneo).",
                405: "El código de emparejamiento ha vencido."
            }
            const mensajeError = errorMessages[reason] || `Cierre por código: ${reason}`
            console.log(chalk.bold.yellow(`\n[ SUB-BOT ] Estado en ${id}: ${mensajeError}`))
            const criticalErrors = [DisconnectReason.loggedOut, DisconnectReason.badSession, 401, 403, 405]
            if (criticalErrors.includes(reason)) {
                console.log(chalk.bold.red(`[ SISTEMA ] Eliminando carpeta de sesión inválida: ${id}`))
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(sock.user?.id))
            } else {
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), 10000)
            }
        }
    })

    sock.ev.removeAllListeners('messages.upsert')
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const Path = path.join(process.cwd(), 'lib/message.js')
            const smsgPath = path.join(process.cwd(), 'lib/serializer.js')
            const { smsg } = await import(`file://${smsgPath}?update=${Date.now()}`)
            const { message } = await import(`file://${Path}?update=${Date.now()}`)
            for (let msg of chatUpdate.messages) {
                if (!msg.message || msg.key.fromMe) continue
                let m = await smsg(sock, msg) 
                await message.call(sock, m, chatUpdate)
            }
        } catch (e) {}
    })
}
