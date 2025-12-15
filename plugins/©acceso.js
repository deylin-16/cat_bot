const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, generateWAMessageFromContent, proto } = (await import("@whiskeysockets/baileys"));
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util' 
import * as ws from 'ws'
const { spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'
let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""
const res1 = await fetch('https://files.catbox.moe/dz34fo.jpg');
const thumb3 = Buffer.from(await res1.arrayBuffer());
    const fkontak1 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        orderMessage: {
          itemCount: 1,
          status: 1,
          surface: 1,
          message: `CONECTADO CON WHATSAPP`,
          orderTitle: "Mejor Assistant",
          jpegThumbnail: thumb3
        }
      }
    };
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let who;
    if (!args[0]) return conn.reply(m.chat, `*Ingrese el número de WhatsApp para vincular el Assistant.*\n\nEjemplo: ${usedPrefix + command} 521XXXXXXXXXX`, m);
    if (isNaN(args[0])) return conn.reply(m.chat, `El número ingresado no es válido.`, m);
    
    let number = args[0].replace(/[^0-9]/g, '');
    if (number.length < 8) return conn.reply(m.chat, `El número es demasiado corto.`, m);
    who = number + '@s.whatsapp.net';
    
    let id = `${number}`;
    let pathAssistant = path.join(`./assistant/`, id);
    
    try {
        if (!fs.existsSync(pathAssistant)){
            fs.mkdirSync(pathAssistant, { recursive: true });
        }
    } catch (e) {
        console.error(`[ERROR FS/PERMISOS]: ${e.message}`);
        return conn.reply(m.chat, `Hubo un error al intentar crear la sesión: ${e.message}`, m);
    }
    
    try {
        JBOptions.pathAssistant = pathAssistant;
        JBOptions.m = m;
        JBOptions.conn = conn;
        JBOptions.args = args;
        JBOptions.usedPrefix = usedPrefix;
        JBOptions.command = command;
        JBOptions.fromCommand = true;
        JBOptions.targetJid = who; 
        
        await startAssistant(JBOptions);
        
    } catch (e) {
        console.error(`[ERROR CRÍTICO EN startAssistant]: ${e.message}`);
        return conn.reply(m.chat, `Hubo un error crítico al iniciar la conexión: ${e.message}. Revise el archivo principal (index.js).`, m);
    }
};

handler.help = ['conectar']
handler.tags = ['assistant']
handler.command = ['conectar']
export default handler 

export async function startAssistant(options) {
    let { pathAssistant, m, conn, args, usedPrefix, command, targetJid } = options
    let txtCode, codeBot
    const pathCreds = path.join(pathAssistant, "creds.json")
    if (!fs.existsSync(pathAssistant)){
        fs.mkdirSync(pathAssistant, { recursive: true })
    }
    try {
        args[1] && args[1] != undefined ? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[1], "base64").toString("utf-8")), null, '\t')) : ""
    } catch {
        conn.reply(m.chat, `Use correctamente el comando » ${usedPrefix + command} (número) (código base64 opcional)`, m)
        return
    }
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const msgRetry = (MessageRetryMap) => { }
    const msgRetryCache = new NodeCache()
    const { state, saveState, saveCreds } = await useMultiFileAuthState(pathAssistant)
    
    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false, 
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) },
        msgRetry,
        msgRetryCache,
        browser: ['Access-Assistant', 'Chrome','2.0.0'],
        version: version,
        generateHighQualityLinkPreview: true
    };
    
    // **AQUÍ ESTÁ EL CAMBIO IMPORTANTE:** Llamar a makeWASocket y luego ejecutar el Pairing Code de forma inmediata si no hay credenciales
    let sock = makeWASocket(connectionOptions)
    sock.isInit = false
    let isInit = true

    // **LOGICA PARA FORZAR EL CODIGO DE EMPAREJAMIENTO**
    // Esto se ejecuta inmediatamente después de crear el socket, antes de que el evento 'connection.update' se dispare completamente.
    if (!sock.authState.creds.me) { 
        try {
            const phoneNumber = targetJid.split`@`[0];
            let secret = await sock.requestPairingCode(phoneNumber); // Esta función es la que estaba fallando silenciosamente.
            secret = secret.match(/.{1,4}/g)?.join("-");
            
            const codeMessage = `Tu código para vincular es:\n→ **${secret}**\n\nCódigo expira en 30s ⏳\n\n*Recuerda vincular usando la opción 'Vincular con número de teléfono' en WhatsApp.*`;
            
            // Usar conn.sendMessage para mayor fiabilidad
            txtCode = await conn.sendMessage(m.chat, { text: codeMessage }, { quoted: m });
            
            console.log(chalk.rgb(255, 165, 0)(`\nCódigo de emparejamiento generado para: +${phoneNumber} -> ${secret}\n`));
            
            if (txtCode && txtCode.key) {
                // Eliminar el mensaje después de 30 segundos
                setTimeout(() => { conn.sendMessage(m.chat, { delete: txtCode.key })}, 30000);
            }
            
        } catch (error) {
            // Si falla, lo reportamos inmediatamente en la consola y en el chat
            console.error(chalk.red(`[ERROR BAILYS CRÍTICO] Falló al solicitar el código: ${error.message}`));
            conn.reply(m.chat, `[ERROR BAILYS] No se pudo generar el código. Causa: ${error.message}. Asegúrate de que el número esté libre de sesiones.`, m);
            
            // Aseguramos el cierre de la conexión fallida
            try { sock.ws.close() } catch (e) {}
            sock.ev.removeAllListeners()
            return // Detenemos la ejecución de startAssistant
        }
    }


    async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update
        if (isNewLogin) sock.isInit = false
        
        // Mantenemos este log para diagnóstico, aunque el Pairing Code ya se envió arriba.
        if (qr && !sock.authState.creds.me) {
            console.log(chalk.yellow(`[DEBUG] QR generado, pero estamos forzando el código de emparejamiento (Pairing Code).`));
        }

        if (connection === 'connecting') {
           // Como el código de emparejamiento ya se pidió antes, esta sección queda vacía para evitar duplicidad o conflictos.
        }
        
        const endSesion = async (loaded) => {
            if (!loaded) {
                try {
                    sock.ws.close()
                } catch {
                }
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)                
                if (i < 0) return 
                delete global.conns[i]
                global.conns.splice(i, 1)
            }
        }
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
        if (connection === 'close') {
            if (reason === 428) {
                console.log(chalk.rgb(255, 165, 0)(`\nLa conexión (+${path.basename(pathAssistant)}) fue cerrada inesperadamente. Intentando reconectar...`))
                await creloadHandler(true).catch(console.error)
            }
            if (reason === 408) {
                console.log(chalk.rgb(255, 165, 0)(`\nLa conexión (+${path.basename(pathAssistant)}) se perdió o expiró. Razón: ${reason}. Intentando reconectar...`))
                await creloadHandler(true).catch(console.error)
            }
            if (reason === 440) {
                console.log(chalk.rgb(255, 165, 0)(`\nLa conexión (+${path.basename(pathAssistant)}) fue reemplazada por otra sesión activa.`))
                try {
                    if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistant)}@s.whatsapp.net`, {text : 'HEMOS DETECTADO UNA NUEVA SESIÓN, BORRE LA NUEVA SESIÓN PARA CONTINUAR\n\n> SI HAY ALGÚN PROBLEMA VUELVA A CONECTARSE' }, { quoted: m || null }) : ""
                } catch (error) {
                    console.error(chalk.rgb(255, 165, 0)(`Error 440 no se pudo enviar mensaje a: +${path.basename(pathAssistant)}`))
                }}
            if (reason == 405 || reason == 401) {
                console.log(chalk.rgb(255, 165, 0)(`\nLa sesión (+${path.basename(pathAssistant)}) fue cerrada. Credenciales no válidas o dispositivo desconectado manualmente.`))
                try {
                    if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistant)}@s.whatsapp.net`, {text : 'SESIÓN PENDIENTE\n\n> INTENTÉ NUEVAMENTE VOLVER A SER ASSISTANT' }, { quoted: m || null }) : ""
                } catch (error) {
                    console.error(chalk.rgb(255, 165, 0)(`Error 405 no se pudo enviar mensaje a: +${path.basename(pathAssistant)}`))
                }
                fs.rmdirSync(pathAssistant, { recursive: true })
            }
            if (reason === 500) {
                console.log(chalk.rgb(255, 165, 0)(`\nConexión perdida en la sesión (+${path.basename(pathAssistant)}). Borrando datos...`))
                if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathAssistant)}@s.whatsapp.net`, {text : 'CONEXIÓN PÉRDIDA\n\n> INTENTÉ MANUALMENTE VOLVER A SER ASSISTANT' }, { quoted: m || null }) : ""
                return creloadHandler(true).catch(console.error)
            }
            if (reason === 515) {
                console.log(chalk.rgb(255, 165, 0)(`\nRinicio automático para la sesión (+${path.basename(pathAssistant)}).`))
                await creloadHandler(true).catch(console.error)
            }
            if (reason === 403) {
                console.log(chalk.rgb(255, 165, 0)(`\nSesión cerrada o cuenta en soporte para la sesión (+${path.basename(pathAssistant)}).`))
                fs.rmdirSync(pathAssistant, { recursive: true })
            }
        }
        if (global.db.data == null) loadDatabase()
        if (connection == `open`) {
            if (!global.db.data?.users) loadDatabase()
            let userName, userJid 
            userName = sock.authState.creds.me.name || 'Anónimo'
            userJid = sock.authState.creds.me.jid || `${path.basename(pathAssistant)}@s.whatsapp.net`
            console.log(chalk.rgb(255, 165, 0)(`\nASSISTANT\n\n${userName} (+${path.basename(pathAssistant)}) conectado exitosamente.\n\nCONECTADO`))
            sock.isInit = true
            global.conns.push(sock)
            await joinChannels(sock)
            m?.chat ? await conn.sendMessage(m.chat, {text: args[1] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : ` 
Bienvenido @${m.sender.split('@')[0]}, a la familia de 
 Assistant_Access disfruta del servicio.
 
 ${global.dev || 'Deylin'}
`, mentions: [m.sender]}, { quoted: fkontak1 }) : ''
        }
    }
    setInterval(async () => {
        if (!sock.user) {
            try { sock.ws.close() } catch (e) {      
            }
            sock.ev.removeAllListeners()
            let i = global.conns.indexOf(sock)                
            if (i < 0) return
            delete global.conns[i]
            global.conns.splice(i, 1)
        }
    }, 60000)
    let handler = await import('../handler.js')
    let creloadHandler = async function (restatConn) {
        try {
            const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
            if (Object.keys(Handler || {}).length) handler = Handler
        } catch (e) {
            console.error(`Error: `, e)
        }
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
        sock.handler = handler.handler.bind(sock)
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
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));}
function msToTime(duration) {
var milliseconds = parseInt((duration % 1000) / 100),
seconds = Math.floor((duration / 1000) % 60),
minutes = Math.floor((duration / (1000 * 60)) % 60),
hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
hours = (hours < 10) ? '0' + hours : hours
minutes = (minutes < 10) ? '0' + minutes : minutes
seconds = (seconds < 10) ? '0' + seconds : seconds
return minutes + ' m y ' + seconds + ' s '
}
async function joinChannels(conn) {
for (const channelId of Object.values(global.ch)) {
await conn.newsletterFollow(channelId).catch(() => {})
}}
