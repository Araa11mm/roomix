import { GoogleGenAI } from '@google/genai'

export function createAI(): GoogleGenAI {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
  const workerSecret = import.meta.env.VITE_WORKER_SECRET as string | undefined

  if (workerUrl && workerSecret) {
    return new GoogleGenAI({
      apiKey: workerSecret,
      httpOptions: { baseUrl: workerUrl },
    })
  }

  // Фоллбэк для локальной разработки без Worker
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KEY as string })
}
