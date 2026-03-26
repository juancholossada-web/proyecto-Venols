import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, getFleetFilter } from '@/lib/auth-middleware'
import { listVessels } from '@/lib/services/vessel.service'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const vessels = await listVessels(getFleetFilter(req.user!.role))
  return NextResponse.json(vessels)
})
