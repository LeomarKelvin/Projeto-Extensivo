import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jrskruadcwuytvjeqybh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjc4OTMsImV4cCI6MjA2NDgwMzg5M30.JzNlpPJ7jAONIpUK92zg-6YLPK6WRRfhotYiMu6KFjs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);