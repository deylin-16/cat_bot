import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import * as ws from 'ws'
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'
import * as baileys from "@whiskeysockets/baileys" 
import { fork } from 'child_process' 
import { unlinkSync, existsSync } from 'fs'; 

let mainHandlerModule = await import('../handler.js').catch(e => console.error('Error al cargar handler principal:', e))
let mainHandlerFunction = mainHandlerModule?.handler || (() => {})

const { 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion
} = baileys; 

const logger = pino({ level: "fatal" }) 
const { CONNECTING } = ws
const SESSIONS_FOLDER = 'assistant_access' 

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (global.additionalConns instanceof Array) console.log()
else global.additionalConns = []
const msgRetryCache = new NodeCache()

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
if (!isROwner) return m.reply(`❌ Solo el creador puede gestionar sesiones adicionales.`);

const normalizedCommand = command ? command.toLowerCase() : '';

if (normalizedCommand === 'conectar') {
    let rawId = args[0] ? args[0].replace(/[^0-9]/g, '') : m.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (rawId.length < 8) return conn.reply(m.chat, `⚠️ Proporcione un identificador válido para la sesión.`, m)


    let sessionId = rawId.startsWith('+') ? rawId : `+${rawId}` 
    let folderId = rawId

    const additionalConnsCount = global.additionalConns.length
    const MAX_SESSIONS = 30 
    if (additionalConnsCount >= MAX_SESSIONS) {
    return conn.reply(m.chat, `❌ Máximo de ${MAX_SESSIONS} sesiones adicionales alcanzado.`, m)
    }

    let pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, folderId)

    if (fs.existsSync(pathSubSession) && fs.existsSync(path.join(pathSubSession, "creds.json"))) {
        return conn.reply(m.chat, `⚠️ Ya existe una sesión activa o previa con el ID *${folderId}*. Si desea eliminarla use *${usedPrefix}eliminar_conexion ${folderId}*`, m)
    }

    if (!fs.existsSync(pathSubSession)){
        fs.mkdirSync(pathSubSession, { recursive: true })
    }

    await conn.reply(m.chat, `⌛ Iniciando nueva sesión aislada para ID: *${folderId}*. Número a vincular: *${sessionId}*. Esperando código de emparejamiento...`, m);

    ConnectAdditionalSession({ pathSubSession, m, conn, usedPrefix, sessionId, folderId })
} 

if (normalizedCommand === 'eliminar_conexion') {
    let folderId = args[0] ? args[0].replace(/[^0-9]/g, '') : ''

    if (!folderId) return m.reply(`⚠️ Uso: *${usedPrefix}eliminar_conexion [ID de Sesión]*`);

    const pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, folderId)

    if (fs.existsSync(pathSubSession)) {
         try {
            const activeConnIndex = global.additionalConns.findIndex(c => path.basename(c.authState.path) === folderId);
            if (activeConnIndex !== -1) {
                const connToDelete = global.additionalConns[activeConnIndex];
                await connToDelete.ws.close();
                global.additionalConns.splice(activeConnIndex, 1);
                m.reply(`🗑️ Sesión activa ${folderId} cerrada.`);
            }

            fs.rmdirSync(pathSubSession, { recursive: true });
            m.reply(`🗑️ Carpeta de sesión ${folderId} eliminada por completo.`);
         } catch (e) {
            console.error(e);
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
    let { pathSubSession, m, conn, usedPrefix, sessionId, folderId } = options

    let { version } = await fetchLatestBaileysVersion()
    const msgRetry = (MessageRetryMap) => { }
    const { state, saveState, saveCreds } = await useMultiFileAuthState(pathSubSession)

    const connectionOptions = {
        logger: logger,
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
        },
        msgRetry,
        msgRetryCache,
        browser: [`Sesión Adicional ${folderId}`, 'Chrome','20.0.04'],
        version: version,
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: undefined,
    };

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false
    let isInit = true
    let codeSent = false 



    async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update

        if (isNewLogin) sock.isInit = false


        if (qr && !codeSent && !sock.authState.creds.registered) {

            console.log(chalk.bold.yellow(`[ASSISTANT_ACCESS] QR recibido para ${folderId}. Llamando a requestPairingCode para ${sessionId}...`));

            try {

                let secret = await sock.requestPairingCode(sessionId) 
                secret = secret?.match(/.{1,4}/g)?.join("-") || secret


                await conn.reply(m.chat, secret, m)

                console.log(chalk.bold.white(chalk.bgMagenta(`\n🌟 CÓDIGO FUNCIONAL (+${folderId}) 🌟`)), chalk.bold.yellowBright(secret))
                codeSent = true 
            } catch (e) {
                console.error(`Error al solicitar pairing code para ${folderId}:`, e);

                if (e.message.includes('Connection Closed') || e.message.includes('428')) {
                    await conn.reply(m.chat, `⚠️ Fallo en la conexión (*428*). Reintentando sesión *${folderId}*...`, m);
                    sock.ws.close();
                } else {
                     await conn.reply(m.chat, `⚠️ Error al obtener código. Intente *${usedPrefix}eliminar_conexion ${folderId}* y vuelva a *${usedPrefix}conectar ${folderId}*.`, m);
                     sock.ws.close();
                }
            }
        } 


        if (connection === 'close') {
            codeSent = false;
            const reason = lastDisconnect?.error?.output?.statusCode; 

            const shouldReconnect = [
                DisconnectReason.timedOut,    
                DisconnectReason.badSession,  
                DisconnectReason.connectionLost, 
                DisconnectReason.restartRequired, 
            ].includes(reason);

            if (shouldReconnect) {
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] Sesión (+${folderId}) se cerró. Razón: ${reason}. RECONECTANDO...`))
                await delay(5000) 
                return creloadHandler(true).catch(console.error)
            } 

            if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 405) {
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] SESIÓN CERRADA (+${folderId}). Borrando datos.`))

                fs.rmdirSync(pathSubSession, { recursive: true })
            }
        }


        if (global.db.data == null) loadDatabase()
        if (connection == `open`) {
            let userName = sock.authState.creds.me.name || 'Anónimo'

            console.log(chalk.bold.cyanBright(` 🪐 ${userName} (+${folderId}) CONECTADO exitosamente.`))

            sock.isInit = true
            if (!global.additionalConns.some(c => c.user?.jid === sock.user?.jid)) {
                global.additionalConns.push(sock)
            }
            if (sock.authState.creds.registered && codeSent) { 
                await conn.reply(m.chat, `🎉 *Sesión ID: ${folderId}* vinculada y activa.`, m);
            }
        }
    }

    let creloadHandler = async function (restatConn) {
        let currentHandler = mainHandlerFunction 

        if (restatConn) {
            const oldChats = sock.chats
            try { sock.ws.close() } catch { }
            sock.ev.removeAllListeners()
            sock = makeWASocket(connectionOptions, { chats: oldChats }) 
            isInit = true
        }
        if (!isInit) {
            sock.ev.off("messages.upsert", sock.handler)
            sock.ev.off("connection.update", sock.connectionUpdate)
            sock.ev.off('creds.update', sock.credsUpdate)
        }

        sock.handler = currentHandler.bind(sock)
        sock.connectionUpdate = connectionUpdate.bind(sock)
        sock.credsUpdate = saveCreds.bind(sock, true)
        sock.ev.on("messages.upsert", sock.handler)
        sock.ev.on("connection.update", sock.connectionUpdate)
        sock.ev.on("creds.update", sock.credsUpdate)
        isInit = false
        return true
    }
    creloadHandler(false)
}
