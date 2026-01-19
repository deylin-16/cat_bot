import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

const BASE_URL = 'https://downr.org'
const INFO_API = `${BASE_URL}/.netlify/functions/video-info`
const DOWNLOAD_API = `${BASE_URL}/.netlify/functions/youtube-download`
const ANALYTICS_API = `${BASE_URL}/.netlify/functions/analytics`

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://downr.org',
  'Referer': 'https://downr.org/',
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9'
}

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function initSession() {
  try {
    await client.get(ANALYTICS_API, { headers })
  } catch (_) {
  }
}

async function fetchVideoInfo(url) {
  let videoData = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const infoResponse = await client.post(
        INFO_API,
        { url },
        { headers }
      )
      videoData = infoResponse.data
      break
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data === 'user_retry_required') {
        await sleep(2000)
        continue
      }
      throw error
    }
  }
  return videoData
}

function buildTasks(url, videoData) {
  const mediaList = videoData?.medias || []
  const video240p = mediaList.find(m => m.quality === '240p' && m.type === 'video')
  const audioSource = mediaList.find(m => m.type === 'audio')

  const tasks = []
  if (video240p) {
    tasks.push({
      type: 'video',
      name: 'Video MP4 (240p)',
      payload: { url, downloadMode: 'auto', videoQuality: '240p' }
    })
  }
  if (audioSource) {
    tasks.push({
      type: 'audio',
      name: 'Audio MP3 (128kbps)',
      payload: { url, downloadMode: 'audio', videoQuality: '128' }
    })
  }
  return tasks
}

async function requestDownload(task) {
  const downloadResponse = await client.post(DOWNLOAD_API, task.payload, { headers })
  return downloadResponse.data
}

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const url = (text || args?.[0] || '').trim()
  if (!url) {
    return conn.reply(m.chat, `Uso: ${usedPrefix + command} <url>`, m)
  }

  await m.react?.('⏳')

  try {
    await initSession()
    const videoData = await fetchVideoInfo(url)

    if (!videoData) {
      await m.react?.('❌')
      return conn.reply(m.chat, 'No se pudo obtener metadata del video.', m)
    }

    const tasks = buildTasks(url, videoData)
    if (!tasks.length) {
      await m.react?.('❌')
      return conn.reply(m.chat, 'No se encontraron formatos disponibles.', m)
    }

    let results = {
      status: 'success',
      title: videoData.title,
      author: videoData.author,
      thumbnail: videoData.thumbnail,
      links: []
    }

    for (const task of tasks) {
      try {
        const data = await requestDownload(task)
        if (data?.url) {
          results.links.push({
            type: task.type,
            name: task.name,
            download_url: data.url
          })
        }
      } catch (error) {
        console.error(`Error en task ${task.name}:`, error?.message)
      }
    }

    if (results.links.length === 0) {
      await m.react?.('❌')
      return conn.reply(m.chat, 'No se pudieron generar links de descarga.', m)
    }

    await conn.reply(m.chat, JSON.stringify(results, null, 2), m)
    await m.react?.('✅')

  } catch (error) {
    await m.react?.('❌')
    console.error('Downr error:', error?.response?.data || error?.message)
    return conn.reply(m.chat, '❌ Error al procesar Downr.', m)
  }
}

handler.help = ['downrraw <url>']
handler.tags = ['dl']
handler.command = /^(downrraw|downrorg|downrlink)$/i

export default handler
