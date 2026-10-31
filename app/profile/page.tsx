import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();

  return (
    <>
      <h1 style={{ fontSize: 32 }}>Your profile</h1>
      <p className="lead">This is what the Search agent looks for and what the Reviewer compares against.</p>
      <ProfileForm profile={data as Profile | null} />
    </>
  );
}
