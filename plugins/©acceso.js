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
    let sessionId = args[0] ? args[0].replace(/[^0-9]/g, '') : m.sender.split('@')[0]
    if (sessionId.length < 8) return conn.reply(m.chat, `⚠️ Proporcione un identificador válido para la sesión.`, m)

    const additionalConnsCount = global.additionalConns.length
    const MAX_SESSIONS = 30 
    if (additionalConnsCount >= MAX_SESSIONS) {
    return conn.reply(m.chat, `❌ Máximo de ${MAX_SESSIONS} sesiones adicionales alcanzado.`, m)
    }

    let pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, sessionId)

    if (fs.existsSync(pathSubSession) && fs.existsSync(path.join(pathSubSession, "creds.json"))) {
        return conn.reply(m.chat, `⚠️ Ya existe una sesión activa o previa con el ID *${sessionId}*. Si desea eliminarla use *${usedPrefix}eliminar_conexion ${sessionId}*`, m)
    }

    if (!fs.existsSync(pathSubSession)){
        fs.mkdirSync(pathSubSession, { recursive: true })
    }
    
    await conn.reply(m.chat, `⌛ Iniciando nueva sesión aislada para ID: *${sessionId}*. Esperando código de emparejamiento...`, m);

    ConnectAdditionalSession({ pathSubSession, m, conn })
} 

if (normalizedCommand === 'eliminar_conexion') {
    let sessionId = args[0] ? args[0].replace(/[^0-9]/g, '') : ''

    if (!sessionId) return m.reply(`⚠️ Uso: *${usedPrefix}eliminar_conexion [ID de Sesión]*`);

    const pathSubSession = path.join(`./${SESSIONS_FOLDER}/`, sessionId)
    
    if (fs.existsSync(pathSubSession)) {
         try {
            const activeConnIndex = global.additionalConns.findIndex(c => path.basename(c.authState.path) === sessionId);
            if (activeConnIndex !== -1) {
                const connToDelete = global.additionalConns[activeConnIndex];
                await connToDelete.ws.close();
                global.additionalConns.splice(activeConnIndex, 1);
                m.reply(`🗑️ Sesión activa ${sessionId} cerrada.`);
            }

            fs.rmdirSync(pathSubSession, { recursive: true });
            m.reply(`🗑️ Carpeta de sesión ${sessionId} eliminada por completo.`);
         } catch (e) {
            console.error(e);
            m.reply(`⚠️ Error al borrar la carpeta física de la sesión ${sessionId}.`);
         }
    } else {
        m.reply(`❌ No se encontró ninguna sesión con el ID ${sessionId}.`);
    }
}
} 
handler.help = ['conectar [id]', 'eliminar_conexion [id]']
handler.tags = ['session']
handler.command = ['conectar', 'eliminar_conexion']
handler.owner = true
export default handler 

export async function ConnectAdditionalSession(options) {
    let { pathSubSession, m, conn } = options
    let sessionId = path.basename(pathSubSession)
    
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
        browser: [`Sesión Adicional ${sessionId}`, 'Chrome','20.0.04'],
        version: version,
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: undefined,
    };

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false
    let isInit = true
    let codeSent = false 

    // --- LÓGICA DE SOLICITUD DE CÓDIGO INMEDIATA (COMO EN INDEX.JS) ---
    if (!sock.authState.creds.registered) {
        (async () => {
            // Utilizamos el mismo retraso de 3 segundos que en index.js para estabilizar la conexión.
            await delay(3000); 
            try {
                let secret = await sock.requestPairingCode(sessionId) 
                secret = secret?.match(/.{1,4}/g)?.join("-") || secret

                const rtx2 = `
✅ *CÓDIGO WHATSAPP PARA VINCULAR*

💻 〢 Sesión ID: *${sessionId}*
⏳ 〢 Ingresa el código en 60s.

> 🔑 CÓDIGO: *${secret}*

*Instrucciones:* En tu móvil, ve a *Dispositivos vinculados* > *Vincular con el número de teléfono* e ingresa el código.
`;
                await conn.reply(m.chat, rtx2.trim(), m);
                codeSent = true 
            } catch (e) {
                console.error(`Error al solicitar pairing code para ${sessionId}:`, e);
                await conn.reply(m.chat, `⚠️ Error al obtener código. Intente *${options.usedPrefix}eliminar_conexion ${sessionId}* y vuelva a *${options.usedPrefix}conectar ${sessionId}*.`, m);
                // Si falla, cerramos el socket para evitar que se quede pegado.
                sock.ws.close(); 
            }
        })();
    }
    // --- FIN LÓGICA DE SOLICITUD DE CÓDIGO INMEDIATA ---

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update

        if (isNewLogin) sock.isInit = false

        if (qr && !codeSent) { 
            // Si el QR aparece y el código NO se ha enviado, forzamos el cierre para que se reintente la conexión
            // y la lógica de arriba vuelva a intentar obtener el código de emparejamiento.
            console.log(chalk.bold.yellow(`[ASSISTANT_ACCESS] QR recibido para ${sessionId}. Cerrando para forzar modo código...`));
            sock.ws.close();
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
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] Sesión (+${sessionId}) se cerró. Razón: ${reason}. RECONECTANDO...`))
                await delay(5000) 
                return creloadHandler(true).catch(console.error)
            } 

            if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 405) {
                console.log(chalk.bold.magentaBright(`\n[ASSISTANT_ACCESS] SESIÓN CERRADA (+${sessionId}). Borrando datos.`))
                
                fs.rmdirSync(pathSubSession, { recursive: true })
            }
        }

        if (global.db.data == null) loadDatabase()
        if (connection == `open`) {
            let userName = sock.authState.creds.me.name || 'Anónimo'
            
            console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SESIÓN ADICIONAL •】⸺⸺⸺⸺❒\n│ 🟢 ${userName} (+${sessionId}) CONECTADO exitosamente.\n❒⸺⸺⸺【• CONECTADO •】⸺⸺⸺❒`))

            sock.isInit = true
            if (!global.additionalConns.some(c => c.user?.jid === sock.user?.jid)) {
                global.additionalConns.push(sock)
            }
            if (codeSent) {
                await conn.reply(m.chat, `🎉 *Sesión ID: ${sessionId}* vinculada y activa.`, m);
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
