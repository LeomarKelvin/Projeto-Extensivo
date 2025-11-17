'use client'

import { useEffect } from 'react'
import type { TenantConfig } from '@/lib/types/tenant'

interface TenantThemeProps {
  tenant?: TenantConfig
}

export default function TenantTheme({ tenant }: TenantThemeProps) {
  useEffect(() => {
    if (tenant) {
      document.documentElement.style.setProperty('--color-primary', tenant.theme.primary)
      document.documentElement.style.setProperty('--color-secondary', tenant.theme.secondary)
      document.documentElement.style.setProperty('--color-accent', tenant.theme.accent)
    } else {
      document.documentElement.style.setProperty('--color-primary', '#FFD100')
      document.documentElement.style.setProperty('--color-secondary', '#1A1A1A')
      document.documentElement.style.setProperty('--color-accent', '#FFFFFF')
    }
  }, [tenant])

  return null
}
