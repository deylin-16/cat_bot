import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'

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
    if (command === 'conectar' || command === 'conectar_assistant') {
        let phoneNumber = m.sender.split('@')[0];
        await m.reply('⚡ *Iniciando sistema de emparejamiento...*\nEspere su código de vinculación.');
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true });
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
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
                    await conn.sendMessage(m.chat, { 
                        text: `${formattedCode}` 
                    }, { quoted: m })
                } catch (err) {
                    console.error("Error al generar Pairing Code:", err)
                }
            }, 5000)
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                await conn.sendMessage(m.chat, { text: '✅ *¡Sub-Bot conectado con éxito...*' }, { quoted: m })
                global.conns.push(sock)
            }
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) assistant_accessJadiBot(options)
                else {
                    
                    fs.rmSync(authFolder, { recursive: true, force: true })
                }
            }
        })

        const handlerImport = await import('../handler.js')
        sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))

    } catch (e) {
        console.error("Error en Sub-Bot Local:", e)
        if (fromCommand) m.reply('❌ Error al iniciar sesión local.')
    }
}
