import { NextResponse } from 'next/server'
import { getWAState, initWhatsApp } from '@/lib/whatsapp-client'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getWAState()

  if (state.status === 'disconnected') {
    initWhatsApp().catch(console.error)
    return NextResponse.json({ status: 'loading' })
  }

  if (state.status === 'qr' && state.qr) {
    const qrDataUrl = await QRCode.toDataURL(state.qr, { width: 280 })
    return NextResponse.json({ status: 'qr', qr: qrDataUrl })
  }

  return NextResponse.json({ status: state.status })
}
