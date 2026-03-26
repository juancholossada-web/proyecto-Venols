import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, getFleetFilter, WRITE_ROLES } from '@/lib/auth-middleware'
import { listLogs, createLog } from '@/lib/services/fuel.service'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const logs = await listLogs({
    vesselId:    searchParams.get('vesselId'),
    fleetFilter: getFleetFilter(req.user!.role),
  })
  return NextResponse.json(logs)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const log = await createLog(body)
  return NextResponse.json(log, { status: 201 })
}, WRITE_ROLES)
