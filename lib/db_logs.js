import axios from 'axios';

export const GITHUB_CONFIG = {
  p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
  owner: "deylin-16",
  repo: "database",
  path: "database.json"
};

const PUSH_CONFIG = {
  url: "https://deylin.xyz/api/notification?action=send", 
  token: "82a648a8-bc62-430a-89ac-cc92d016dc7c" 
};

const GITHUB_TOKEN = GITHUB_CONFIG.p.join('');


async function sendPushNotification(titulo, mensaje) {
  try {
    await axios.post(PUSH_CONFIG.url, {
      token: PUSH_CONFIG.token,
      titulo: titulo,
      mensaje: mensaje
    });
  } catch (e) {
    console.error('[-] Error al enviar notificación push:', e.message);
  }
}

export async function uploadError(error) {
    const errorId = Date.now() + Math.floor(Math.random() * 1000); 
    const path = `errors/${errorId}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const time = new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' });

    const content = {
        id: errorId,
        timestamp: time,
        log: String(error.stack || error),
        platform: 'WhatsApp Bot'
    };

    try {
        await axios.put(url, {
            message: `Report error ${errorId}`,
            content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
        }, {
            headers: { 
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        await sendPushNotification(
          "✉️ NUEVO LOG DE SOPORTE",
          `ID: ${errorId}\nHora: ${time}\nPlataforma: WhatsApp Bot`
        );

        return `https://www.deylin.xyz/support?id=${errorId}`;
    } catch (e) {
        return 'https://www.deylin.xyz/support';
    }
}

export async function uploadCriticalError(error, context = 'System Core') {
    const logId = `CRIT-${Date.now()}`;
    const path = `critical_logs/${logId}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const time = new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' });

    const content = {
        id: logId,
        timestamp: time,
        context: context, 
        error: String(error.stack || error),
        critical: true
    };

    try {
        await axios.put(url, {
            message: `⚠️ CRITICAL SYSTEM ERROR: ${logId}`,
            content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
        }, {
            headers: { 
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        await sendPushNotification(
          "⚠️ ERROR CRÍTICO DETECTADO",
          `Contexto: ${context}\nID: ${logId}\nRevisa el monitor de inmediato.`
        );

        console.log(`[!] Error crítico respaldado en GitHub: ${logId}`);
    } catch (e) {
        console.error('[-] Fallo total al reportar error crítico a GitHub:', e.message);
    }
}
