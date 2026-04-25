'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AppSettings {
  daily_target:   number
  weekly_salary:  number
  hot_lead_bonus: number
}

const DEFAULTS: AppSettings = {
  daily_target:   20,
  weekly_salary:  40000,
  hot_lead_bonus: 500,
}

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)

  useEffect(() => {
    const supabase = createClient()
    ;(supabase as any)
      .from('app_settings')
      .select('key, value')
      .in('key', ['daily_target', 'weekly_salary', 'hot_lead_bonus'])
      .then(({ data }: { data: { key: string; value: string }[] | null }) => {
        if (!data) return
        const patch: Partial<AppSettings> = {}
        for (const row of data) {
          const v = Number(row.value)
          if (!isNaN(v) && v > 0) {
            (patch as Record<string, number>)[row.key] = v
          }
        }
        setSettings(prev => ({ ...prev, ...patch }))
      })
  }, [])

  return settings
}
