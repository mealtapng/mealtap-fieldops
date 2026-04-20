'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, MessageSquare, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     Icon: Home          },
  { href: '/onboard',   label: 'Onboard',  Icon: PlusCircle    },
  { href: '/messages',  label: 'Messages', Icon: MessageSquare },
  { href: '/profile',   label: 'Profile',  Icon: User          },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-md mx-auto bg-white border-t border-line flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href + '/'))

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-2 transition-colors ${
                active
                  ? 'text-brand'
                  : 'text-muted-brand hover:text-ink'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
