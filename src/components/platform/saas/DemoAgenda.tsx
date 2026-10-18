"use client";

import { useState } from "react";
import { Check, Compass, Workflow, Rocket } from "lucide-react";

const AGENDA = [
  { id: "map", label: "Map your process", icon: Compass, title: "Start with your workflow", copy: "Choose one process your team wants to improve. We’ll clarify the people, handoffs and information involved before opening the product.", points: ["Your current steps and handoffs", "Where work gets delayed or repeated"] },
  { id: "explore", label: "Explore the product", icon: Workflow, title: "Follow it through SelfRun", copy: "See the relevant products together and how a connected record can move through the workflow, with AI and automation where they fit.", points: ["Relevant product screens and modules", "Approvals, permissions and automation"] },
  { id: "plan", label: "Plan next steps", icon: Rocket, title: "Leave with a practical next step", copy: "Review what a starting setup could include, raise open questions and decide whether a deeper evaluation makes sense for your team.", points: ["Suggested starting scope", "Questions about setup, access and rollout"] },
];

export default function DemoAgenda() {
  const [activeId, setActiveId] = useState(AGENDA[0].id);
  const active = AGENDA.find((item) => item.id === activeId) ?? AGENDA[0];
  const ActiveIcon = active.icon;
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-transparent to-brand-accent/[0.08] p-5 sm:p-7">
        <p className="sr-eyebrow">Your 30-minute walkthrough</p>
        <h3 className="mt-2 text-xl font-black">Choose a step to preview</h3>
        <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Guided demo agenda">
          {AGENDA.map((item, index) => {
            const Icon = item.icon;
            const selected = item.id === activeId;
            return <button key={item.id} id={`agenda-tab-${item.id}`} type="button" role="tab" aria-selected={selected} aria-controls="agenda-panel" onClick={() => setActiveId(item.id)} className={`flex min-h-16 flex-col items-start justify-center gap-1.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all active:scale-[0.98] sm:flex-row sm:items-center sm:gap-2 sm:text-sm ${selected ? "border-primary bg-primary text-white shadow-md shadow-primary/20" : "border-border/60 bg-background hover:border-primary/40 hover:shadow-sm"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${selected ? "bg-white/15" : "bg-muted"}`}>{selected ? <Icon className="h-3.5 w-3.5" /> : `0${index + 1}`}</span><span>{item.label}</span></button>;
          })}
        </div>
      </div>
      <div id="agenda-panel" role="tabpanel" aria-labelledby={`agenda-tab-${active.id}`} className="p-5 sm:p-7">
        {/* re-runs the system's sr-in fade whenever another step is picked */}
        <div key={active.id} style={{ animation: "sr-in .35s ease both" }}>
          <div className="flex items-start gap-4"><span className="sr-icon h-12 w-12 shrink-0"><ActiveIcon className="h-5 w-5" /></span><div><p className="sr-eyebrow">Step 0{AGENDA.findIndex((item) => item.id === active.id) + 1}</p><h4 className="mt-1 text-xl font-black">{active.title}</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.copy}</p></div></div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">{active.points.map((point) => <li key={point} className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{point}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
