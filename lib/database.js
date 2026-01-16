import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

global.db = new Low(new JSONFile('database.json'));

export async function loadDatabase() {
    if (global.db.data !== null) return;
    try {
        const { data: cloud } = await supabase.from('bot_data').select('content').eq('id', 'main_bot').maybeSingle();
        if (cloud) {
            global.db.data = cloud.content;
        } else {
            await global.db.read().catch(() => {});
            global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
        }
    } catch (e) {
        await global.db.read().catch(() => {});
        global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) };
    }
    global.db.chain = lodash.chain(global.db.data);
}

export async function saveDatabase() {
    if (!global.db.data) return;
    await global.db.write().catch(() => {});
    await supabase.from('bot_data').upsert({ id: 'main_bot', content: global.db.data, updated_at: new Date() }).catch(() => {});
}
