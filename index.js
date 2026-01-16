process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path from 'path';
import chalk from 'chalk';
import express from 'express';
import cors from 'cors';

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

const PORT = process.env.PORT || 3000;
const app = express().use(cors()).use(express.json());

import { startBot } from './main.js';

app.get('/api/get-pairing-code', async (req, res) => {
    let { number } = req.query; 
    if (!number) return res.status(400).send({ error: "Número requerido" });
    try {
        const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
        const code = await assistant_accessJadiBot({ m: null, conn: global.conn, phoneNumber: number.replace(/\D/g, ''), fromCommand: false, apiCall: true }); 
        res.status(200).send({ code });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.listen(PORT, () => {
    console.log(chalk.cyanBright(`[SERVER] Puerto activo: ${PORT}`));
    startBot();
});
