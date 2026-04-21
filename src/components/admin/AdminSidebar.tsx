'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface User {
  id:        string
  full_name: string
  role:      string
}

interface Props {
  user: User | null
}

const NAV_ITEMS = [
  { href: '/admin',              label: 'Dashboard',   icon: '📊', exact: true  },
  { href: '/admin/map',          label: 'Live Map',    icon: '🗺️', exact: false },
  { href: '/admin/onboardings',  label: 'Onboardings', icon: '⚡', exact: false },
  { href: '/admin/agents',       label: 'Agents',      icon: '👥', exact: false },
  { href: '/admin/messages',     label: 'Messages',    icon: '💬', exact: false },
]

const DISABLED_ITEMS = [
  { label: 'Payouts',  icon: '💰' },
  { label: 'Settings', icon: '⚙️' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleLabel(role: string) {
  if (role === 'admin')      return 'Admin'
  if (role === 'field_lead') return 'Field Lead'
  return 'Agent'
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Fixed sidebar */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-40"
        style={{ background: 'linear-gradient(180deg, #0D1B0E 0%, #0a2e0c 100%)' }}
      >

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <p className="text-xl font-display font-extrabold leading-none">
            <span className="text-white">Power</span>
            <span style={{ color: '#25D366' }}>Chat</span>
          </p>
          <p className="text-white/40 text-[10px] tracking-widest uppercase mt-1.5">Admin Console</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
                style={active ? { background: 'rgba(249,168,37,0.15)', color: '#F9A825' } : {}}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* Separator */}
          <div className="pt-2 pb-1 px-3">
            <div className="border-t border-white/10" />
          </div>

          {/* Disabled items */}
          {DISABLED_ITEMS.map(item => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 cursor-not-allowed"
            >
              <span className="text-base leading-none opacity-50">{item.icon}</span>
              {item.label}
              <span className="ml-auto text-[9px] font-bold tracking-wider bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">
                v2
              </span>
            </div>
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1B5E20' }}>
                <span className="text-xs font-bold text-white">{initials(user.full_name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-[11px] text-white/50">{roleLabel(user.role)}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Spacer to push content right of sidebar */}
      <div className="w-[220px] flex-shrink-0" />
    </>
  )
}
