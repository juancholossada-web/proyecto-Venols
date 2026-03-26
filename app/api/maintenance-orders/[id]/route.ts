import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, WRITE_ROLES } from '@/lib/auth-middleware'
import { updateOrder, deleteOrder } from '@/lib/services/maintenance.service'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const order = await updateOrder(params.id, body)
  return NextResponse.json(order)
}, WRITE_ROLES)

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await deleteOrder(params.id)
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
