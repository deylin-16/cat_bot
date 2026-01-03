import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk' // <--- IMPORTACIÓN FALTANTE QUE CAUSA EL ERROR

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
        await m.reply('⚡ *Iniciando instancia independiente...*\nEspere su código de vinculación.');
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
            if (!fromCommand) return; 
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
                    } catch (err) { reject(err) }
                }, 5000)
            })
        } else {
            configurarEventos(sock, authFolder, m, conn)
            return "Conectando..."
        }

    } catch (e) {
        console.error('Error en JadiBot:', e)
        throw e
    }
}

function configurarEventos(sock, authFolder, m, conn) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'open') {
            console.log(chalk.greenBright(`[SUB-BOT] Conectado: ${path.basename(authFolder)}`))
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) global.conns.push(sock)
        }
        
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.yellowBright(`[SUB-BOT] Reintentando conexión: ${path.basename(authFolder)}`))
                assistant_accessJadiBot({ m, conn, phoneNumber: path.basename(authFolder), fromCommand: false })
            } else {
                console.log(chalk.redBright(`[SUB-BOT] Sesión cerrada.`))
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
                global.conns = global.conns.filter(c => c !== sock)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const handlerImport = await import('../handler.js')
            await handlerImport.handler.call(sock, chatUpdate)
        } catch (e) { console.error(e) }
    })
}
