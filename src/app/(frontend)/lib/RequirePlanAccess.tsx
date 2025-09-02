'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/app/(frontend)/context/AuthProvider'
import { hasAccess } from '@/app/(frontend)/lib/hasAccess'

export const RequirePlanAccess = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      console.log(" User plan:", user.plan)
      console.log("pathname:", pathname)
      const allowed = hasAccess(user.plan, pathname)
      console.log(allowed)
      if (!allowed) {
        router.push('/dashboard') // redirect to safe page
      }
    }
  }, [user, loading, pathname, router])

  if (loading) return null // or a spinner
  return <>{children}</>
}
