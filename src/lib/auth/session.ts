import { createClient } from "@/lib/supabase/server";
import type { PortalProfile, PortalRole } from "@/types/domain";

export async function getSessionProfile(): Promise<{
  userId: string;
  profile: PortalProfile;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("portal_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { userId: user.id, profile: profile as PortalProfile };
}

export async function requireRole(role: PortalRole) {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== role) {
    return null;
  }
  return session;
}
