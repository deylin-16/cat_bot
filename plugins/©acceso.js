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
const botStartTime = {}

let handler = async (m, { conn, command }) => {
    const url = 'https://deylin.xyz/pairing_code?v=5'
    await conn.sendMessage(m.chat, { 
        text: `Sólo te puedes hacer subbot desde la web:\n${url}`,
        contextInfo: {
            externalAdReply: {
                title: 'VINCULAR SUB-BOT ',
                body: 'dynamic bot - pairing code',
                thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767826205356_ikCIl9sqp0.jpeg',
                sourceUrl: url,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(conectar|vídeo|subbot|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)
    
    // Si no hay creds y no viene de un comando, ignoramos para no crear carpetas basura
    if (!fromCommand && !fs.existsSync(path.join(authFolder, 'creds.json'))) return

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
                        if (m && conn) await conn.sendMessage(m.chat, { text: formattedCode }, { quoted: m })
                        configurarEventos(sock, authFolder)
                        resolve(formattedCode)
                    } catch (err) { reject(err) }
                }, 3000)
            })
        } else {
            configurarEventos(sock, authFolder)
            return "Conectado"
        }
    } catch (e) { console.error(e) }
}

function configurarEventos(sock, authFolder) {
    const id = path.basename(authFolder)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'open') {
            console.log(chalk.greenBright(`[OK] Sub-Bot: ${id}`))
            botStartTime[id] = Math.floor(Date.now() / 1000)
            
            // IMPORTANTE: Esto hace que aparezcan en tu comando de lista
            if (!global.conns.some(c => c.user?.id === sock.user?.id)) {
                global.conns.push(sock)
            }
            await sock.newsletterFollow('120363406846602793@newsletter').catch(() => {})
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            global.conns = global.conns.filter(c => c.user?.id !== sock.user?.id)

            if (reason === DisconnectReason.loggedOut || reason === 401) {
                console.log(chalk.red(`[ELIMINADO] Sesión inválida: ${id}`))
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true })
            } else {
                // Solo reintenta si no es un cierre voluntario o expulsión
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), 10000)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const msg = chatUpdate.messages[0]
        if (!msg || !msg.message) return

        const target = '120363406846602793@newsletter'
        const time = msg.messageTimestamp?.low || msg.messageTimestamp

        // Reacción automática corregida
        if (msg.key.remoteJid === target && time > (botStartTime[id] || 0)) {
            const emojis = ['✅', '🔥', '🚀', '⭐']
            await sock.sendMessage(target, { 
                react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key } 
            }, { newsletter: true }).catch(() => {})
        }

        try {
            const handlerImport = await import('../handler.js')
            await handlerImport.handler.call(sock, chatUpdate)
        } catch (e) {}
    })
}

const loadSubBots = async () => {
    const root = path.join(process.cwd(), 'jadibts')
    if (!fs.existsSync(root)) return
    
    // Solo listamos carpetas que tengan creds.json (Esto evita que cargue los "28" si solo hay 8 reales)
    const folders = fs.readdirSync(root).filter(f => fs.existsSync(path.join(root, f, 'creds.json')))
    
    console.log(chalk.cyan(`[SISTEMA] Cargando ${folders.length} subbots reales...`))

    for (const folder of folders) {
        await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false })
        await new Promise(r => setTimeout(r, 8000)) // 8 segundos para no saturar Akirax
    }
}

// Iniciar carga tras 10 segundos del arranque principal
setTimeout(loadSubBots, 10000)
