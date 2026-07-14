"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Settings redirects to Profile since Profile page handles all settings
export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  return null;
}
