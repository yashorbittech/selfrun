"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Sparkles,
  Plus,
  Edit3,
  Check,
  Tag,
  Clock,
  Layers,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/lib/dealflow-ai/knowledge-base";

export default function KnowledgeBaseClient({
  initialItems,
}: {
  initialItems: KnowledgeItem[];
}) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>(initialItems[0]?.id || "");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSummary, setEditSummary] = useState("");

  const filteredItems = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedItem = items.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null;

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditTitle(selectedItem.title);
    setEditSummary(selectedItem.summary);
    setEditContent(selectedItem.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    const updated: KnowledgeItem = {
      ...selectedItem,
      title: editTitle,
      summary: editSummary,
      content: editContent,
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? updated : item)));
    setIsEditing(false);
    toast.success("Knowledge Base article updated! All 4 AI channels will now use this updated context.");
  };

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[600px] flex-col gap-4">
      {/* Top Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-brand-accent/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <BookOpen className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-black text-foreground">
              Universal AI Context Engine
            </h3>
            <p className="text-xs text-muted-foreground">
              When AI generates replies in Chat, Email, WhatsApp, or speaks on AI Voice Calls, it consults these verified facts.
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-600 flex items-center gap-1.5">
          <Check className="size-3.5" /> Synchronized Across All 4 Channels
        </span>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1 text-xs">
          {[
            { id: "all", label: "All Topics" },
            { id: "services", label: "Services & Tech" },
            { id: "pricing", label: "Pricing & Retainers" },
            { id: "jobs", label: "Careers & Jobs" },
            { id: "internships", label: "Internships" },
            { id: "training", label: "Industrial Training" },
            { id: "company", label: "Company & SLA" },
            { id: "faqs", label: "FAQs" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "rounded-lg px-3 py-1 font-semibold transition-colors",
                activeCategory === cat.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge base articles..."
            className="rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Two-Pane Knowledge Base Explorer */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        {/* Left Articles List */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm md:col-span-5">
          <div className="border-b border-border/60 bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Knowledge Articles ({filteredItems.length})
          </div>

          <div className="min-h-0 flex-1 divide-y divide-border/40 overflow-y-auto">
            {filteredItems.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setIsEditing(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 p-4 text-left transition-colors",
                    isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex w-full items-center justify-between text-xs">
                    <span className="font-black text-foreground truncate">{item.title}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground mt-0.5">
                    {item.summary}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                    {item.keywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="rounded bg-muted/60 px-1 py-0.2">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Article Viewer & Editor */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:col-span-7">
          {selectedItem ? (
            <div className="flex h-full min-h-0 flex-col">
              {/* Header */}
              <div className="border-b border-border/60 bg-muted/20 p-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-foreground">{selectedItem.title}</h3>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {selectedItem.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{selectedItem.summary}</p>
                </div>

                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEdit}
                    className="gap-1.5 rounded-xl text-xs"
                  >
                    <Edit3 className="size-3.5" /> Edit Content
                  </Button>
                )}
              </div>

              {/* Content Body */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground">Article Title</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground">Short Summary</label>
                      <Input
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground">Article Knowledge Content</label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={12}
                        className="mt-1 rounded-xl text-xs font-sans leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} className="gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                        <Check className="size-3.5" /> Save to Knowledge Base
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/50 bg-background/90 p-5 text-xs font-sans leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedItem.content}
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Indexed Search Keywords:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.keywords.map((kw) => (
                          <span key={kw} className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              Select an article to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
