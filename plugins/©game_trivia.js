import fs from 'fs'

let handler = async (m, { conn, command }) => {
    conn.trivia = conn.trivia ? conn.trivia : {}
    if (conn.trivia[m.chat]) return m.reply('Trivia activa.')

    let db = JSON.parse(fs.readFileSync('./db/trivia.json'))
    let list = db.sort(() => 0.5 - Math.random()).slice(0, 3)
    
    conn.trivia[m.chat] = {
        pos: 0,
        list,
        score: 0,
        msg: null
    }

    await nextQ(conn, m)
}

async function nextQ(conn, m) {
    if (!conn.trivia || !conn.trivia[m.chat]) return
    let t = conn.trivia[m.chat]
    let q = t.list[t.pos]
    let txt = `*TRIVIA ${t.pos + 1}/3*\n\n`
    txt += `*${q.pregunta}*\n\n`
    txt += q.opciones.map((v, i) => `${i + 1}. ${v}`).join('\n')
    t.msg = await conn.reply(m.chat, txt, m)
}

handler.before = async function (m) {
    if (!this.trivia || !this.trivia[m.chat] || !m.text) return
    
    let t = this.trivia[m.chat]
    let cur = t.list[t.pos]
    
    if (m.text.toLowerCase() === cur.respuesta.toLowerCase()) {
        t.score++
        t.pos++
        await m.reply('✅ Correcto')
        if (t.pos < 3) return nextQ(this, m)
        await m.reply(`*Fin*\nPuntos: ${t.score}/3`)
        delete this.trivia[m.chat]
    } else if (t.msg && m.quoted && m.quoted.id === t.msg.id) {
        t.pos++
        await m.reply(`❌ No. Era: ${cur.respuesta}`)
        if (t.pos < 3) return nextQ(this, m)
        await m.reply(`*Fin*\nPuntos: ${t.score}/3`)
        delete this.trivia[m.chat]
    }
}

handler.command = /^(trivia|triv)$/i
export default handler
