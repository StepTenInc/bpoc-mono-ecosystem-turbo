'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Briefcase, FileText, Wrench, User, Sparkles, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/try-resume-builder', icon: FileText, label: 'Resume', highlight: true },
  { href: '/tools', icon: Wrench, label: 'Tools' },
  { href: '/insights', icon: Sparkles, label: 'Insights' },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home' || pathname === '/'
    return pathname.startsWith(href)
  }

  // Don't show on auth pages or dashboards
  if (pathname.includes('/recruiter') || pathname.includes('/admin') || pathname.includes('/candidate')) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        >
          {/* Gradient blur background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0B0B0D]/98 to-transparent backdrop-blur-xl" />
          
          {/* Safe area padding for notched phones */}
          <div className="relative px-2 pb-safe">
            <div className="flex items-center justify-around py-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[56px] group"
                  >
                    {/* Active indicator pill */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavIndicator"
                        className="absolute inset-x-2 top-1 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Highlight glow for special items */}
                    {item.highlight && !active && (
                      <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl animate-pulse" />
                    )}
                    
                    {/* Icon container */}
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                        active 
                          ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-lg shadow-cyan-500/20" 
                          : "hover:bg-white/5"
                      )}
                    >
                      <Icon 
                        className={cn(
                          "w-6 h-6 transition-all duration-200",
                          active 
                            ? "text-cyan-400" 
                            : item.highlight 
                              ? "text-cyan-400/80" 
                              : "text-gray-500 group-hover:text-gray-300"
                        )} 
                      />
                      
                      {/* Ripple effect on tap */}
                      <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
                    </motion.div>
                    
                    {/* Label */}
                    <span 
                      className={cn(
                        "text-[10px] font-medium mt-1 transition-colors",
                        active ? "text-cyan-400" : "text-gray-500"
                      )}
                    >
                      {item.label}
                    </span>
                    
                    {/* Badge for highlight items */}
                    {item.highlight && !active && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Bottom safe area fill */}
          <div className="h-safe bg-[#0B0B0D]" />
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
