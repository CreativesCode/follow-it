import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side function to require authentication
 * Redirects to login if user is not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * Server-side function to get user role
 */
export async function getUserRole(userId: string) {
  const supabase = await createClient();

  // Check if user is a business member
  const { data: businessMember } = await supabase
    .from("business_members")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (businessMember) {
    return { type: "business" as const, data: businessMember };
  }

  // Check if user is a courier
  const { data: courier } = await supabase
    .from("couriers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (courier) {
    return { type: "courier" as const, data: courier };
  }

  return { type: null, data: null };
}

/**
 * Server-side function to require a business member role
 */
export async function requireBusinessRole() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role.type !== "business") {
    redirect("/dashboard");
  }

  return { user, businessMember: role.data };
}

/**
 * Server-side function to require a courier role
 */
export async function requireCourierRole() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role.type !== "courier") {
    redirect("/dashboard");
  }

  return { user, courier: role.data };
}
