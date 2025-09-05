type EnvShape = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  oneSignalAppId?: string;
};

function read(key: string): string | undefined {
  // Expo exposes EXPO_PUBLIC_* automatically
  return process.env[key];
}

export const env: EnvShape = {
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL') || read('SUPABASE_URL') || 'https://placeholder-project.supabase.co',
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY') || read('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  oneSignalAppId: read('ONESIGNAL_APP_ID')
};

if (env.supabaseUrl.includes('placeholder') || env.supabaseAnonKey.includes('placeholder')) {
  // Soft warning; avoids crash during initial dev before setting .env
  // eslint-disable-next-line no-console
  console.warn('[env] Using placeholder Supabase credentials. Please update .env file with real values.');
}