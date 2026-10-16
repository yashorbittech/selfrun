import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock, Tag } from "lucide-react";
import { POSTS, type BlogPost } from "@/lib/saas/site";
import { PageHero, SectionHead } from "@/components/saas/blocks";
import Reveal from "@/components/saas/Reveal";
import { marketingFor, screenFor } from "@/lib/saas/screens";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Guides",
  description:
    "Practical business automation guides, productivity advice, and operational tutorials for founders, managers, and growing teams. Simple language, realistic examples, and actionable steps.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const [featured, ...others] = POSTS;

  return (
    <>
      <PageHero
        eyebrow="Practical Business Guides"
        title="Simple, proven advice"
        accent="to run your business smarter."
        lead="Actionable guides, step-by-step tutorials, and productivity strategies anyone can follow. Written in clear, plain language with real product screenshots and zero fluff."
        photo="laptop-talk"
        shot="cms"
        shotName="Website & CMS"
        chip={{ title: `${POSTS.length} In-Depth Guides`, text: "Actionable playbooks for every department" }}
        notes={["Free forever plan", "Zero technical jargon", "Step-by-step instructions"]}
      >
        <Link
          href="#guides"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background shadow-xl transition-all hover:scale-105"
        >
          Browse all guides <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-7 py-3.5 text-sm font-bold text-foreground shadow-sm backdrop-blur transition-all hover:bg-muted"
        >
          Start free workspace
        </Link>
      </PageHero>

      <section id="guides" className="sr-section border-b border-border/50 py-16 lg:py-24">
        <div className="sr-container space-y-16">
          {/* Featured Post Card */}
          {featured && (
            <Reveal className="overflow-hidden rounded-[2.5rem] border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-xl transition-all duration-300 hover:border-primary/40 hover:shadow-2xl sm:p-9 lg:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="space-y-4 lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                      <Tag className="h-3 w-3" />
                      {featured.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {featured.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {featured.readMinutes} min read
                    </span>
                    <span className="rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-accent">
                      Featured
                    </span>
                  </div>

                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {featured.title}
                    </Link>
                  </h2>

                  <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {featured.summary}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90"
                    >
                      Read full guide
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-md lg:col-span-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenFor(featured.shot) || `/selfrun/photos/${featured.photo}.jpg`}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </Reveal>
          )}

          {/* Section Heading for All Guides */}
          <div>
            <SectionHead
              eyebrow="Knowledge & Tutorials"
              title="All Published"
              accent="Guides & Articles"
              lead="Explore practical instructions for website building, invoice automation, lead generation, payroll processing, SOP writing, and company operations."
            />

            {/* Grid of Remaining Posts */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((post, idx) => {
                const screenSrc = screenFor(post.shot);
                const photoSrc = `/selfrun/photos/${post.photo}.jpg`;
                const imageSrc = screenSrc || photoSrc;

                return (
                  <Reveal
                    key={post.slug}
                    delay={(idx % 3) * 60}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="relative aspect-[16/10] overflow-hidden border-b border-border/40 bg-muted/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                        <Tag className="h-3 w-3 text-primary" />
                        {post.tag}
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.date}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readMinutes} min read
                          </span>
                        </div>

                        <h3 className="text-xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h3>

                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {post.summary}
                        </p>
                      </div>

                      <div className="pt-5">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-all group-hover:gap-2.5"
                        >
                          Read guide <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Free Forever CTA Band */}
      <section className="sr-section py-16 lg:py-20">
        <div className="sr-container text-center">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-border/50 bg-gradient-to-br from-primary/15 via-background to-brand-accent/15 p-8 shadow-2xl sm:p-14">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Ready to automate your business operations?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Get started with SelfRun AI today. Free forever plan includes every product, every feature, and your own live website.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
              >
                Start free today <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-8 py-3.5 text-base font-bold text-foreground transition-all hover:bg-muted"
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
