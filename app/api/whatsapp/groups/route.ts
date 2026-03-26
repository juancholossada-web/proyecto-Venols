import { NextResponse } from 'next/server'
import { getWAState } from '@/lib/whatsapp-client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getWAState()

  if (!state.client || state.status !== 'connected') {
    return NextResponse.json({ error: 'WhatsApp no está conectado' }, { status: 400 })
  }

  const chats = await state.client.getChats()
  const groups = chats
    .filter((c) => c.id._serialized.endsWith('@g.us'))
    .map((c) => ({ id: c.id._serialized, name: c.name || c.id._serialized }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json(groups)
}
