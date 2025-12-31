import pino from 'pino'
import { Boom } from '@hapi/boom'
import mongoose from 'mongoose'

const { 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    Browsers,
    Curve, 
    generateRegistrationId,
    proto 
} = (await import("@whiskeysockets/baileys")).default || (await import("@whiskeysockets/baileys"))

const { makeWASocket } = await import('../lib/simple.js')

if (!(global.conns instanceof Array)) global.conns = []

async function useMongooseAuthState(modelName) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("DATABASE_NOT_READY");
    }

    const SessionSchema = new mongoose.Schema({ 
        _id: String, 
        data: String 
    });
    
    const SessionModel = mongoose.models[modelName] || mongoose.model(modelName, SessionSchema);

    const writeData = async (data, id) => {
        const json = JSON.stringify(data, (k, v) => Buffer.isBuffer(v) ? { type: 'Buffer', data: v.toString('base64') } : v);
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
                            const sId = `${category}-${id}`;
                            const value = data[category][id];
                            tasks.push(value ? writeData(value, sId) : SessionModel.deleteOne({ _id: sId }).exec());
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

let handler = async (m, { conn, command }) => {
    if (command === 'conectar' || command === 'conectar_assistant') {
        if (mongoose.connection.readyState !== 1) {
            return m.reply('❌ Error: MongoDB no está listo. Reintenta en 10 segundos.');
        }
        let phoneNumber = m.sender.split('@')[0];
        await m.reply('⚡ *Iniciando sesión en la nube...*\nEspere su código de vinculación.');
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
                        text: `🔑 *TU CÓDIGO:* ${formattedCode}\n\nUsa este código en la notificación de WhatsApp para conectar tu sub-bot.` 
                    }, { quoted: m })
                } catch (err) {
                    console.error("Error al generar Pairing Code:", err)
                }
            }, 8000)
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                await conn.sendMessage(m.chat, { text: '✅ *¡Sub-Bot conectado con éxito en MongoDB!*' }, { quoted: m })
                global.conns.push(sock)
            }
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) assistant_accessJadiBot(options)
            }
        })

        const handlerImport = await import('../handler.js')
        sock.ev.on('messages.upsert', handlerImport.handler.bind(sock))

    } catch (e) {
        console.error("Error en Sub-Bot:", e)
        if (fromCommand) m.reply('❌ Error crítico al conectar a la base de datos.')
    }
}
