import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import type { Session } from '@supabase/supabase-js'

interface Props {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  if (session === undefined) return null

  if (!session) return <Navigate to="/auth" replace />

  return <>{children}</>
}

export default ProtectedRoute
