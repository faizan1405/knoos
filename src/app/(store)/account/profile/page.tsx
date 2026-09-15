import { Metadata } from "next";
import { auth } from "@/lib/auth";
import AccountShell from "../AccountShell";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile — KNOOS",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || null,
    role: session.user.role,
  };

  return (
    <AccountShell title="My Profile" subtitle="Manage your personal information" active="profile">
      <ProfileClient initialUser={user} />
    </AccountShell>
  );
}
