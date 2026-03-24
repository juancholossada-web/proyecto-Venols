import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest, getFleetFilter } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const fleetFilter = getFleetFilter(req.user!.role)
  const vessels = await prisma.vessel.findMany({
    where: fleetFilter ? { fleetType: fleetFilter } : {},
    orderBy: [{ fleetType: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(vessels)
})
