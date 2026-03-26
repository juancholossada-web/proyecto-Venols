import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getFleetFilter, AuthenticatedRequest } from '@/lib/auth-middleware'

export type NotificationItem = {
  id: string
  type: 'low_stock' | 'maintenance' | 'compliance'
  title: string
  detail: string
  severity: 'warning' | 'danger'
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const fleetFilter = getFleetFilter(req.user!.role)
  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [allItems, maintenanceOrders, complianceDocs] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: fleetFilter ? { vessel: { fleetType: fleetFilter } } : {},
      include: { vessel: { select: { name: true } } },
    }).catch(() => []),

    prisma.maintenanceOrder.findMany({
      where: {
        dueDate: { lte: in3Days },
        status: { not: 'COMPLETADA' },
        ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
      },
      include: { vessel: { select: { name: true } } },
      take: 15,
      orderBy: { dueDate: 'asc' },
    }).catch(() => []),

    prisma.complianceDocument.findMany({
      where: {
        expiresAt: { lte: in30Days, gte: now },
        status: { not: 'VENCIDO' },
        ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
      },
      include: { vessel: { select: { name: true } } },
      take: 15,
      orderBy: { expiresAt: 'asc' },
    }).catch(() => []),
  ])

  const notifications: NotificationItem[] = []

  // Low stock: quantity <= minStock
  const lowStockItems = (allItems as any[]).filter(i => i.quantity <= i.minStock).slice(0, 15)
  for (const item of lowStockItems) {
    notifications.push({
      id: `stock-${item.id}`,
      type: 'low_stock',
      title: 'Stock mínimo alcanzado',
      detail: `${item.name} — ${item.vessel?.name ?? 'Sin embarcación'} (${item.quantity} ${item.unit})`,
      severity: item.quantity === 0 ? 'danger' : 'warning',
    })
  }

  for (const order of maintenanceOrders as any[]) {
    const diffMs = new Date(order.dueDate).getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const when = diffDays <= 0 ? 'vencida' : diffDays === 1 ? 'mañana' : `en ${diffDays} días`
    notifications.push({
      id: `maint-${order.id}`,
      type: 'maintenance',
      title: 'Mantenimiento próximo',
      detail: `${order.description} — ${order.vessel?.name ?? 'Sin embarcación'} (${when})`,
      severity: diffDays <= 0 ? 'danger' : 'warning',
    })
  }

  for (const doc of complianceDocs as any[]) {
    const diffDays = Math.ceil((new Date(doc.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const when = diffDays <= 7 ? `${diffDays} días` : `${Math.ceil(diffDays / 7)} semanas`
    notifications.push({
      id: `comp-${doc.id}`,
      type: 'compliance',
      title: 'Documento por vencer',
      detail: `${doc.name} — ${doc.vessel?.name ?? 'Sin embarcación'} (vence en ${when})`,
      severity: diffDays <= 7 ? 'danger' : 'warning',
    })
  }

  // danger first
  notifications.sort((a, b) => {
    if (a.severity === 'danger' && b.severity !== 'danger') return -1
    if (b.severity === 'danger' && a.severity !== 'danger') return 1
    return 0
  })

  return NextResponse.json(notifications)
})
