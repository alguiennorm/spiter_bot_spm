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
import config from './utils.js' // o './utils.mjs' si cambias la extensión

// Reemplazo para __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const adminData = JSON.parse(fs.readFileSync(path.join(__dirname, 'admins.json'), 'utf-8'))
const adminIDs = adminData.admins

// Logging via pino
const logDir = path.join(__dirname, "logs")
if (!fs.existsSync(logDir)) { fs.mkdirSync(logDir) }
const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)

const logger = P(
  {
    level: config.logging?.level || "info",
    transport: { target: "pino-pretty" }
  },
  P.destination(logFile)
);

// ✅ Carga dinámica de eventos y comandos con `import()` (reemplazo de require)
const loadEventHandlers = async () => {
  const eventsPath = path.join(__dirname, 'events')
  const eventFiles = fs.existsSync(eventsPath) ? fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')) : []
  const eventHandlers = []

  for (const file of eventFiles) {
    const { default: eventModule } = await import(`./events/${file}`)
    if (eventModule.eventName && typeof eventModule.handler === "function") {
      eventHandlers.push(eventModule)
    }
  }

  return eventHandlers
}

const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands')
  const commandFiles = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')) : []
  const commands = new Map()

  for (const file of commandFiles) {
    const { default: cmd } = await import(`./commands/${file}`)
    commands.set(cmd.name, cmd)
  }

  return commands
}

const startSock = async () => {
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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(await QRCode.toString(qr, { type: 'terminal', small: true }))
    }

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
    }
  })

  // Cargar comandos y eventos
  const commands = await loadCommands()
  const eventHandlers = await loadEventHandlers()

  // ✅ Listener para comandos
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const isCommand = body.startsWith('.')

    if (isCommand) {
  const args = body.slice(1).trim().split(/ +/)
  const commandName = args.shift()?.toLowerCase()

  const command = commands.get(commandName)

  // 🔐 Obtener ID del usuario (en grupo o privado)
  const sender = msg.key.participant || msg.key.remoteJid

  // 🔒 Verificar si el remitente está en la lista de admins
  const isAdmin = adminIDs.includes(sender)

  if (!isAdmin) {
    await sock.sendMessage(from, { text: '🚫 No tienes permiso para usar comandos.' })
    logger.warn(`⛔ Usuario no autorizado: ${sender} intentó usar el comando: ${commandName}`)
    return
  }

  if (command) {
    try {
      await command.execute(sock, from, args)
      logger.info(`✅ Comando ejecutado: ${commandName} desde ${sender}`)
    } catch (err) {
      logger.error(`❌ Error ejecutando ${commandName}: ${err}`)
      await sock.sendMessage(from, { text: '⚠️ Ocurrió un error al ejecutar el comando.' })
    }
  } else {
    await sock.sendMessage(from, { text: `❓ Comando no reconocido: *${commandName}*` })
  }
}

  })
}


startSock()
