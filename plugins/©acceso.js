import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateCode = (length) => randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();

let handler = async (m, { conn, text, command, isROwner }) => {
    
    // Normalizar el comando para evitar problemas de mayúsculas/minúsculas
    const normalizedCommand = command ? command.toLowerCase() : '';

    if (!isROwner) {
        return m.reply('❌ Acceso denegado. Solo el Creador puede gestionar las conexiones.');
    }

    if (!global.dbSessions || !global.dbSessions.data) {
        return m.reply('❌ La base de datos de sesiones no está cargada correctamente.');
    }

    // --- CONECTAR ---
    if (normalizedCommand === 'conectar') {
        
        // Extraemos el texto después de la primera palabra (el comando)
        let numberToPair = text.trim().split(/\s+/).slice(1).join(' ').trim() || '';
        
        if (numberToPair.startsWith('+')) {
            numberToPair = numberToPair.substring(1).replace(/[^0-9]/g, '');
        } else {
            numberToPair = numberToPair.replace(/[^0-9]/g, '');
        }

        if (!numberToPair || numberToPair.length < 8) {
            return m.reply('⚠️ Uso: *jiji conectar [número de teléfono]*. Debe ser un número válido (ej: 573001234567).');
        }

        const sessionId = generateCode(6);
        const pairingCode = generateCode(8);
        const creatorCode = generateCode(4);

        global.dbSessions.data.paired_sessions[sessionId] = {
            number: numberToPair,
            pairingCode: pairingCode,
            creatorCode: creatorCode,
            status: 'PENDING',
            createdAt: Date.now()
        };
        await global.dbSessions.write();

        const responseText = `
✅ *NUEVA SESIÓN GENERADA*

*ID de Sesión (Creator):* ${sessionId}
*Número a Vincular:* +${numberToPair}

*PASOS PARA EL USUARIO:*
1. El usuario debe abrir WhatsApp Web en su navegador.
2. El usuario debe ejecutar el siguiente comando en el chat privado con tu bot principal:
   jiji vincular ${numberToPair} ${pairingCode}

*CÓDIGO DE EMPAREJAMIENTO (8 DÍGITOS):*
*${pairingCode}*

*CÓDIGO DE ELIMINACIÓN (4 DÍGITOS - INTERNO):*
*${creatorCode}*
        `;

        return m.reply(responseText.trim());
    }

    // --- VINCULAR ---
    if (normalizedCommand === 'vincular') {
        if (isROwner) return m.reply('Este comando es para el cliente, no para ti, Creador.');

        const args = text.trim().split(/\s+/).slice(1);
        const [clientNumber, clientCode] = args;

        if (!clientNumber || !clientCode || clientCode.length !== 8) {
            return m.reply('❌ Uso inválido. El formato es: *jiji vincular [número] [código de 8 dígitos]*');
        }
        
        let clientNumberClean = clientNumber.replace(/[^0-9]/g, '');
        if (clientNumber.startsWith('+')) clientNumberClean = clientNumber.substring(1).replace(/[^0-9]/g, '');
        
        const sessionEntry = Object.entries(global.dbSessions.data.paired_sessions)
            .find(([id, session]) => 
                session.number === clientNumberClean && 
                session.pairingCode === clientCode.toUpperCase() && 
                session.status === 'PENDING'
            );

        if (!sessionEntry) {
            const rejectionMessage = '❌ Solicitud de conexión rechazada. Número o código incorrecto. Su número ha sido marcado como intento de acceso no autorizado.';
            
            return m.reply(rejectionMessage);
        }

        const [sessionId, sessionData] = sessionEntry;

        sessionData.status = 'CONNECTED';
        await global.dbSessions.write();

        return m.reply(`
✅ *Conexión Exitosa*

El código ${sessionData.pairingCode} es correcto.
La sesión *${sessionId}* ha sido marcada como activa. El bot secundario se conectará pronto.
        `);
    }

    // --- ELIMINAR_CONEXION ---
    if (normalizedCommand === 'eliminar_conexion') {
        const args = text.trim().split(/\s+/).slice(1);
        const [sessionId, creatorCode] = args;

        if (!sessionId || !creatorCode || creatorCode.length !== 4) {
            return m.reply('⚠️ Uso: *jiji eliminar_conexion [ID de Sesión] [Código de 4 dígitos]*.');
        }

        const session = global.dbSessions.data.paired_sessions[sessionId.toUpperCase()];

        if (!session) {
            return m.reply(`❌ Sesión con ID ${sessionId} no encontrada.`);
        }

        if (session.creatorCode !== creatorCode.toUpperCase()) {
            return m.reply('❌ Código de eliminación incorrecto. No se puede proceder.');
        }

        const sessionPath = join(global.sessions, `${sessionId.toUpperCase()}-creds.json`);
        
        if (existsSync(sessionPath)) {
             try {
                unlinkSync(sessionPath);
                console.error(`Archivo de credenciales eliminado para la sesión: ${sessionId}`);
                m.reply(`🗑️ Se eliminó el archivo de credenciales para la sesión ${sessionId}.`);
             } catch (e) {
                console.error(e);
                m.reply(`⚠️ Error al borrar el archivo físico de credenciales, pero la base de datos se actualizará.`);
             }
        }
        
        delete global.dbSessions.data.paired_sessions[sessionId.toUpperCase()];
        await global.dbSessions.write();

        return m.reply(`
🗑️ *SESIÓN ELIMINADA*

La conexión *${sessionId}* ha sido eliminada por el Creador.
Número: +${session.number}
        `);
    }
}

handler.command = ['conectar', 'vincular', 'eliminar_conexion'];
handler.owner = true;
handler.group = false;

export default handler
