-- Supabase Migration Script
-- Run this in your Supabase SQL editor

-- Create enum for templates
CREATE TYPE template_type AS ENUM ('REACT', 'NEXTJS', 'EXPRESS', 'VUE', 'HONO', 'ANGULAR');

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  image TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playgrounds table
CREATE TABLE IF NOT EXISTS public.playgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  template template_type NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_files table
CREATE TABLE IF NOT EXISTS public.template_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create starmarks table
CREATE TABLE IF NOT EXISTS public.starmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  is_marked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, playground_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own playgrounds" ON public.playgrounds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playgrounds" ON public.playgrounds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playgrounds" ON public.playgrounds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playgrounds" ON public.playgrounds
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for template_files and starmarks
CREATE POLICY "Users can manage own template files" ON public.template_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.playgrounds 
      WHERE playgrounds.id = template_files.playground_id 
      AND playgrounds.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own starmarks" ON public.starmarks
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playgrounds_updated_at BEFORE UPDATE ON public.playgrounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_files_updated_at BEFORE UPDATE ON public.template_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_starmarks_updated_at BEFORE UPDATE ON public.starmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();