import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, getFleetFilter, WRITE_ROLES } from '@/lib/auth-middleware'
import { listReports, createReport } from '@/lib/services/daily-report.service'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const reports = await listReports({
    vesselId:    searchParams.get('vesselId'),
    date:        searchParams.get('date'),
    from:        searchParams.get('from'),
    to:          searchParams.get('to'),
    fleetFilter: getFleetFilter(req.user!.role),
  })
  return NextResponse.json(reports)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const report = await createReport(body)
  return NextResponse.json(report, { status: 201 })
}, WRITE_ROLES)
