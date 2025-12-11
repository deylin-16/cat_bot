process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { watchFile, unwatchFile, readdirSync, unlinkSync, readFileSync, watch } from 'fs';
import yargs from 'yargs/yargs';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform, exit } from 'process';
import * as ws from 'ws';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import pino from 'pino';
import path, { join } from 'path';
import { Boom } from '@hapi/boom';
import { Low, JSONFile } from 'lowdb';
import store from './lib/store.js';
import pkg from 'google-libphonenumber';
import readline from 'readline';
import NodeCache from 'node-cache';
import os from 'os';
import cp from 'child_process';
import cfonts from 'cfonts';
import { randomBytes } from 'crypto'; 

const { WAProto: proto, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser, makeWASocket } = await import('@whiskeysockets/baileys');
const { fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');

const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const fs = await import('fs'); 

global.sessions = 'sessions';
global.botNumber = global.botNumber || '';

let { say } = cfonts;

const WAProtoType = proto.Message.prototype;

function protoType() {
    Object.assign(WAProtoType, {
        async delete(conn) {
            await conn.sendMessage(this.chat, { delete: this.key });
        },
        reply: function(text, chat, options) {
            return global.conn.sendMessage(chat ? chat : this.chat, { text: text }, { quoted: this, ...options });
        },
    });
}

function serialize(conn) {
    if (!conn) return;

    if (!conn.normalizeJid) {
        conn.normalizeJid = jid => {
            return jidNormalizedUser(jid);
        };
    }

    if (!conn.generateMessageTag) {
        conn.generateMessageTag = () => String(randomBytes(3).readUIntBE(0, 3)).padStart(6, 0);
    }
}

console.log(chalk.bold.redBright(`\n Iniciando programa... \n`));
say('WhatsApp-bot', { font: 'block', align: 'center', colors: ['magentaBright'] });
say(`Developed By • Deylin`, { font: 'console', align: 'center', colors: ['blueBright'] });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');

global.timestamp = { start: new Date };

process.on('uncaughtException', (err) => {
    console.error(chalk.bold.bgRed('❌ ERROR CRÍTICO NO CAPTURADO (uncaughtException) ❌'));
    console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.bold.bgRed('❌ PROMESA RECHAZADA NO MANEJADA (unhandledRejection) ❌'));
    console.error('Razón:', reason);
    console.error('Promesa:', promise);
});

console.info = () => {};
console.debug = () => {};

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#/!]|[\\p{So}]', 'u');

global.db = new Low(/https?:\/\//.test(global.opts['db'] || '') ? new cloudDBAdapter(global.opts['db']) : new JSONFile('./lib/1.json'));

global.DATABASE = global.db;
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve) => {
            const check = setInterval(async function() {
                if (!global.db.READ) {
                    clearInterval(check);
                    resolve(global.db.data);
                }
            }, 100);
        });
    }

    if (global.db.data !== null) return global.db.data;

    global.db.READ = true;

    try {
        await global.db.read();

        const defaultData = {
            users: {},
            chats: {},
            stats: {},
            msgs: {},
            sticker: {},
            settings: {},
        };

        global.db.data = {
            ...defaultData,
            ...(global.db.data || {}),
        };

        global.db.chain = chain(global.db.data);
        console.log(chalk.bold.greenBright('✅ Base de datos cargada con éxito.'));
    } catch (error) {
        console.error(chalk.bold.bgRed('⚠️ ERROR: No se pudo cargar o inicializar la Base de Datos.'), error);
        exit(1);
    } finally {
        global.db.READ = null;
    }
    return global.db.data;
};

await loadDatabase();

const { state, saveState, saveCreds } = await useMultiFileAuthState(global.sessions);
const msgRetryCounterCache = new NodeCache();
const { version } = await fetchLatestBaileysVersion();
const MethodMobile = process.argv.includes("mobile");

const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    mobile: MethodMobile,
    browser: ['Ubuntu', 'Edge', '110.0.1587.56'],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (clave) => {
        let jid = jidNormalizedUser(clave.remoteJid);
        let msg = await store.loadMessage(jid, clave.id).catch(() => null);
        return msg?.message || "";
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
    version,
};

global.conn = makeWASocket(connectionOptions);
global.conn.isInit = false;
global.isConnecting = false;

protoType();
serialize(global.conn);

if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
    if (!global.conn.authState.creds.registered) {
        let addNumber;
        do {
            global.botNumber = await question(chalk.bgBlack(chalk.bold.greenBright(` Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright(` Ejemplo: 57321×××××××`)}\n${chalk.bold.magentaBright('---> ')}`)));
            global.botNumber = global.botNumber.replace(/\D/g, '');
            if (!global.botNumber.startsWith('+')) {
                global.botNumber = `+${global.botNumber}`;
            }
        } while (!await isValidPhoneNumber(global.botNumber));
        rl.close();

        addNumber = global.botNumber.replace(/\D/g, '');

        setTimeout(async () => {
            try {
                let codeBot = await global.conn.requestPairingCode(addNumber);
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white(chalk.bgMagenta(` CÓDIGO DE VINCULACIÓN `)), chalk.bold.white(chalk.white(codeBot)));
            } catch (e) {
                console.error(chalk.bold.bgRed('❌ ERROR al solicitar Pairing Code. Reintente.'), e);
            }
        }, 3000);
    }
}

let isHandlerActive = false;

async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update;
    global.stopped = connection;

    if (isNewLogin) global.conn.isInit = true;

    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

    if (connection === 'open') {
        if (!global.conn.isInit) {
            global.conn.isInit = true;
            console.log(chalk.bold.green('🟢 Conectado con éxito.'));
        }
        global.timestamp.connect = new Date;
        global.isConnecting = false;

        if (global.conn.user?.jid && !isHandlerActive) {
            
            if (global.conn.ev.listeners('messages.upsert').length === 0) {
                 // **ESTE BLOQUE YA NO ES NECESARIO AQUÍ. SE MUEVE AL FINAL PARA GARANTIZAR LA EJECUCIÓN.**
            }
            
            isHandlerActive = true;
        } else if (!global.conn.user?.jid) {
            setTimeout(() => connectionUpdate(update), 1000);
        }
        return;
    }

    if (connection === 'close') {
        global.isConnecting = true;

        if (isHandlerActive) {
            global.conn.ev.off('messages.upsert', global.conn.handler);
            isHandlerActive = false;
        }

        if (reason && reason !== DisconnectReason.loggedOut && reason !== DisconnectReason.badSession && reason !== DisconnectReason.connectionReplaced) {

            if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut || reason === DisconnectReason.restartRequired) {

                const message = {
                    [DisconnectReason.connectionClosed]: 'CONEXION CERRADA. RECONECTANDO...',
                    [DisconnectReason.connectionLost]: 'CONEXIÓN PERDIDA CON EL SERVIDOR. RECONECTANDO...',
                    [DisconnectReason.timedOut]: 'TIEMPO DE CONEXIÓN AGOTADO. RECONECTANDO...',
                    [DisconnectReason.restartRequired]: 'REINICIO REQUERIDO. CONECTANDO AL SERVIDOR...',
                }[reason];

                console.log(chalk.bold.magentaBright(`\n${message}`));

                const retryDelay = 5000;
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                await global.reloadHandler(true).catch(console.error);

            } else {
                console.log(chalk.bold.redBright(`\n⚠︎ RAZON DE DESCONEXIÓN DESCONOCIDA: ${reason || 'No encontrado'}. Reintente manualmente o espere.`));
            }

        } else {
            const criticalMessage = {
                [DisconnectReason.loggedOut]: `⚠︎ SIN CONEXIÓN, BORRE LA CARPETA ${global.sessions} Y VINCULE EL CÓDIGO DE TEXTO ⚠︎`,
                [DisconnectReason.badSession]: `⚠︎ SESIÓN INVÁLIDA, BORRE LA CARPETA ${global.sessions} Y VINCULE EL CÓDIGO DE TEXTO ⚠︎`,
                [DisconnectReason.connectionReplaced]: `⚠︎ CONEXIÓN REEMPLAZADA. DEBE CERRAR LA SESIÓN EN OTRO LADO.`,
            }[reason] || `⚠︎ DESCONEXIÓN CRÍTICA (${reason}). REINICIO RECOMENDADO.`;

            console.log(chalk.bold.redBright(criticalMessage));

        }
    }

    if (global.db.data == null) await loadDatabase().catch(console.error);
}

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function(restatConn) {
    console.log(chalk.bold.yellow('Recargando Handler...'));
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
    } catch (e) {
        console.error(chalk.bold.bgRed('❌ ERROR al cargar el handler:'), e);
    }

    if (restatConn) {
        const oldChats = global.conn.chats;
        try {
            global.conn.ws.close();
        } catch { }
        global.conn.ev.removeAllListeners();

        global.conn = makeWASocket(connectionOptions, { chats: oldChats });
        isInit = true;
    }

    if (!isInit) {
        global.conn.ev.off('messages.upsert', global.conn.handler);
        global.conn.ev.off('connection.update', global.conn.connectionUpdate);
        global.conn.ev.off('creds.update', global.conn.credsUpdate);
        isHandlerActive = false;
    }

    global.conn.handler = handler.handler.bind(global.conn);
    global.conn.connectionUpdate = connectionUpdate.bind(global.conn);
    global.conn.credsUpdate = saveCreds.bind(global.conn, true);

    global.conn.ev.on('connection.update', global.conn.connectionUpdate);
    global.conn.ev.on('creds.update', global.conn.credsUpdate);
    
    // CORRECCIÓN CRÍTICA: Asignación directa e inmediata del listener de mensajes
    if (global.conn.ev.listeners('messages.upsert').length === 0) {
        global.conn.ev.on('messages.upsert', global.conn.handler);
        isHandlerActive = true;
        console.log(chalk.bold.yellowBright('✅ Listener de mensajes asignado directamente al Handler.'));
    }

    isInit = false;
    return true;
};

const __dirname = global.__dirname(import.meta.url);
const pluginFolder = global.__dirname(join(__dirname, './plugins')); 
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
    console.log(chalk.bold.blueBright('Cargando Plugins...'));
    global.plugins = {};
    const pluginsDir = join(global.__dirname(import.meta.url), 'plugins');
    
    const readDirRecursive = (dir) => {
        const files = readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const filePath = join(dir, file.name);
            if (file.isDirectory()) {
                readDirRecursive(filePath);
            } else if (pluginFilter(file.name)) {
                try {
                    const module = import(pathToFileURL(filePath).href);
                    global.plugins[file.name] = (module.default || module);
                } catch (e) {
                    console.error(chalk.bold.red(`❌ ERROR al cargar plugin '${file.name}':`), e);
                }
            }
        }
    };
    
    readDirRecursive(pluginsDir);

    let loadedPlugins = {};
    for (const filename in global.plugins) {
         try {
            const module = await global.plugins[filename];
            loadedPlugins[filename] = module.default || module;
         } catch(e) {
            console.error(chalk.bold.red(`❌ ERROR final de carga en '${filename}':`), e);
         }
    }
    global.plugins = loadedPlugins;
    
    console.log(chalk.bold.greenBright(`✅ ${Object.keys(global.plugins).length} Plugins cargados.`));
}

global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = global.__filename(join(pluginFolder, filename), true);
        const exists = fs.existsSync(dir);

        if (filename in global.plugins && exists) {
            global.conn.logger.info(`🔄 Plugin actualizado - '${filename}'`);
        } else if (filename in global.plugins && !exists) {
            global.conn.logger.warn(`🗑️ Plugin eliminado - '${filename}'`);
            return delete global.plugins[filename];
        } else if (exists) {
            global.conn.logger.info(`✨ Nuevo plugin - '${filename}'`);
        } else {
            return;
        }

        const err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });

        if (err) {
            global.conn.logger.error(chalk.bold.bgRed(`❌ Error de sintaxis en '${filename}':\n${format(err)}`));
        } else {
            try {
                const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
                global.plugins[filename] = module.default || module;
            } catch (e) {
                global.conn.logger.error(chalk.bold.bgRed(`❌ Error de ejecución en plugin '${filename}':\n${format(e)}`));
            } finally {
                global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
            }
        }
    }
};

filesInit().then(() => {
    Object.freeze(global.reload);
    watch(pluginFolder, global.reload);
    global.reloadHandler();
}).catch(console.error);


if (!global.opts['test'] && global.db) {
    setInterval(async () => {
        if (global.db.data) await global.db.write().catch(e => console.error(chalk.bold.bgRed('❌ Error al escribir DB:'), e));
        if (global.opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp'], tmp.forEach((filename) => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])));
    }, 30 * 1000);
}

async function _quickTest() {
    const test = await Promise.all([
        spawn('ffmpeg'), spawn('ffprobe'), spawn('ffmpeg', ['-hide_banner', '...']),
        spawn('convert'), spawn('magick'), spawn('gm'), spawn('find', ['--version']),
    ].map((p) => {
        return Promise.race([
            new Promise((resolve) => { p.on('close', (code) => { resolve(code !== 127); }); }),
            new Promise((resolve) => { p.on('error', (_) => resolve(false)); })
        ]);
    }));
    const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
    const s = global.support = { ffmpeg, ffprobe, ffmpegWebp: ffmpeg, convert, magick, gm, find };
    Object.freeze(global.support);
    global.conn.logger.info(chalk.bold(`✦ H E C H O\n`.trim()));
}
_quickTest().catch(console.error);

function clearTmp() {
    const tmpDir = join(global.__dirname(import.meta.url), 'tmp');
    try {
        const filenames = readdirSync(tmpDir);
        filenames.forEach(file => {
            const filePath = join(tmpDir, file);
            unlinkSync(filePath);
        });
        console.log(chalk.bold.cyanBright(`\n╭» ❍ MULTIMEDIA ❍\n│→ ARCHIVOS DE LA CARPETA TMP ELIMINADAS\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`));
    } catch (e) { }
}

function purgeSession() {
    let prekey = [];
    let directorio = readdirSync(`./${global.sessions}`);
    let filesFolderPreKeys = directorio.filter(file => {
        return file.startsWith('pre-key-');
    });
    prekey = [...prekey, ...filesFolderPreKeys];
    filesFolderPreKeys.forEach(files => {
        unlinkSync(`./${global.sessions}/${files}`);
    });
}

function purgeOldFiles() {
    const directories = [`./${global.sessions}/`];
    directories.forEach(dir => {
        readdirSync(dir, (err, files) => {
            if (err) throw err;
            files.forEach(file => {
                if (file !== 'creds.json') {
                    const filePath = path.join(dir, file);
                    unlinkSync(filePath, err => {
                        if (err) {
                            console.log(chalk.bold.red(`\n╭» ❍ ARCHIVO ❍\n│→ ${file} NO SE LOGRÓ BORRAR\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ✘\n` + err));
                        } else {
                            console.log(chalk.bold.green(`\n╭» ❍ ARCHIVO ❍\n│→ ${file} BORRADO CON ÉXITO\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`));
                        }
                    });
                }
            });
        });
    });
}

setInterval(async () => {
    if (global.stopped === 'close' || !global.conn || !global.conn.user || global.isConnecting) return;
    await clearTmp();
}, 1000 * 60 * 4);

setInterval(async () => {
    if (global.stopped === 'close' || !global.conn || !global.conn.user || global.isConnecting) return;
    await purgeSession();
    console.log(chalk.bold.cyanBright(`\n╭» ❍ ${global.sessions} ❍\n│→ SESIONES NO ESENCIALES ELIMINADAS\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`));
}, 1000 * 60 * 10);

setInterval(async () => {
    if (global.stopped === 'close' || !global.conn || !global.conn.user || global.isConnecting) return;
    await purgeOldFiles();
    console.log(chalk.bold.cyanBright(`\n╭» ❍ ARCHIVOS ❍\n│→ ARCHIVOS RESIDUALES ELIMINADAS\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`));
}, 1000 * 60 * 10);

async function isValidPhoneNumber(number) {
    try {
        number = number.replace(/\s+/g, '');
        if (number.startsWith('+521')) {
            number = number.replace('+521', '+52');
        } else if (number.startsWith('+52') && number[4] === '1') {
            number = number.replace('+52 1', '+52');
        }
        const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
        return phoneUtil.isValidNumber(parsedNumber);
    } catch (error) {
        return false;
    }
}
