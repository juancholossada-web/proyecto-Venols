import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, WRITE_ROLES } from '@/lib/auth-middleware'
import { getVessel, updateVessel } from '@/lib/services/vessel.service'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const vessel = await getVessel(params.id)
  if (!vessel) return NextResponse.json({ error: 'Embarcación no encontrada' }, { status: 404 })
  return NextResponse.json(vessel)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const vessel = await updateVessel(params.id, body)
  return NextResponse.json(vessel)
}, WRITE_ROLES)
