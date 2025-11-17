export interface TenantConfig {
  id: string
  name: string
  slug: string
  state: string
  theme: {
    primary: string
    secondary: string
    accent: string
  }
  delivery: {
    baseFee: number
    feePerKm: number
    minOrder: number
    maxDistance: number
  }
  location: {
    lat: number
    lng: number
    coverageRadius: number
  }
  contact: {
    phone: string
    email: string
    whatsapp: string
  }
  enabled: boolean
}

export type TenantSlug = 'alagoa-nova' | 'esperanca' | 'lagoa-seca'
