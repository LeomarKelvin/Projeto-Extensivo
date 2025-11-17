import type { TenantConfig, TenantSlug } from '../types/tenant'

export const tenantConfigs: Record<TenantSlug, TenantConfig> = {
  'alagoa-nova': {
    id: 'alagoa-nova',
    name: 'Alagoa Nova',
    slug: 'alagoa-nova',
    state: 'PB',
    theme: {
      primary: '#FFD100',
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
    },
    delivery: {
      baseFee: 5.0,
      feePerKm: 2.0,
      minOrder: 15.0,
      maxDistance: 10,
    },
    location: {
      lat: -7.0743,
      lng: -35.7623,
      coverageRadius: 10,
    },
    contact: {
      phone: '(83) 99999-0001',
      email: 'alagoa.nova@pedeai.com.br',
      whatsapp: '5583999990001',
    },
    enabled: true,
  },
  'esperanca': {
    id: 'esperanca',
    name: 'Esperança',
    slug: 'esperanca',
    state: 'PB',
    theme: {
      primary: '#00D4FF',
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
    },
    delivery: {
      baseFee: 4.5,
      feePerKm: 1.8,
      minOrder: 12.0,
      maxDistance: 8,
    },
    location: {
      lat: -7.0234,
      lng: -35.8567,
      coverageRadius: 8,
    },
    contact: {
      phone: '(83) 99999-0002',
      email: 'esperanca@pedeai.com.br',
      whatsapp: '5583999990002',
    },
    enabled: true,
  },
  'alagoa-grande': {
    id: 'alagoa-grande',
    name: 'Alagoa Grande',
    slug: 'alagoa-grande',
    state: 'PB',
    theme: {
      primary: '#00FF85',
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
    },
    delivery: {
      baseFee: 5.5,
      feePerKm: 2.2,
      minOrder: 15.0,
      maxDistance: 12,
    },
    location: {
      lat: -7.0558,
      lng: -35.6307,
      coverageRadius: 12,
    },
    contact: {
      phone: '(83) 99999-0003',
      email: 'alagoa.grande@pedeai.com.br',
      whatsapp: '5583999990003',
    },
    enabled: true,
  },
}

export const defaultTenant: TenantSlug = 'alagoa-nova'

export function getTenantConfig(slug?: string | null): TenantConfig {
  const tenantSlug = (slug as TenantSlug) || defaultTenant
  return tenantConfigs[tenantSlug] || tenantConfigs[defaultTenant]
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(tenantConfigs).filter((tenant) => tenant.enabled)
}

export function isTenantValid(slug: string): boolean {
  return slug in tenantConfigs && tenantConfigs[slug as TenantSlug].enabled
}

export function getTenantBySlug(slug: string): TenantConfig | null {
  if (!isTenantValid(slug)) return null
  return tenantConfigs[slug as TenantSlug]
}
