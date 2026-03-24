type LogoSize = 'sm' | 'md' | 'lg'

const config: Record<LogoSize, { mark: number; name: number; tag: number; radius: number }> = {
  sm: { mark: 26, name: 14, tag: 0,  radius: 6  },
  md: { mark: 34, name: 17, tag: 8,  radius: 8  },
  lg: { mark: 52, name: 22, tag: 10, radius: 10 },
}

export default function VenolsLogo({ size = 'md' }: { size?: LogoSize }) {
  const c = config[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Icon mark */}
      <div style={{
        width: c.mark, height: c.mark, flexShrink: 0,
        background: 'linear-gradient(145deg, #C3A042, #D4B254)',
        borderRadius: c.radius,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Anchor SVG */}
        <svg
          width={c.mark * 0.58}
          height={c.mark * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(8,14,26,0.85)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="2.5" />
          <line x1="12" y1="22" x2="12" y2="7.5" />
          <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
        </svg>
      </div>

      {/* Wordmark */}
      <div>
        <div style={{
          fontSize: c.name,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '0.8px',
          lineHeight: 1.1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          VENOLS
        </div>
        {c.tag > 0 && (
          <div style={{
            fontSize: c.tag,
            color: 'var(--accent)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginTop: '1px',
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            ERP
          </div>
        )}
      </div>
    </div>
  )
}
