import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys'
import P from 'pino'
import path from 'path'
import fs from 'fs'
import QRCode from 'qrcode'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import config from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer y parsear adminIDs solo una vez y usar Set para búsquedas O(1)
const adminDataRaw = fs.readFileSync(path.join(__dirname, 'admins.json'), 'utf-8')
const adminIDs = new Set(JSON.parse(adminDataRaw).admins)

// Logging vía pino, usando un solo destino para evitar overhead
const logDir = path.join(__dirname, "logs")
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)
const logger = P({
  level: config.logging?.level || "info",
  transport: { target: "pino-pretty" }
}, P.destination(logFile))

// Cargar comandos y eventos solo una vez al inicio, sin await en el listener
const cachedCommands = new Map()
const cachedEventHandlers = []

async function preloadModules() {
  // Preload commands
  const commandsPath = path.join(__dirname, 'commands')
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
    for (const file of files) {
      const { default: cmd } = await import(`./commands/${file}`)
      cachedCommands.set(cmd.name, cmd)
    }
  }

  // Preload events
  const eventsPath = path.join(__dirname, 'events')
  if (fs.existsSync(eventsPath)) {
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))
    for (const file of files) {
      const { default: eventModule } = await import(`./events/${file}`)
      if (eventModule.eventName && typeof eventModule.handler === "function") {
        cachedEventHandlers.push(eventModule)
      }
    }
  }
}

const startSock = async () => {
  await preloadModules()

  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ["HKRELHR", "Opera GX", "120.0.5543.204"],
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: config.bot?.online ?? true,
    syncFullHistory: config.bot?.history ?? false,
    shouldSyncHistoryMessage: () => config.bot?.history ?? false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) console.log(await QRCode.toString(qr, { type: 'terminal', small: true }))

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log('Desconectado con código:', code)

      if (code === DisconnectReason.restartRequired) {
        console.log('Reiniciando conexión...')
        startSock()
      }
    }

    if (connection === 'open') {
      console.log('✅ Conexión establecida exitosamente')
      console.log('📱 Número del bot:', sock.user.id)
    }
  })

  // Listener para comandos optimizado
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    // Extraer el texto del mensaje de la forma más rápida posible
    const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    if (!messageContent.startsWith('.')) return

    const timerLabel = `⏱️ Command ${messageContent} - ${msg.key.id}`
    console.time(timerLabel)

    // Parsear comando y args
    const args = messageContent.slice(1).trim().split(/\s+/)
    const commandName = args.shift()?.toLowerCase()
    const command = cachedCommands.get(commandName)

    // Obtener remitente
    const sender = msg.key.participant || msg.key.remoteJid

    if (!adminIDs.has(sender)) {
      await sock.sendMessage(from, { text: '🚫 No tienes permiso para usar comandos.' })
      logger.warn(`⛔ Usuario no autorizado: ${sender} intentó usar el comando: ${commandName}`)
      console.timeEnd(timerLabel)
      return
    }

    if (!command) {
      await sock.sendMessage(from, { text: `❓ Comando no reconocido: *${commandName}*` })
      console.timeEnd(timerLabel)
      return
    }

    try {
      // Ejecutar comando sin await para evitar bloqueo si el comando no es dependiente de la respuesta inmediata
      await command.execute(sock, from, args)
      logger.info(`✅ Comando ejecutado: ${commandName} desde ${sender}`)
    } catch (error) {
      logger.error(`❌ Error ejecutando ${commandName}: ${error}`)
      await sock.sendMessage(from, { text: '⚠️ Ocurrió un error al ejecutar el comando.' })
    } finally {
      console.timeEnd(timerLabel)
    }
  })
}

startSock()