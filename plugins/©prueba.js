import { fileURLToPath } from 'url';
import path from 'path';
import { useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser } from '@whiskeysockets/baileys';
import { makeWASocket } from '../lib/simple.js';
import chalk from 'chalk';
import Pino from 'pino';
import fs, { rmSync } from 'fs';
import store from '../lib/store.js';

const handler = async (m, { conn, text, command, isROwner }) => {
    if (!isROwner) {
         return conn.reply(m.chat, `Solo con Deylin-Eliac hablo de eso w.`, m);
    }

    const args = text.split(/\s+/).filter(v => v);

    switch (command) {
        case 'crear_acceso':
            if (args.length !== 1 || !/^\d+$/.test(args[0])) {
                return conn.reply(m.chat, `*Comando inválido.* Usa: Crear_acceso (número de teléfono sin el +)`, m);
            }
            
            const targetNumberCreate = args[0].replace(/\D/g, ''); // Asegura solo dígitos
            const newCode = Math.random().toString(36).substring(2, 7).toUpperCase(); // Código de 5 dígitos
            
            if (global.usedNumbers.has(targetNumberCreate)) {
                return conn.reply(m.chat, `⚠️ *ADVERTENCIA*: El número *${targetNumberCreate}* ya tiene una sesión activa o pendiente.`, m);
            }

            global.authCodeMap.set(newCode, {
                number: targetNumberCreate,
                used: false,
                creatorJid: m.sender,
                createdAt: Date.now()
            });
            
            conn.reply(m.chat, 
                `*🔑 CÓDIGO DE ACCESO GENERADO*:\n\n` +
                `*Número Asociado:* ${targetNumberCreate}\n` +
                `*Código de Acceso (5 dígitos):* ${newCode}\n\n` +
                `_Solo puede usarse una vez con el comando:_ \n` +
                `*Vincular ${targetNumberCreate} ${newCode}*`, m);
            break;

        case 'vincular':
            if (args.length !== 2) {
                return conn.reply(m.chat, `*Comando inválido.* Usa: Vincular (número de teléfono) (código de acceso)`, m);
            }
            
            const [targetNumber, targetCode] = args;
            const targetNumberClean = targetNumber.replace(/\D/g, '');
            const targetCodeUpper = targetCode.toUpperCase();
            
            const authData = global.authCodeMap.get(targetCodeUpper);

            if (!authData || authData.used || authData.number !== targetNumberClean) {
                return conn.reply(m.chat, `❌ *ERROR DE CONEXIÓN*:\n\nNúmero asociado o código de acceso inválido/usado.`, m);
            }
            
            authData.used = true;
            global.authCodeMap.set(targetCodeUpper, authData);
            
            if (global.usedNumbers.has(targetNumberClean)) {
                return conn.reply(m.chat, `⚠️ *ADVERTENCIA*: El número *${targetNumberClean}* ya está en uso.`, m);
            }
            
            global.usedNumbers.add(targetNumberClean);

            const sessionID = `${global.ACCESS_SESSION_PREFIX}${targetNumberClean}`;
            const sessionPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', global.sessions, sessionID);
            
            const { state, saveState, saveCreds } = await useMultiFileAuthState(sessionPath);
            
            const connectionOptionsJadibot = {
                logger: Pino({ level: 'silent' }),
                printQRInTerminal: false, // Ahora el QR va por mensaje, no por terminal
                mobile: true, // Debe ser móvil para emparejar por código de 8 dígitos
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
            
            subConn.numberConn = targetNumberClean;
            subConn.saveCreds = saveCreds;
            global.conns.set(subConn.user.jid, subConn);
            
            subConn.ev.on('connection.update', global.connectionUpdateJadibot.bind(subConn));
            subConn.ev.on('creds.update', subConn.saveCreds.bind(subConn, true));
            
            await global.subreloadHandler(false);

            // Iniciar solicitud de código de emparejamiento (8 dígitos)
            let codeBot = await subConn.requestPairingCode(targetNumberClean)
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
            
            conn.reply(m.chat, 
                `✅ *VINCULACIÓN INICIADA*\n\n` +
                `*Número:* ${targetNumberClean}\n\n` +
                `El usuario debe usar el siguiente código *dentro de WhatsApp* (Dispositivos Vinculados > Vincular con número de teléfono):\n\n` +
                `*Código de Emparejamiento (8 dígitos):* \n\n` +
                `*${codeBot}*`, m);
            
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
}

handler.command = ['crear_acceso', 'vincular', 'conexiones', 'setassistant']
handler.rowner = true

export default handler
