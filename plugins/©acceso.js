import pino from 'pino'
import { Boom } from '@hapi/boom'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import path from "path"

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

if (!(global.conns instanceof Array)) global.conns = []

// Implementación interna de AuthState para Mongoose sin librerías externas
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

    // Obtenemos o creamos las credenciales base
    let creds = await readData('creds');
    if (!creds) {
        // Generación manual de credenciales para evitar el error de initInMemoryKeyStore
        creds = {
            registrationId: Math.floor(Math.random() * 10000),
            advSecretKey: Buffer.alloc(32).fill(Math.random() * 255).toString('base64'),
            nextPreKeyId: 1,
            firstUnuploadedPreKeyId: 1,
            accountSettings: { unarchiveChats: false }
        };
    }

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
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            if (value) await writeData(value, sId);
                            else await SessionModel.deleteOne({ _id: sId });
                        }
                    }
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
    return {
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE VINCULACIÓN`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl: config.assistantImage,
                sourceUrl: 'https://www.deylin.xyz' 
            }
        }
    }
}

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        let phoneNumber = m.sender.split('@')[0]
        await m.reply('⏳ *Generando código...* Por favor espere unos segundos.')
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const { version } = await fetchLatestBaileysVersion()
    
    // Iniciar sesión en MongoDB específica para este número
    const { state, saveCreds } = await useMongooseAuthState(`Sub_${phoneNumber}`)

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
        },
        browser: Browsers.macOS("Desktop"),
        version
    })

    if (!sock.authState.creds.registered && fromCommand) {
        // Delay crítico: MongoDB necesita un momento para indexar las nuevas llaves
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                await conn.sendMessage(m.chat, { text: `🔑 *Tu código:* ${code}`, ...m_code(conn.user.jid) }, { quoted: m })
            } catch (err) {
                console.error("Error al pedir código:", err)
            }
        }, 8000) // 8 segundos para ir a lo seguro con la DB
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            await conn.sendMessage(m.chat, { text: '✅ *¡Conectado exitosamente!*' }, { quoted: m })
            global.conns.push(sock)
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) assistant_accessJadiBot(options)
            else {
                const SessionModel = mongoose.models[`Sub_${phoneNumber}`];
                if (SessionModel) await SessionModel.collection.drop().catch(() => {})
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
    
    // Integración con tu handler principal
    const handlerImport = await import('../handler.js')
    sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))
}
