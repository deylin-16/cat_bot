import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import chalk from 'chalk'

const isNumber = x => typeof x === 'number' && !isNaN(x)

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now()
    const conn = this

if (m.isBaileys || (global.opts && global.opts['nyimak'] && !isOwner)) return


    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return

    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    const chatJid = m.key.remoteJid
    const mainBotJid = global.conn?.user?.jid
    const isSubAssistant = conn.user.jid !== mainBotJid

    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' }
        const chatData = global.db.data.chats[chatJid]
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender || m.key.participant)
        if (chatData?.primaryBot && chatData.primaryBot !== conn.user.jid && !isROwner) return
    }

    m = smsg(conn, m) || m
    if (!m) return

    conn.processedMessages = conn.processedMessages || new Map()
    if (conn.processedMessages.has(m.key.id)) return
    conn.processedMessages.set(m.key.id, Date.now())
    if (conn.processedMessages.size > 100) conn.processedMessages.delete(conn.processedMessages.keys().next().value)

    try {
        const senderJid = m.sender
        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {}
        let user = global.db.data.users[senderJid]

        if (user) {
            if (!isNumber(user.exp)) user.exp = 0
            if (!isNumber(user.coin)) user.coin = 0
            if (!('muto' in user)) user.muto = false 
        }

        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + (m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net')).includes(senderJid)
        const isOwner = isROwner || m.fromMe

        if (m.isBaileys || (opts['nyimak'] && !isOwner)) return
        if (typeof m.text !== 'string') m.text = ''

        let groupMetadata, participants, isAdmin, isBotAdmin
        if (m.isGroup) {
            groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
            participants = groupMetadata.participants || []
            isAdmin = (participants.find(p => p.id === senderJid))?.admin || false
            isBotAdmin = !!(participants.find(p => p.id === conn.user.jid))?.admin
        }

        const _prefix = global.prefix || /^[#!./]/
        const match = _prefix instanceof RegExp ? _prefix.exec(m.text) : Array.isArray(_prefix) ? _prefix.find(p => m.text.startsWith(p)) : m.text.startsWith(_prefix) ? _prefix : null
        
        let usedPrefix = _prefix instanceof RegExp ? (match ? match[0] : '') : (match || '')
        let noPrefix = m.text.replace(usedPrefix, '').trim()
        let [command, ...args] = noPrefix.split(/\s+/).filter(v => v)
        command = (command || '').toLowerCase()

        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant })) continue
            }

            if (typeof plugin !== 'function') continue

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             typeof plugin.command === 'string' ? plugin.command === command : false

            if (!isAccept) continue

            m.plugin = name
            if (global.db.data.chats[m.chat]?.isBanned && !isROwner) return

            if (plugin.rowner && !isROwner) { global.dfail('rowner', m, conn); continue }
            if (plugin.owner && !isOwner) { global.dfail('owner', m, conn); continue }
            if (plugin.group && !m.isGroup) { global.dfail('group', m, conn); continue }
            if (plugin.admin && !isAdmin) { global.dfail('admin', m, conn); continue }
            if (plugin.botAdmin && !isBotAdmin) { global.dfail('botAdmin', m, conn); continue }
            if (plugin.subBot && !isSubAssistant && !isROwner) { global.dfail('subBot', m, conn); continue }

            m.isCommand = true
            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text: args.join(' '), conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant })
            } catch (e) {
                m.error = e
                m.reply(format(e))
            }
        }
    } catch (e) { console.error(e) }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `Solo Deylin.`,
        owner: `Solo Deylin.`,
        group: `Solo en grupos.`,
        admin: `Solo admins.`,
        botAdmin: `Dame admin.`,
        subBot: `Solo sub-bot.`
    }[type]
    if (msg) conn.reply(m.chat, msg, m)
}
