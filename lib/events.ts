/**
 * SSE (Server-Sent Events) — emisor global de eventos en tiempo real.
 * El admin se suscribe a /api/events y recibe push cada vez que
 * un operador hace una mutación (inventario, mantenimiento, etc).
 */

type SSEController = ReadableStreamDefaultController<Uint8Array>

// Singleton global — persiste entre requests en el proceso Node
const g = globalThis as { _sseClients?: Set<SSEController> }
if (!g._sseClients) g._sseClients = new Set()
export const sseClients = g._sseClients

export type SSEEventType =
  | 'inventory_updated'
  | 'inventory_movement'
  | 'maintenance_created'
  | 'maintenance_updated'
  | 'fuel_log_created'
  | 'daily_report_created'
  | 'vessel_updated'
  | 'ping'

export interface SSEEvent {
  type: SSEEventType
  fleetType?: 'PESADA' | 'LIVIANA'
  vesselId?: string
  vesselName?: string
  userId?: string
  userEmail?: string
  payload?: Record<string, unknown>
}

/** Emite un evento a todos los clientes SSE conectados */
export function emitEvent(event: SSEEvent): void {
  if (sseClients.size === 0) return
  const encoder = new TextEncoder()
  const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
  for (const ctrl of sseClients) {
    try {
      ctrl.enqueue(data)
    } catch {
      // Cliente desconectado — limpiar
      sseClients.delete(ctrl)
    }
  }
}
