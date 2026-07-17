"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  return null;
}

// Settings redirects to Profile since Profile page handles all settings
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsRedirect />
    </Suspense>
  );
}
