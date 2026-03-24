import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader, hashToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sseClients } from '@/lib/events'

/**
 * SSE endpoint — solo ADMIN se conecta para recibir eventos en tiempo real.
 * GET /api/events
 * Header: Authorization: Bearer <token>
 */
export async function GET(req: NextRequest) {
  // Autenticar
  const token = getTokenFromHeader(req.headers.get('authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
  }

  try {
    const payload = verifyToken(token)
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { status: true } } },
    })
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }
    // Solo ADMIN recibe el stream (operadores solo escriben)
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Registrar este cliente
      sseClients.add(controller)

      // Heartbeat cada 20 segundos para mantener la conexión viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`))
        } catch {
          clearInterval(heartbeat)
          sseClients.delete(controller)
        }
      }, 20_000)

      // Mensaje de bienvenida
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Stream activo' })}\n\n`)
      )

      // Limpiar al desconectar
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        sseClients.delete(controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
