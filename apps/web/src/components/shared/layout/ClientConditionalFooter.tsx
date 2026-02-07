'use client'

import Footer from './Footer'
import { usePathname } from 'next/navigation'

export default function ClientConditionalFooter() {
  const pathname = usePathname()
  if (!pathname) return null
  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/recruiter')) return null
  if (pathname.startsWith('/candidate')) return null
  if (pathname.startsWith('/resume-builder')) return null // Resume builder usually has its own layout too
  return <Footer />
}


