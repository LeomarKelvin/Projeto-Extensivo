-- RLS Policies for perfis table
-- These policies allow authenticated users to read their own profiles

-- Enable RLS on perfis table (if not already enabled)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON perfis;
DROP POLICY IF EXISTS "Service role has full access" ON perfis;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON perfis 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Apply this in Supabase Dashboard > SQL Editor
-- The service role already bypasses RLS naturally in Supabase
-- No additional policy is needed for server-side operations
