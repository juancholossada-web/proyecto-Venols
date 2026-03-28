type LogoSize = 'sm' | 'md' | 'lg'

const heights: Record<LogoSize, number> = {
  sm: 28,
  md: 38,
  lg: 90,
}

export default function VenolsLogo({ size = 'md' }: { size?: LogoSize }) {
  return (
    <img
      src="/logo-final-3.png"
      alt="VENOLS"
      style={{ height: heights[size], width: 'auto', objectFit: 'contain', userSelect: 'none' }}
      draggable={false}
    />
  )
}
