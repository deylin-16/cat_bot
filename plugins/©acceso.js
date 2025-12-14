import { fileURLToPath } from 'url';
import path from 'path';
import { useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser } from '@whiskeysockets/baileys';
import { makeWASocket } from '../lib/simple.js';
import chalk from 'chalk';
import Pino from 'pino';
import fs, { rmSync } from 'fs';
import store from '../lib/store.js';

const command = ['crear_acceso', 'vincular', 'conexiones'];

export default {
    command,
    rowner: true,
    tags: ['admin'],
    
    async call(m, { text, conn, command, isOwner, isROwner }) {
        if (!isROwner) {
             return conn.reply(m.chat, `Solo con Deylin-Eliac hablo de eso w.`, m);
        }

        const args = text.split(/\s+/).filter(v => v);

        switch (command) {
            case 'crear_acceso':
                if (args.length < 1 || args[0] !== '1') {
                    return conn.reply(m.chat, `*Comando inválido.* Usa: Crear_acceso 1`, m);
                }
                
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                const numberConn = global.authCodeNumber.toString();
                
                global.authCodeMap.set(newCode, {
                    number: numberConn,
                    used: false,
                    creatorJid: m.sender,
                    createdAt: Date.now()
                });
                
                global.authCodeNumber++;

                conn.reply(m.chat, 
                    `*🔑 CÓDIGO DE ACCESO GENERADO*:\n\n` +
                    `*Número de Conexión (Dirección):* ${numberConn}\n` +
                    `*Código de Acceso (Contraseña):* ${newCode}\n\n` +
                    `_Solo puede usarse una vez con el comando:_ \n` +
                    `*Vincular ${numberConn} ${newCode}*`, m);
                break;

            case 'vincular':
                if (args.length !== 2) {
                    return conn.reply(m.chat, `*Comando inválido.* Usa: Vincular (número) (contraseña de acceso)`, m);
                }
                
                const [targetNumber, targetCode] = args;
                const authData = global.authCodeMap.get(targetCode.toUpperCase());

                if (!authData || authData.used || authData.number !== targetNumber) {
                    return conn.reply(m.chat, `❌ *ERROR DE CONEXIÓN*:\n\nNúmero de conexión o código de acceso inválido/usado.`, m);
                }
                
                authData.used = true;
                global.authCodeMap.set(targetCode.toUpperCase(), authData);
                
                if (global.usedNumbers.has(targetNumber)) {
                    return conn.reply(m.chat, `⚠️ *ADVERTENCIA*: El número de conexión *${targetNumber}* ya está en uso.`, m);
                }
                
                global.usedNumbers.add(targetNumber);

                const sessionID = `${global.ACCESS_SESSION_PREFIX}${targetNumber}`;
                const sessionPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', global.sessions, sessionID);
                
                const { state, saveState, saveCreds } = await useMultiFileAuthState(sessionPath);
                
                const connectionOptionsJadibot = {
                    logger: Pino({ level: 'silent' }),
                    printQRInTerminal: true,
                    browser: ['WhatsApp-bot-Subsession', 'Edge', '20.0.04'],
                    auth: {
                        creds: state.creds,
                        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
                    },
                    markOnlineOnConnect: true,
                    generateHighQualityLinkPreview: true,
                    getMessage: async (clave) => {
                        let jid = jidNormalizedUser(clave.remoteJid);
                        let msg = await store.loadMessage(jid, clave.id);
                        return msg?.message || "";
                    },
                };

                const subConn = makeWASocket(connectionOptionsJadibot);
                
                subConn.numberConn = targetNumber;
                subConn.saveCreds = saveCreds;
                global.conns.set(subConn.user.jid, subConn);
                
                subConn.ev.on('connection.update', global.connectionUpdateJadibot.bind(subConn));
                subConn.ev.on('creds.update', subConn.saveCreds.bind(subConn, true));
                
                await global.subreloadHandler(false);

                conn.reply(m.chat, `✅ *VINCULACIÓN INICIADA*:\n\nEl usuario que usó el código recibirá un QR en la terminal. Debe escanearlo *rápidamente*.`, m);

                subConn.ev.on('qr', qr => {
                    conn.sendMessage(m.chat, { image: qr, caption: `*ESCANEE ESTE QR RÁPIDAMENTE*\n\nSesión: *${targetNumber}*` }, { quoted: m });
                });
                
                break;

            case 'conexiones':
                const activeConnections = Array.from(global.conns.values())
                    .filter(c => c.user)
                    .map(c => `- *[${c.numberConn}]* ID: ${c.user.jid.split('@')[0]}`);
                
                const response = activeConnections.length > 0 
                    ? `*🔗 CONEXIONES DE SUBSECCIÓN ACTIVAS:*\n\n${activeConnections.join('\n')}\n\n*TOTAL: ${activeConnections.length}*`
                    : `*❌ NO HAY CONEXIONES ACTIVAS EN ESTE MOMENTO.*`;
                
                conn.reply(m.chat, response, m);
                break;

            default:
                break;
        }
    },

    after() {}
}
