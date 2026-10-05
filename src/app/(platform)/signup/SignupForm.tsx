"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Loader2, Clock, X } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { slugFormatError, slugFromName } from "@/lib/platform/tenancy/slug";
import { checkSlugAction, startSignupAction, validateSignupAction, type SignupState } from "./actions";
import type { SignupFieldErrors } from "@/lib/platform/signup";
import CreatingWorkspace from "./CreatingWorkspace";
import { BUSINESS_CATEGORIES, CUSTOM_PREFIX, MAX_BUSINESS_CATEGORIES, MAX_BUSINESS_SUBCATEGORIES, cleanCustomName } from "@/lib/platform/business-taxonomy";
import SearchMultiSelect, { type MultiOption } from "@/components/platform/SearchMultiSelect";

const CATEGORY_OPTIONS: MultiOption[] = BUSINESS_CATEGORIES.map((c) => ({ value: c.code, label: c.name }));

const initialState: SignupState = {};
type SlugCheck = { for: string; state: "idle" | "checking" | "ok" | "bad"; message: string | null };

export default function SignupForm({ rootDomain, approval = false }: { rootDomain: string; approval?: boolean }) {
  const [state, formAction] = useActionState(startSignupAction, initialState);
  // Two phases: the server validates first (`checking`), and only then the creation starts and the progress replaces the form (`creating`).
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [check, setCheck] = useState<SlugCheck>({ for: "", state: "idle", message: null });
  const [showPassword, setShowPassword] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  // Sub-categories of the chosen categories, grouped by category.
  const subOptions: MultiOption[] = BUSINESS_CATEGORIES.filter((c) => categories.includes(c.code)).flatMap((c) => c.subs.map((x) => ({ value: x.code, label: x.name, group: c.name })));
  const ids = { company: useId(), slug: useId(), email: useId(), password: useId(), terms: useId(), category: useId(), sub: useId() };

  // The creation answered with something to fix (rate limit, address taken a moment ago…): back to the form.
  useEffect(() => {
    if (state.errors) {
      setErrors(state.errors);
      setCreating(false);
    }
    if (state.awaitingApproval) setCreating(false);
  }, [state]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checking || creating) return;
    const data = new FormData(e.currentTarget);
    setErrors({});
    setChecking(true);
    const pre = await validateSignupAction(data).catch((): { errors?: SignupFieldErrors } => ({ errors: { form: "Something went wrong. Please try again." } }));
    setChecking(false);
    if (pre.errors) {
      setErrors(pre.errors);
      return;
    }
    setCreating(true);
    startTransition(() => formAction(data));
  }

  // Live availability check (debounced). Format problems are answered locally without a round trip.
  useEffect(() => {
    if (!slug) return;
    const local = slugFormatError(slug);
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (local) {
        if (!cancelled) setCheck({ for: slug, state: "bad", message: local });
        return;
      }
      if (!cancelled) setCheck({ for: slug, state: "checking", message: null });
      const res = await checkSlugAction(slug).catch(() => null);
      if (cancelled) return;
      setCheck(res ? { for: slug, state: res.available ? "ok" : "bad", message: res.message } : { for: slug, state: "idle", message: null });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  if (state.awaitingApproval) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <GlassCard>
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Awaiting approval</CardTitle>
            <CardDescription>
              Thanks — your workspace request is with our team. We&apos;ll email <strong className="text-foreground">{state.awaitingApproval}</strong> as soon as it&apos;s approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Nothing yet? Approval is done by hand, so it can take a little while. Check spam too.</CardContent>
        </GlassCard>
      </motion.div>
    );
  }

  const fieldError = (msg?: string) => (msg ? <p className="text-xs text-destructive">{msg}</p> : null);
  // A result only counts for the address it was checked against.
  const current: SlugCheck = check.for === slug ? check : { for: slug, state: "idle", message: null };
  const slugMessage = errors.slug ?? (current.state === "bad" ? current.message : null);

  return (
    <>
      {/* While the workspace is being created the form is hidden (kept mounted, so the submission completes) and the progress is shown instead. */}
      {creating && <CreatingWorkspace companyName={companyName} host={`${slug || "your-company"}.${rootDomain}`} approval={approval} />}
    <motion.div hidden={creating} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-xl">Create your workspace</CardTitle>
          <CardDescription>{approval ? "Free to start. New workspaces are approved by our team before they go live." : "Free to start. Set up takes about two minutes."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor={ids.company}>Company name</Label>
              <Input
                id={ids.company}
                name="companyName"
                required
                autoFocus
                autoComplete="organization"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (!slugEdited) setSlug(slugFromName(e.target.value));
                }}
                aria-invalid={!!errors.companyName || undefined}
              />
              {fieldError(errors.companyName)}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={ids.slug}>Workspace address</Label>
              <div className={cn("flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring/50", slugMessage && "border-destructive")}>
                <Input
                  id={ids.slug}
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="border-0 shadow-none focus-visible:ring-0"
                  aria-invalid={!!slugMessage || undefined}
                  aria-describedby={`${ids.slug}-status`}
                />
                <span className="shrink-0 pr-3 text-sm text-muted-foreground">.{rootDomain}</span>
              </div>
              <p id={`${ids.slug}-status`} className={cn("flex items-center gap-1 text-xs", slugMessage ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
                {current.state === "checking" && <Loader2 className="size-3 animate-spin" />}
                {current.state === "ok" && !errors.slug && <Check className="size-3 text-emerald-600" />}
                {slugMessage && <X className="size-3" />}
                {slugMessage ?? (current.state === "ok" ? "Available" : "Your team signs in here. You can add your own domain later.")}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={ids.category}>Business categories</Label>
              <SearchMultiSelect
                id={ids.category}
                name="businessCategory"
                options={CATEGORY_OPTIONS}
                values={categories}
                onChange={(next) => {
                  setCategories(next);
                  // Drop sub-categories whose category was just removed.
                  setSubCategories((subs) => subs.filter((c) => c.startsWith(CUSTOM_PREFIX) || next.includes(c.split(":")[0])));
                }}
                placeholder="Select up to 5 industries…"
                searchPlaceholder="Search, or type your own…"
                max={MAX_BUSINESS_CATEGORIES}
                customPrefix={CUSTOM_PREFIX}
                cleanCustom={cleanCustomName}
                invalid={!!errors.businessCategories}
              />
              {fieldError(errors.businessCategories)}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={ids.sub}>Sub-categories</Label>
              <SearchMultiSelect
                id={ids.sub}
                name="businessSubCategory"
                options={subOptions}
                values={subCategories}
                onChange={setSubCategories}
                disabled={categories.length === 0}
                placeholder={categories.length === 0 ? "Choose a category first" : "Select up to 25 things your business does…"}
                searchPlaceholder="Search, or type your own…"
                max={MAX_BUSINESS_SUBCATEGORIES}
                customPrefix={CUSTOM_PREFIX}
                cleanCustom={cleanCustomName}
                invalid={!!errors.businessSubCategories}
              />
              {fieldError(errors.businessSubCategories)}
              <p className="text-xs text-muted-foreground">Up to 5 categories and 25 sub-categories — and if yours isn&apos;t listed, type it and press Enter. Based on the UN&apos;s ISIC classification, extended for modern industries.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={ids.email}>Work email</Label>
              <Input id={ids.email} name="email" type="email" required autoComplete="email" aria-invalid={!!errors.email || undefined} />
              {fieldError(errors.email)}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={ids.password}>Password</Label>
              <div className="relative">
                <Input id={ids.password} name="password" type={showPassword ? "text" : "password"} required minLength={10} autoComplete="new-password" className="pr-9" aria-invalid={!!errors.password || undefined} />
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-1 -translate-y-1/2" aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {fieldError(errors.password) ?? <p className="text-xs text-muted-foreground">At least 10 characters.</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor={ids.terms} className="flex items-start gap-2 text-sm text-muted-foreground">
                <input id={ids.terms} name="acceptTerms" type="checkbox" className="mt-0.5 size-4 accent-primary" />
                I agree to the Terms of Service and Privacy Policy.
              </label>
              {fieldError(errors.acceptTerms)}
            </div>

            {errors.form && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.form}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={checking || creating}>
              {checking ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Checking…
                </>
              ) : approval ? (
                "Request workspace"
              ) : (
                "Create workspace"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have a workspace? Sign in at <span className="font-medium text-foreground">your-company.{rootDomain}</span>
            </p>
          </form>
        </CardContent>
      </GlassCard>
    </motion.div>
    </>
  );
}
