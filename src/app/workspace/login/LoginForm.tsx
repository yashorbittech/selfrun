"use client";

import { useActionState, useId, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LayoutDashboard } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import BrandMark from "@/components/BrandMark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hubLoginAction, type HubLoginState } from "./actions";
import { BrandName } from "@/components/platform/BrandProvider";

const initialState: HubLoginState = {};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({ next = null }: { next?: string | null }) {
  const [state, formAction, pending] = useActionState(hubLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [email, setEmail] = useState("");
  const emailId = useId();
  const passwordId = useId();

  const emailInvalid = emailTouched && email.length > 0 && !EMAIL_RE.test(email);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
      <GlassCard>
        <CardHeader>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary lg:hidden">
            <BrandMark className="size-4 shrink-0" />
            <BrandName /> <span className="text-foreground">Workspace</span>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in once to reach every panel you have access to.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4" noValidate>
            {next && <input type="hidden" name="next" value={next} />}
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={emailInvalid || undefined}
                className={cn(emailInvalid && "border-destructive focus-visible:border-destructive")}
              />
              {emailInvalid && <p className="text-xs text-destructive">Enter a valid email address.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={passwordId}>Password</Label>
              <div className="relative">
                <Input id={passwordId} name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" className="pr-9" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            {state?.error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </GlassCard>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LayoutDashboard className="size-3.5" />
        One login for every panel you&apos;re authorized to use.
      </p>
    </motion.div>
  );
}
