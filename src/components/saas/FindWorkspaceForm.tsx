"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { findWorkspace } from "@/app/saas/actions";

export default function FindWorkspaceForm() {
  const [state, action, pending] = useActionState(findWorkspace, null);
  return (
    <form action={action} className="sr-card space-y-5" noValidate>
      <div>
        <label htmlFor="workspace" className="sr-label">Your workspace address</label>
        <input id="workspace" name="workspace" className="sr-input" placeholder="yourcompany  or  yourcompany.com" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
        <p className="mt-1.5 text-sm sr-muted">The name or domain of your company&apos;s workspace — it&apos;s in your invitation email.</p>
        {state?.error && <p role="alert" className="mt-2 text-sm" style={{ color: "#c0262d" }}>{state.error}</p>}
      </div>
      <button type="submit" className="sr-btn sr-btn-primary w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Continue to sign in
      </button>
    </form>
  );
}
