type EnvShape = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  oneSignalAppId?: string;
  isDevelopment: boolean;
};

function read(key: string): string | undefined {
  // Expo exposes EXPO_PUBLIC_* automatically
  return process.env[key];
}

const supabaseUrl = read('EXPO_PUBLIC_SUPABASE_URL') || read('SUPABASE_URL') || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = read('EXPO_PUBLIC_SUPABASE_ANON_KEY') || read('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const env: EnvShape = {
  supabaseUrl,
  supabaseAnonKey,
  oneSignalAppId: read('EXPO_PUBLIC_ONESIGNAL_APP_ID') || read('ONESIGNAL_APP_ID'),
  isDevelopment: supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('demo')
};

if (env.isDevelopment) {
  console.warn('⚠️  Using placeholder Supabase credentials');
  console.warn('📝 To fix: Update EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  console.warn('🌐 Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
}