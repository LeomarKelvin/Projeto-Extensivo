import type { TenantConfig } from '@/lib/types/tenant'

interface LogoProps {
  tenant?: TenantConfig
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}

export default function Logo({ tenant, size = 'md', showText = true, className = '' }: LogoProps) {
  const primaryColor = tenant?.theme.primary || '#FFD100'
  const secondaryColor = tenant?.theme.secondary || '#1A1A1A'

  return (
    <div className={`flex items-center ${className}`}>
      <svg className={`${sizes[size]} lightning-logo`} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill={primaryColor} />
        <circle cx="12" cy="12" r="9" fill={secondaryColor} />
        <path d="M13 6L7 14h4v4l6-8h-4V6z" fill={primaryColor} />
      </svg>
      {showText && (
        <span className="ml-2 text-2xl font-bold text-white">
          Pede<span style={{ color: primaryColor }}>Aí</span>
        </span>
      )}
    </div>
  )
}
