import pino from 'pino'
import { Boom } from '@hapi/boom'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import path from "path"

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    Curve, 
    generateRegistrationId
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

if (!(global.conns instanceof Array)) global.conns = []

// Función mejorada con validación de conexión
async function useMongooseAuthState(modelName) {
    // Verificar si la conexión a MongoDB está abierta
    if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB no está conectado. Por favor, asegúrese de que el bot principal inició la conexión a la base de datos.");
    }

    const SessionSchema = new mongoose.Schema({ _id: String, data: String });
    const SessionModel = mongoose.models[modelName] || mongoose.model(modelName, SessionSchema);

    const writeData = async (data, id) => {
        const json = JSON.stringify(data, (k, v) => Buffer.isBuffer(v) ? { type: 'Buffer', data: v.toString('base64') } : v);
        // Usamos lean() y evitamos el buffering si la conexión se cae
        await SessionModel.replaceOne({ _id: id }, { data: json }, { upsert: true }).exec();
    };

    const readData = async (id) => {
        try {
            const res = await SessionModel.findOne({ _id: id }).lean().exec();
            if (!res) return null;
            return JSON.parse(res.data, (k, v) => v?.type === 'Buffer' ? Buffer.from(v.data, 'base64') : v);
        } catch { return null; }
    };

    let creds = await readData('creds');
    if (!creds) {
        const keyPair = Curve.generateKeyPair();
        creds = {
            registrationId: generateRegistrationId(),
            advSecretKey: Buffer.alloc(32).fill(Math.random() * 255).toString('base64'),
            nextPreKeyId: 1,
            firstUnuploadedPreKeyId: 1,
            accountSettings: { unarchiveChats: false },
            signedPreKey: {
                keyPair: Curve.generateKeyPair(),
                signature: Buffer.alloc(64),
                keyId: 1
            },
            noiseKey: Curve.generateKeyPair(),
            signedIdentityKey: keyPair
        };
        await writeData(creds, 'creds');
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
                            const sId = `${category}-${id}`;
                            const value = data[category][id];
                            if (value) await writeData(value, sId);
                            else await SessionModel.deleteOne({ _id: sId }).exec();
                        }
                    }
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        // Validación preventiva
        if (mongoose.connection.readyState !== 1) {
            return m.reply('❌ Error: La base de datos MongoDB no está lista. Reintente en unos segundos.');
        }

        let phoneNumber = m.sender.split('@')[0];
        await m.reply('⚡ *Iniciando servidor de sesión...* Por favor espere su código.');
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true });
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    
    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMongooseAuthState(`Sub_${phoneNumber}`)

        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
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
                        text: `🔑 *CÓDIGO:* ${formattedCode}\n\nEscríbelo en la notificación de WhatsApp para vincularte.` 
                    }, { quoted: m })
                } catch (err) {
                    console.error("Error al generar Pairing Code:", err)
                    await conn.sendMessage(m.chat, { text: "❌ Error al generar el código. Reintente el comando." })
                }
            }, 10000)
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                await conn.sendMessage(m.chat, { text: '✅ *Sub-Bot conectado con éxito!*' }, { quoted: m })
                global.conns.push(sock)
            }
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) assistant_accessJadiBot(options)
            }
        })

        const handlerImport = await import('../handler.js')
        sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))

    } catch (error) {
        console.error("Error en asistente:", error)
        if (m) conn.sendMessage(m.chat, { text: `❌ Error crítico: ${error.message}` })
    }
}
