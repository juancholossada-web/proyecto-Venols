import { Client, LocalAuth } from 'whatsapp-web.js'

type WAStatus = 'loading' | 'qr' | 'connected' | 'disconnected'

interface WAState {
  client: Client | null
  status: WAStatus
  qr: string | null
}

// Global singleton — sobrevive hot reloads de Next.js
const g = global as typeof global & { _wa?: WAState }

export function getWAState(): WAState {
  if (!g._wa) {
    g._wa = { client: null, status: 'disconnected', qr: null }
  }
  return g._wa
}

export async function initWhatsApp(): Promise<void> {
  const state = getWAState()

  if (
    state.client &&
    (state.status === 'connected' || state.status === 'loading' || state.status === 'qr')
  ) {
    return
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  })

  state.client = client
  state.status = 'loading'
  state.qr = null

  client.on('qr', (qr) => {
    state.qr = qr
    state.status = 'qr'
  })

  client.on('ready', () => {
    state.status = 'connected'
    state.qr = null
  })

  client.on('auth_failure', () => {
    state.status = 'disconnected'
    state.client = null
    state.qr = null
  })

  client.on('disconnected', () => {
    state.status = 'disconnected'
    state.client = null
    state.qr = null
  })

  client.initialize().catch(() => {
    state.status = 'disconnected'
    state.client = null
    state.qr = null
  })
}

export async function sendToGroup(groupId: string, message: string): Promise<void> {
  const state = getWAState()
  if (!state.client || state.status !== 'connected') {
    throw new Error('WhatsApp no está conectado')
  }
  await state.client.sendMessage(groupId, message)
}
