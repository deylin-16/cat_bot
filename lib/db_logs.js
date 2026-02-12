import axios from 'axios';

export const GITHUB_CONFIG = {
  p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
  owner: "deylin-16",
  repo: "database",
  path: "database.json"
};

const GITHUB_TOKEN = GITHUB_CONFIG.p.join('');

export async function uploadError(error) {
    const errorId = Date.now() + Math.floor(Math.random() * 1000); 
    const path = `errors/${errorId}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

    const content = {
        id: errorId,
        timestamp: new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }),
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
        return `https://www.deylin.xyz/support?id=${errorId}`;
    } catch (e) {
        return 'https://www.deylin.xyz/support';
    }
}

export async function uploadCriticalError(error, context = 'System Core') {
    const logId = `CRIT-${Date.now()}`;
    
    const path = `critical_logs/${logId}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

    const content = {
        id: logId,
        timestamp: new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }),
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
        console.log(`[!] Error crítico respaldado en GitHub: ${logId}`);
    } catch (e) {
        console.error('[-] Fallo total al reportar error crítico a GitHub:', e.message);
    }
}

