import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    proto,
    Curve,
    generateRegistrationId
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

if (!(global.conns instanceof Array)) global.conns = []

// Función para manejar la sesión en UN SOLO ARCHIVO JSON
async function useSingleFileAuthState(filePath) {
    let creds
    let keys = {}

    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'), (k, v) => {
            if (v?.type === 'Buffer') return Buffer.from(v.data, 'base64')
            return v
        })
        creds = data.creds
        keys = data.keys || {}
    } else {
        // Generación manual de llaves para evitar el error 'initInMemoryKeyStore'
        const keyPair = Curve.generateKeyPair()
        creds = {
            registrationId: generateRegistrationId(),
            advSecretKey: Buffer.alloc(32).fill(Math.random() * 255).toString('base64'),
            nextPreKeyId: 1,
            firstUnuploadedPreKeyId: 1,
            accountSettings: { unarchiveChats: false },
            signedPreKey: {
                keyPair: Curve.generateKeyPair(),
                signature: Buffer.alloc(64),
                keyId: 1
            },
            noiseKey: Curve.generateKeyPair(),
            signedIdentityKey: keyPair
        }
    }

    const saveState = () => {
        const data = JSON.stringify({ creds, keys }, (k, v) => 
            Buffer.isBuffer(v) ? { type: 'Buffer', data: v.toString('base64') } : v, 2)
        fs.writeFileSync(filePath, data)
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data = {}
                    ids.forEach(id => {
                        let value = keys[`${type}-${id}`]
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value)
                        }
                        data[id] = value
                    })
                    return data
                },
                set: (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id]
                            const sId = `${category}-${id}`
                            if (value) keys[sId] = value
                            else delete keys[sId]
                        }
                    }
                    saveState()
                }
            }
        },
        saveCreds: saveState
    }
}

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        let phoneNumber = m.sender.split('@')[0];
        await m.reply('⚡ *Iniciando asistente optimizado...*\n(Sesión de archivo único local)');
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true });
    }
}
handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    
    // Carpeta 'jadibts' contendrá solo un .json por cada número
    const sessionPath = path.join(process.cwd(), 'jadibts', `${phoneNumber}.json`)
    const sessionDir = path.dirname(sessionPath)
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useSingleFileAuthState(sessionPath)

        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            browser: Browsers.macOS("Chrome"),
            version
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered && fromCommand) {
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(phoneNumber)
                    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code
                    await conn.sendMessage(m.chat, { text: `🔑 *TU CÓDIGO:* ${formattedCode}` }, { quoted: m })
                } catch (err) { console.error("Error al generar código:", err) }
            }, 5000)
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                await conn.sendMessage(m.chat, { text: '✅ ¡Sub-Bot conectado con éxito localmente!' }, { quoted: m })
                global.conns.push(sock)
            }
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) assistant_accessJadiBot(options)
                else if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath)
            }
        })

        const handlerImport = await import('../handler.js')
        sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))
    } catch (e) { console.error("Error crítico:", e) }
}
