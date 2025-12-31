import axios from 'axios'
import FormData from 'form-data'
import { Buffer } from 'node:buffer'
import fs from "fs"
import path from "path"
import sharp from "sharp"
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    initInMemoryKeyStore
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!(global.conns instanceof Array)) global.conns = []

// Función de estado de autenticación para MongoDB
async function useMongooseAuthState(modelName) {
    const SessionSchema = new mongoose.Schema({ _id: String, data: String });
    const SessionModel = mongoose.models[modelName] || mongoose.model(modelName, SessionSchema);

    const writeData = async (data, id) => {
        const json = JSON.stringify(data, (k, v) => Buffer.isBuffer(v) ? { type: 'Buffer', data: v.toString('base64') } : v);
        await SessionModel.replaceOne({ _id: id }, { data: json }, { upsert: true });
    };

    const readData = async (id) => {
        try {
            const res = await SessionModel.findOne({ _id: id });
            if (!res) return null;
            return JSON.parse(res.data, (k, v) => v?.type === 'Buffer' ? Buffer.from(v.data, 'base64') : v);
        } catch { return null; }
    };

    const removeData = async (id) => {
        try { await SessionModel.deleteOne({ _id: id }); } catch {}
    };

    const creds = await readData('creds') || initInMemoryKeyStore().creds;

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            const { proto } = (await import('@whiskeysockets/baileys')).default;
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            tasks.push(value ? writeData(value, sId) : removeData(sId));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

let m_code = (botJid) => {
    const config = global.getAssistantConfig?.(botJid) || { 
        assistantName: 'Sub-Bot', 
        assistantImage: 'https://www.deylin.xyz/logo.jpg' 
    }
    const isBuffer = Buffer.isBuffer(config.assistantImage)
    return {
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE EMPAREJAMIENTO`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: true,
                ...(isBuffer ? { thumbnail: config.assistantImage } : { thumbnailUrl: config.assistantImage }),
                sourceUrl: 'https://www.deylin.xyz/1' 
            }
        }
    }
}

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        let socklimit = global.conns.filter(sock => sock?.user).length
        if (socklimit >= 50) return m.reply(`No hay espacios disponibles.`)
        
        let phoneNumber = m.sender.split('@')[0]
        
        // Mensaje de confirmación para que el usuario sepa que el bot está trabajando
        await m.reply('⏳ Generando su código de vinculación, por favor espere...')
        
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    let isPairingSent = false 
    const { version } = await fetchLatestBaileysVersion()
    
    // IMPORTANTE: Obtenemos el estado de Mongoose antes de configurar la conexión
    const { state, saveCreds } = await useMongooseAuthState(`Session_${phoneNumber}`)

    const connectionOptions = {
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
        },
        browser: Browsers.macOS("Chrome"),
        version: version,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        // Parche de visualización para que los códigos se vean mejor
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage || message.interactiveMessage);
            if (requiresPatch) return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
            return message;
        }
    }

    let sock = makeWASocket(connectionOptions)

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        const chatID = m?.chat || (phoneNumber ? phoneNumber + '@s.whatsapp.net' : null)

        // Si hay un QR o necesitamos el código de vinculación
        if (!sock.authState.creds.registered && !isPairingSent) {
            isPairingSent = true 
            setTimeout(async () => {
                try {
                    let secret = await sock.requestPairingCode(phoneNumber)
                    secret = secret?.match(/.{1,4}/g)?.join("-") || secret
                    await conn.sendMessage(chatID, { text: secret, ...m_code(conn.user.jid) }, { quoted: m })
                } catch (e) {
                    console.error("Error al generar Pairing Code:", e)
                    isPairingSent = false 
                }
            }, 5000) // Un ligero delay de 5 segundos para asegurar que el socket esté listo
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                assistant_accessJadiBot(options) 
            } else {
                // Si se desvincula, borramos la colección de la DB para limpiar espacio
                const SessionModel = mongoose.models[`Session_${phoneNumber}`] || mongoose.model(`Session_${phoneNumber}`);
                await SessionModel.collection.drop().catch(() => {})
                global.conns = global.conns.filter(s => s.user?.jid !== sock.user?.jid)
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            if (!global.conns.some(s => s.user?.jid === sock.user.jid)) global.conns.push(sock)
            await conn.sendMessage(chatID, { text: '✅ ¡Conectado con éxito como Sub-Bot!' }, { quoted: m })
        }
    }

    sock.ev.on("connection.update", connectionUpdate)
    sock.ev.on("creds.update", saveCreds)
    
    // Carga del handler para que el Sub-Bot funcione después de conectar
    let handlerImport = await import('../handler.js')
    sock.ev.on("messages.upsert", handlerImport.handler.bind(sock))
}
