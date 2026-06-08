import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined

function proxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (workerUrl && typeof input === 'string' && input.startsWith(supabaseUrl)) {
    const proxied = input.replace(supabaseUrl, workerUrl + '/supabase')
    return fetch(proxied, init)
  }
  return fetch(input, init)
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: workerUrl ? proxyFetch : undefined,
  },
})
