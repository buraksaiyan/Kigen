// Lemon Squeezy Webhook (Edge Function Placeholder)
// Deploy via: supabase functions deploy ls-webhooks
// Environment variable expected: LEMONSQUEEZY_SIGNING_SECRET

import { serve } from 'https://deno.land/std@0.180.0/http/server.ts';

interface LemonEvent {
  meta?: { event_name?: string };
  data?: unknown;
}

function verifySignature(_raw: string, _sig: string | null, _secret: string | undefined): boolean {
  // TODO: Implement HMAC verification according to Lemon Squeezy docs.
  return true;
}

serve(async (req: Request) => {
  const secret = Deno.env.get('LEMONSQUEEZY_SIGNING_SECRET');
  const signature = req.headers.get('X-Signature') || null;

  const raw = await req.text();

  if (!verifySignature(raw, signature, secret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: LemonEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  // Handle events (e.g., subscription_created, subscription_expired)
  // For now, we simply log.
  console.log('Lemon Event:', event.meta?.event_name);

  return new Response('ok', { status: 200 });
});