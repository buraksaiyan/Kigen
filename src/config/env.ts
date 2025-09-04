type EnvShape = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn?: string;
  oneSignalAppId?: string;
};

function read(key: string): string | undefined {
  // Expo exposes EXPO_PUBLIC_* automatically
  return process.env[key];
}

export const env: EnvShape = {
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL') || read('SUPABASE_URL') || '',
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY') || read('SUPABASE_ANON_KEY') || '',
  sentryDsn: read('EXPO_PUBLIC_SENTRY_DSN') || read('SENTRY_DSN'),
  oneSignalAppId: read('ONESIGNAL_APP_ID')
};

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  // Soft warning; avoids crash during initial dev before setting .env
  // eslint-disable-next-line no-console
  console.warn('[env] Missing Supabase credentials.');
}