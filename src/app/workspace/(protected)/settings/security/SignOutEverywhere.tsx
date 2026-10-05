"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hubLogoutAction } from "@/app/workspace/(protected)/actions";

/** The existing "sign out everywhere" action: ends this account's sessions in every panel, on every device. */
export default function SignOutEverywhere() {
  const [pending, start] = useTransition();
  return (
    <Button id="security-signout-all" type="button" variant="destructive" disabled={pending} onClick={() => start(() => void hubLogoutAction())}>
      <LogOut className="size-4" />
      Sign out everywhere
    </Button>
  );
}
