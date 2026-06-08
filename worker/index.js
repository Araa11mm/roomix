const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

const SUPABASE_URL = 'https://ziaepdgkqsbkpczhshtl.supabase.co'

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    const url = new URL(request.url)

    // Supabase proxy: /supabase/* -> https://ziaepdgkqsbkpczhshtl.supabase.co/*
    if (url.pathname.startsWith('/supabase/')) {
      const supabasePath = url.pathname.replace('/supabase', '')
      const supabaseReqUrl = SUPABASE_URL + supabasePath + url.search

      const headers = new Headers(request.headers)
      headers.delete('host')

      const supabaseRes = await fetch(supabaseReqUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      })

      return new Response(supabaseRes.body, {
        status: supabaseRes.status,
        headers: {
          ...CORS,
          'Content-Type': supabaseRes.headers.get('Content-Type') ?? 'application/json',
        },
      })
    }

    // Gemini proxy
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS })
    }

    const clientKey =
      request.headers.get('x-goog-api-key') || url.searchParams.get('key')

    if (clientKey !== env.WORKER_SECRET) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 401, status: '' } }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const geminiUrl = new URL(
      url.pathname,
      'https://generativelanguage.googleapis.com'
    )

    const geminiRes = await fetch(geminiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_KEY,
      },
      body: request.body,
    })

    return new Response(geminiRes.body, {
      status: geminiRes.status,
      headers: {
        ...CORS,
        'Content-Type': geminiRes.headers.get('Content-Type') ?? 'application/json',
      },
    })
  },
}
