'use client'

import Image from 'next/image'
import Link from 'next/link'
import logoSrc from '../../../public/Logo.PNG'
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
  { href: '/admin',               label: 'Dashboard',   icon: '📊', exact: true  },
  { href: '/admin/map',           label: 'Live Map',    icon: '🗺️', exact: false },
  { href: '/admin/restaurants',   label: 'Restaurants', icon: '🍽️', exact: false },
  { href: '/admin/agents',        label: 'Agents',      icon: '👥', exact: false },
  { href: '/admin/messages',      label: 'Messages',    icon: '💬', exact: false },
  { href: '/content-hub',         label: 'Content Hub', icon: '🖼️', exact: false },
  { href: '/admin/payouts',       label: 'Payouts',     icon: '💰', exact: false },
  { href: '/admin/settings',      label: 'Settings',    icon: '⚙️', exact: false },
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
        style={{ background: 'linear-gradient(180deg, #1F3F1B 0%, #2D5A27 100%)' }}
      >

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <Image
            src={logoSrc}
            alt="Mealtap"
            width={80}
            height={80}
            className="object-contain rounded-lg"
            priority
          />
          <p className="text-white/40 text-[10px] tracking-widest uppercase mt-2">Admin Console</p>
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
                style={active ? { background: 'rgba(200,98,42,0.18)', color: '#FBAB76' } : {}}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-white/10 p-4">
            <Link href="/admin/profile" className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-white/5 transition-colors group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#2D5A27' }}>
                <span className="text-xs font-bold text-white">{initials(user.full_name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-white/90">{user.full_name}</p>
                <p className="text-[11px] text-white/50">{roleLabel(user.role)}</p>
              </div>
            </Link>
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
