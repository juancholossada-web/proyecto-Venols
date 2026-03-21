import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  const vessels = await prisma.vessel.findMany({
    orderBy: [{ fleetType: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(vessels)
})
