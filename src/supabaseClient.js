import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wsfojikotjuikqpmndvs.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZm9qaWtvdGp1aWtxcG1uZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjIxNTcsImV4cCI6MjA3NTAzODE1N30.f_0xyfb2g81bhgu-vYOkkNDk0bv81yM4kvxa3KMMOPs";

export const supabase = createClient(supabaseUrl, supabaseKey);
