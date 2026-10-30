/**
 * Vercel Function: POST /api/chat (Ask Jignesh), GET /api/chat (health).
 * Configure in Vercel → Project → Settings → Environment Variables:
 *   AIAND_API_KEY (required), AIAND_MODEL, ALLOWED_ORIGINS, rate-limit vars.
 * See server/chatProxy.ts and the README's "Ask Jignesh" section.
 */
import { handleChat, type ProxyEnv } from '../server/chatProxy.js'

const env = () => process.env as ProxyEnv

export function GET(request: Request) {
  return handleChat(request, env())
}

export function POST(request: Request) {
  return handleChat(request, env())
}

export function OPTIONS(request: Request) {
  return handleChat(request, env())
}
