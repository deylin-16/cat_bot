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
            if (!phoneNumber || phoneNumber.length < 8) return m.reply('> *Error al obtener número.*')
            const instruccion = `*VINCULACIÓN DE SUB-BOT*\n\n1. Dispositivos vinculados > Vincular con número.\n2. Ingresa el código.`
            await conn.sendMessage(m.chat, { text: instruccion }, { quoted: m })
            let code = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
            if (code && code !== "Conectado") await conn.sendMessage(m.chat, { text: code }, { quoted: m })
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
        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) 
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
            console.log(chalk.greenBright(`[ SUB-BOT ] Sesión abierta: ${id}`))
            const userJid = jidNormalizedUser(sock.user.id)
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === userJid)) global.conns.push(sock)
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if ([DisconnectReason.loggedOut, 401, 403].includes(reason)) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user.id))
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
