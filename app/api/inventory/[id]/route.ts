import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, WRITE_ROLES } from '@/lib/auth-middleware'
import { updateItem, deleteItem } from '@/lib/services/inventory.service'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const item = await updateItem(params.id, body)
  return NextResponse.json(item)
}, WRITE_ROLES)

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await deleteItem(params.id)
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
