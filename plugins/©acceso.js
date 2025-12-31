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

    let creds = await readData('creds');
    if (!creds) {
        // Generación manual completa de credenciales seguras
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
        await writeData(creds, 'creds'); // Guardar inmediatamente
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
                title: `VINCULACIÓN ASISTENTE`,
                body: `Sistema de Nube MongoDB`,
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
        await m.reply('⚡ *Iniciando servidor de sesión...* Espere el código.')
        assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })
    }
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler 

export async function assistant_accessJadiBot(options) {
    let { m, conn, phoneNumber, fromCommand } = options
    const { version } = await fetchLatestBaileysVersion()
    
    // Forzamos que la sesión se cree antes de seguir
    const { state, saveCreds } = await useMongooseAuthState(`Sub_${phoneNumber}`)

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
        },
        browser: Browsers.macOS("Chrome"), // Cambiado a Chrome para mejor compatibilidad de pairing
        version
    })

    // Registro de eventos
    sock.ev.on('creds.update', saveCreds)

    if (!sock.authState.creds.registered && fromCommand) {
        // Aumentamos el tiempo a 12 segundos. MongoDB en AkiraX puede ser lento al indexar.
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber)
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code
                await conn.sendMessage(m.chat, { text: `🔑 *CÓDIGO:* ${formattedCode}`, ...m_code(conn.user.jid) }, { quoted: m })
            } catch (err) {
                console.log("Reintentando generar código...")
                // Si falla el primero, reintentamos una vez más
                setTimeout(async () => {
                    const code = await sock.requestPairingCode(phoneNumber)
                    await conn.sendMessage(m.chat, { text: `🔑 *CÓDIGO (Reintento):* ${code}` }, { quoted: m })
                }, 5000)
            }
        }, 12000)
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            await conn.sendMessage(m.chat, { text: '✅ *Sub-Bot activado en MongoDB!*' }, { quoted: m })
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

    const handlerImport = await import('../handler.js')
    sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))
}
