import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { deleteLog } from '@/lib/services/fuel.service'

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: any }) => {
  const { id } = await params
  try {
    await deleteLog(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e === 'NOT_FOUND') return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    throw e
  }
}, ['ADMIN'])
