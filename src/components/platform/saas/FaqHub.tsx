"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers, Search } from "lucide-react";
import ProductLogo from "@/components/products/ProductLogo";
import type { FaqHubGroup } from "@/lib/platform/saas/faqs";
import { SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

export default function FaqHub({ groups }: { groups: FaqHubGroup[] }) {
  const [activeId, setActiveId] = useState("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    const selectedGroups = activeId === "all"
      ? groups
      : groups.filter((group) => group.id === activeId);

    if (!normalizedQuery) return selectedGroups;
    return selectedGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.q} ${item.a}`.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeId, groups, normalizedQuery]);

  const resultCount = visibleGroups.reduce((count, group) => count + group.items.length, 0);
  const selectedTitle = activeId === "all"
    ? "All FAQs"
    : groups.find((group) => group.id === activeId)?.title ?? "FAQs";
  const selectedGroup = groups.find((group) => group.id === activeId);
  const showDirectory = activeId === "all" && normalizedQuery.length === 0;

  return (
    <section className="sr-section bg-muted/10">
      <div className="sr-container">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <p className="sr-eyebrow">Browse verified answers</p>
          <h2 className="sr-h2 mt-3">Find answers for <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">your product.</span></h2>
          <p className="sr-lead mt-4">Choose a product or search across the system. Answers describe features currently documented in SelfRun.</p>
        </div>

        <div className="mx-auto mb-8 max-w-6xl">
          <label className="relative block">
            <span className="sr-only">Search FAQs</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions and answers"
              className="sr-input min-h-12 pl-11"
            />
          </label>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside aria-label="FAQ sections" className="lg:sticky lg:top-24 lg:self-start">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">Browse topics</h3>
            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {[
                { id: "all", title: "All FAQs", general: true },
                ...groups.map((group) => ({ id: group.id, title: group.title, general: group.id === "general" })),
              ].map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setActiveId(topic.id)}
                  aria-pressed={activeId === topic.id}
                  className={`flex min-h-11 flex-none items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors lg:w-full ${
                    activeId === topic.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 bg-background hover:border-primary/30 hover:bg-muted/40"
                  }`}
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center">
                    {topic.general
                      ? <Layers className="h-4 w-4" aria-hidden />
                      : <ProductLogo productKey={topic.id} size={26} title={topic.title} />}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{topic.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 id={`faq-group-${activeId}`} className="text-xl font-black">{selectedTitle}</h3>
              {selectedGroup?.href && (
                <Link href={selectedGroup.href} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  Product details <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {showDirectory
                ? `${groups.reduce((count, group) => count + group.items.length, 0)} answers across ${SAAS_PRODUCT_COUNT} products`
                : `${resultCount} ${resultCount === 1 ? "answer" : "answers"}`}
            </p>
          </div>

          {showDirectory ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveId(group.id)}
                  className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-muted/60">
                      {group.id === "general"
                        ? <Layers className="h-5 w-5 text-primary" aria-hidden />
                        : <ProductLogo productKey={group.id} size={40} title={group.title} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-black">{group.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {group.items.length} {group.items.length === 1 ? "answer" : "answers"}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          ) : null}

          {!showDirectory && visibleGroups.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background px-6 py-10 text-center">
              <p className="font-bold">No matching FAQs found.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another search or select a different topic.</p>
            </div>
          ) : !showDirectory ? (
            <div className="space-y-5">
              {visibleGroups.map((group) => (
                <section key={group.id} aria-labelledby={`faq-group-${group.id}`} className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
                  {activeId === "all" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/20 px-5 py-4 sm:px-6">
                      <h4 id={`faq-group-${group.id}`} className="font-black">{group.title}</h4>
                      {group.href && (
                        <Link href={group.href} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                          Product details <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="divide-y divide-border/50">
                    {group.items.map((item, index) => (
                      <details key={item.q} className="sr-faq group px-5 sm:px-6">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold marker:hidden">
                          <span className="flex items-start gap-3">
                            <span className="sr-outline mt-0.5 w-7 flex-none text-sm font-black leading-none" aria-hidden>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{item.q}</span>
                          </span>
                          <span className="sr-faq-plus flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                            <span className="text-xl font-light leading-none">+</span>
                          </span>
                        </summary>
                        <p className="pb-5 pl-10 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
