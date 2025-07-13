'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Crown, Settings } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { NotificationPanel } from './NotificationPanel'

export function Header() {
  const { user } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      // Check user role from our database
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setIsAdmin(data.role === 'ADMIN'))
        .catch(err => console.error('Error fetching user role:', err))
    }
  }, [user])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-2xl">
      <nav className="flex items-center justify-between h-16 px-4 md:px-6 w-full">
        {/* Left Side: Logo and Brand */}
        <div className="flex items-center gap-x-3">
          <Link href="/" className="flex items-center gap-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 gradient-orb rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-25 transition-opacity duration-200"></div>
            </div>
            <div>
              <h1 className="font-bold text-base text-white">OrgChart AI</h1>
              <p className="text-xs text-purple-300/80">Powered by intelligence</p>
            </div>
          </Link>
        </div>

        {/* Right Side: Actions and User */}
        <div className="flex items-center gap-x-4">
          {/* Admin Button - Ghost button style */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden md:flex items-center gap-x-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 font-semibold px-4 py-2 rounded-lg transition-colors border border-yellow-400/20 hover:border-yellow-400/30"
            >
              <Crown className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
          
          {/* User Info and Settings */}
          <div className="flex items-center gap-x-3">
            {/* Notifications */}
            <div className="relative">
              <NotificationBell />
              <NotificationPanel />
            </div>

            {/* Settings Button */}
            <Link
              href="/settings"
              className="flex items-center gap-x-2 text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            {/* User Section */}
            <div className="flex items-center gap-x-3">
              {user && (
                <div className="text-right hidden md:block">
                  <div className="text-white text-sm font-medium">
                    {user.firstName || 'User'}
                  </div>
                  <div className="text-purple-300/80 text-xs font-light">
                    {isAdmin ? 'Administrator' : 'Member'}
                  </div>
                </div>
              )}
              
              <div className="relative">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        'h-8 w-8 rounded-full ring-2 ring-white/20 shadow-lg transition-all hover:ring-purple-400/50 hover:scale-105',
                      userButtonPopoverCard:
                        'shadow-2xl rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl',
                      userButtonPopoverActions: 'bg-transparent',
                      userButtonPopoverActionButton:
                        'font-light rounded-xl text-slate-300 hover:bg-purple-500/20 hover:text-white transition-all',
                      userButtonPopoverFooter: 'hidden',
                    },
                  }}
                />
                {/* Optional notification badge */}
                {/* <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  3
                </span> */}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
} 