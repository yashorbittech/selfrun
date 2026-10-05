"use client";

import { PanelName } from "@/components/platform/PanelsProvider";
import { MobileSidebarProfile } from "@/components/lms/SidebarCollapseContext";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import SeoSidebar from "@/components/seo/SeoSidebar";
import BrandMark from "@/components/BrandMark";
import type { SeoNavFlags } from "@/components/seo/SeoSidebar";
import { BrandName } from "@/components/platform/BrandProvider";

export default function SeoMobileSidebar({ flags }: { flags: SeoNavFlags }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation menu">
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only"><PanelName panel="seo" fallback="SEO" /> navigation menu</SheetDescription>
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
            <BrandMark className="size-6 shrink-0" />
            <span className="text-sm font-bold">
              <BrandName />
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SeoSidebar flags={flags} onNavigate={() => setOpen(false)} />
          </div>
          <MobileSidebarProfile />
        </SheetContent>
      </Sheet>
    </>
  );
}
