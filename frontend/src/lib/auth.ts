import { supabase } from "@/integrations/supabase/client";

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`
    }
  });
  
  if (error) throw error;

  // Assign role based on email pattern
  if (data.user) {
    const role = email === "admin@vnrvjiet.in" ? "admin" : "candidate";
    
    // Insert user role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role });
    
    if (roleError) console.error("Role assignment error:", roleError);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  if (error) return null;
  return data?.role || null;
}
