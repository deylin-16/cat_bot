import { makeWASocket, Browsers, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import pino from 'pino';

export async function getSocket(state, msgRetry, devCache) {
    const { version } = await fetchLatestBaileysVersion();
    return makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        version,
        msgRetryCounterCache: msgRetry,
        userDevicesCache: devCache,
        keepAliveIntervalMs: 30000,
        generateHighQualityLinkPreview: true
    });
}

export async function setupPairing(conn) {
    if (!fs.existsSync(`./sessions/creds.json`)) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const question = (t) => new Promise((r) => rl.question(t, r));
        let num = global.botNumber || await question(chalk.blueBright(`\n[ INPUT ] Ingrese el número:\n> `));
        let addNumber = num.replace(/\D/g, '');
        setTimeout(async () => {
            let code = await conn.requestPairingCode(addNumber);
            console.log(chalk.magentaBright(`\nCÓDIGO DE VINCULACIÓN: ${code?.match(/.{1,4}/g)?.join("-") || code}\n`));
            rl.close();
        }, 3000);
    }
}
