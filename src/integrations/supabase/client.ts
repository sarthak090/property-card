// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://imjacusvndfmbsiypyuv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltamFjdXN2bmRmbWJzaXlweXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTI4OTAsImV4cCI6MjA1NDY4ODg5MH0.gMLpFEpknrttMk-1X9h-bFqVbB1uDVVIH7Es2WPYOKk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);