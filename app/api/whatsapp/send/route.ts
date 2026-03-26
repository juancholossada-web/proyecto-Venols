import { NextRequest, NextResponse } from 'next/server'
import { sendToGroup } from '@/lib/whatsapp-client'

export async function POST(req: NextRequest) {
  const { message, groupId } = await req.json()

  const targetGroup = groupId || process.env.WHATSAPP_GROUP_ID

  if (!targetGroup) {
    return NextResponse.json(
      { error: 'No se configuró el ID del grupo de WhatsApp. Agrega WHATSAPP_GROUP_ID en .env' },
      { status: 400 }
    )
  }

  try {
    await sendToGroup(targetGroup, message)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
