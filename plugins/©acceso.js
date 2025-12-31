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
    initInMemoryKeyStore,
    Browsers
} = (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!(global.conns instanceof Array)) global.conns = []

async function useMongooseAuthState(modelName) {
    const SessionSchema = new mongoose.Schema({
        _id: String,
        data: String
    });
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

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        let socklimit = global.conns.filter(sock => sock?.user).length
        if (socklimit >= 50) return m.reply(`No hay espacios disponibles.`)
        let phoneNumber = m.sender.split('@')[0]
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    let isPairingSent = false 
    const { version } = await fetchLatestBaileysVersion()
    
    const { state, saveCreds } = await useMongooseAuthState(`Session_${phoneNumber}`)

    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'})) 
        },
        browser: Browsers.macOS("Chrome"),
        version: version,
        markOnlineOnConnect: false,
        syncFullHistory: false
    }

    let sock = makeWASocket(connectionOptions)

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        const chatID = m?.chat || (phoneNumber ? phoneNumber + '@s.whatsapp.net' : null)

        if (qr && !sock.authState.creds.registered && fromCommand && !isPairingSent) {
            if (!chatID) return
            isPairingSent = true 
            setTimeout(async () => {
                try {
                    let secret = await sock.requestPairingCode(phoneNumber)
                    secret = secret.match(/.{1,4}/g)?.join("-")
                    await conn.sendMessage(chatID, { text: secret, ...m_code(conn.user.jid) }, { quoted: m })
                } catch (e) {
                    isPairingSent = false 
                }
            }, 3000)
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                assistant_accessJadiBot(options) 
            } else {
                const SessionModel = mongoose.models[`Session_${phoneNumber}`] || mongoose.model(`Session_${phoneNumber}`);
                await SessionModel.collection.drop().catch(() => {})
                global.conns = global.conns.filter(s => s.user?.jid !== sock.user?.jid)
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            if (!global.conns.some(s => s.user?.jid === sock.user.jid)) global.conns.push(sock)
        }
    }

    sock.ev.on("connection.update", connectionUpdate)
    sock.ev.on("creds.update", saveCreds)
    let handlerImport = await import('../handler.js')
    sock.ev.on("messages.upsert", handlerImport.handler.bind(sock))
}
