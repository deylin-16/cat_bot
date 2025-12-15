import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs, { rmdirSync, existsSync, mkdirSync } from "fs"
import path, { dirname } from "path"
import pino from 'pino'
import chalk from 'chalk'
import * as ws from 'ws'
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'
import * as baileys from "@whiskeysockets/baileys" 
import { loadDatabase } from '../index.js'; 

let mainHandlerModule = await import('../handler.js').catch(e => console.error('Error al cargar handler principal:', e))
let mainHandlerFunction = mainHandlerModule?.handler || (() => {})

const { 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion
} = baileys; 

const logger = pino({ level: "fatal" }) 
const SESSIONS_FOLDER = 'assistant_access' 

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (global.additionalConns instanceof Array) console.log()
else global.additionalConns = []
const msgRetryCache = new NodeCache()

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60)
    seconds = (seconds < 10) ? '0' + seconds : seconds
    minutes = (minutes < 10) ? '0' + minutes : minutes
    return minutes + ' m y ' + seconds + ' s '
}

let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
if (!isROwner) return m.reply(`❌ Solo el creador puede gestionar sesiones adicionales.`);

const normalizedCommand = command ? command.toLowerCase() : '';

if (normalizedCommand === 'conectar') {
    let rawId = args[0] ? args[0].replace(/[^0-9]/g, '') : m.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (rawId.length < 8) return conn.reply(m.chat, `⚠️ Proporcione un identificador válido para la sesión.`, m)

    let sessionId = rawId.startsWith('+') ? rawId : rawId
    let folderId = rawId

    const additionalConnsCount = global.additionalConns.length
    const MAX_SESSIONS = 30 
    if (additionalConnsCount >= MAX_SESSIONS) {
        return conn.reply(m.chat, `❌ Máximo de ${MAX_SESSIONS} sesiones adicionales alcanzado.`, m)
    }

    let pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, folderId)

    if (existsSync(pathSubSession) && existsSync(path.join(pathSubSession, "creds.json"))) {
        return conn.reply(m.chat, `⚠️ Ya existe una sesión activa o previa con el ID *${folderId}*. Si desea eliminarla use *${usedPrefix}eliminar_conexion ${folderId}*`, m)
    }

    if (!existsSync(pathSubSession)){
        mkdirSync(pathSubSession, { recursive: true })
    }

    let time = global.db.data.users[m.sender]?.Subs + 120000 || 0
    if (new Date - (global.db.data.users[m.sender]?.Subs || 0) < 120000) {
    }

    await conn.reply(m.chat, `⌛ Iniciando vinculación para ID: *${folderId}*. Esperando código de emparejamiento...`, m);

    ConnectAdditionalSession({ pathSubSession, m, conn, usedPrefix, sessionId, folderId })
    global.db.data.users[m.sender].Subs = new Date * 1
} 

if (normalizedCommand === 'eliminar_conexion') {
    let folderId = args[0] ? args[0].replace(/[^0-9]/g, '') : ''

    if (!folderId) return m.reply(`⚠️ Uso: *${usedPrefix}eliminar_conexion [ID de Sesión]*`);

    const pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, folderId)

    if (existsSync(pathSubSession)) {
         try {
            const activeConnIndex = global.additionalConns.findIndex(c => path.basename(c.authState?.path) === folderId);
            if (activeConnIndex !== -1) {
                const connToDelete = global.additionalConns[activeConnIndex];
                connToDelete.ws.close();
                global.additionalConns.splice(activeConnIndex, 1);
                m.reply(`🗑️ Sesión activa ${folderId} cerrada.`);
            }

            rmdirSync(pathSubSession, { recursive: true });
            m.reply(`🗑️ Carpeta de sesión ${folderId} eliminada por completo.`);
         } catch (e) {
            console.error(`Error al borrar la sesión ${folderId}:`, e);
            m.reply(`⚠️ Error al borrar la carpeta física de la sesión ${folderId}.`);
         }
    } else {
        m.reply(`❌ No se encontró ninguna sesión con el ID ${folderId}.`);
    }
}
} 
handler.help = ['conectar [id]', 'eliminar_conexion [id]']
handler.tags = ['session']
handler.command = ['conectar', 'eliminar_conexion']
handler.owner = true
export default handler 

export async function ConnectAdditionalSession(options) {
    let { pathSubSession, m, conn, sessionId, folderId } = options

    let { version } = await fetchLatestBaileysVersion()
    const msgRetry = (MessageRetryMap) => { }
    let { state, saveCreds } = await useMultiFileAuthState(pathSubSession) 

    const getMessageFunction = (conn && conn.options && conn.options.getMessage) ? conn.options.getMessage : undefined;
    
    const connectionOptions = {
        logger: logger,
        printQRInTerminal: false,
        mobile: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
        },
        msgRetry,
        msgRetryCache,
        browser: ['Ubuntu', 'Chrome', '109.0.5414.0'],
        version: version,
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: undefined,
        getMessage: getMessageFunction, 
    };

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false
    let isInit = true
    let codeSent = false 
    sock.authState = { path: pathSubSession, creds: state.creds } 


    async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update

        if (isNewLogin) sock.isInit = false

        
        if (connection === 'connecting' && !sock.authState.creds.registered && !codeSent) {
             console.log(chalk.bold.yellow(`[ASSISTANT_ACCESS] Conectando para +${folderId}. Solicitando código de emparejamiento...`));
             try {
                let secret = await sock.requestPairingCode(sessionId) 
                secret = secret?.match(/.{1,4}/g)?.join("-") || secret

                await conn.reply(m.chat, `
*CÓDIGO DE VINCULACIÓN*

*ID de Sesión:* ${folderId}
*Número:* ${sessionId}

*CÓDIGO:* \`\`\`${secret}\`\`\`

_Dirígete a tu móvil: *Dispositivos Vinculados* > *Vincular con el número de teléfono* e introduce este código._
                `, m)

                console.log(chalk.bold.white(chalk.bgMagenta(`\n🌟 CÓDIGO FUNCIONAL (+${folderId}) 🌟`)), chalk.bold.yellowBright(secret))
                codeSent = true 
            } catch (e) {
                console.error(`Error al solicitar pairing code para +${folderId}:`, e);
                return creloadHandler(true).catch(console.error)
            }
        }
        
        if (connection === 'open') {
            let userName = sock.authState.creds.me.name || 'Anónimo'
            console.log(chalk.bold.cyanBright(` 🪐 ${userName} (+${folderId}) CONECTADO exitosamente.`))

            if (sock.authState.creds.registered) {
                if (!global.additionalConns.some(c => c.user?.jid === sock.user?.jid)) {
                    global.additionalConns.push(sock)
                }
                if (codeSent) { 
                    await conn.reply(m.chat, `🎉 *Sesión ID: ${folderId}* vinculada y activa.`, m);
                    codeSent = false; 
                }
            }
            sock.isInit = true
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode; 

            const shouldReconnect = [
                DisconnectReason.timedOut,    
                DisconnectReason.connectionClosed, 
                DisconnectReason.connectionLost, 
                DisconnectReason.restartRequired, 
                428, 
                500, 
                515, 
            ].includes(reason);

            if (shouldReconnect) {
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] Sesión (+${folderId}) se cerró. Razón: ${reason}. RECONECTANDO...`))
                await delay(5000) 
                return creloadHandler(true).catch(console.error)
            } 

            if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 405 || reason === DisconnectReason.badSession || reason === 403) {
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] SESIÓN CERRADA/INVALIDA (+${folderId}). Borrando datos.`))

                rmdirSync(pathSubSession, { recursive: true })

                const activeConnIndex = global.additionalConns.findIndex(c => c.authState?.path === pathSubSession);
                if (activeConnIndex !== -1) {
                    global.additionalConns.splice(activeConnIndex, 1);
                }
                
                conn.reply(m.chat, `⚠️ La sesión ${folderId} ha sido cerrada permanentemente (Razón: ${reason}). Por favor, re-vincule si es necesario.`, m)
            }
             codeSent = false;
        }

        if (global.db.data == null) loadDatabase()
    }


    let creloadHandler = async function (restatConn) {
        let currentHandler = mainHandlerFunction 

        if (restatConn) {
            const oldChats = sock.chats
            try { sock.ws.close() } catch { }
            // Corrección: Eliminamos sock.ev.removeAllListeners() que causaba el TypeError
            sock.ev.removeAllListeners = () => sock.ev.eventNames().forEach(eventName => sock.ev.removeAllListeners(eventName))
            try { sock.ev.removeAllListeners() } catch { } 
            
            ({ state, saveCreds } = await useMultiFileAuthState(pathSubSession)) 
            connectionOptions.auth = { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
            }

            sock = makeWASocket(connectionOptions, { chats: oldChats }) 
            sock.isInit = false
            sock.authState = { path: pathSubSession, creds: state.creds } 
            isInit = true
            
            sock.credsUpdate = saveCreds.bind(sock, true)
            sock.ev.on("creds.update", sock.credsUpdate)
        }
        
        if (!isInit) {
            sock.ev.off("messages.upsert", sock.handler)
            sock.ev.off("connection.update", sock.connectionUpdate)
            sock.ev.off('creds.update', sock.credsUpdate)
        }

        sock.handler = currentHandler.bind(sock)
        sock.connectionUpdate = connectionUpdate.bind(sock)
        
        if (!restatConn) {
            sock.credsUpdate = saveCreds.bind(sock, true)
        }

        sock.ev.on("messages.upsert", sock.handler)
        sock.ev.on("connection.update", sock.connectionUpdate)
        sock.ev.on("creds.update", sock.credsUpdate)
        isInit = false

        return true
    }
    creloadHandler(false)
}
