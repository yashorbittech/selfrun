import Icon from "@/components/saas/Icon";
import type { IconKey } from "@/lib/saas/content";

/** An endless strip of the platform's module names. */
export default function ModuleMarquee({ items }: { items: { name: string; icon: IconKey }[] }) {
  const row = [...items, ...items];
  return (
    <div className="sr-marquee-wrap" aria-label="Modules on the platform" role="list">
      <div className="sr-marquee">
        {row.map((x, i) => (
          <span key={`${x.name}-${i}`} role="listitem" aria-hidden={i >= items.length} className="sr-chip" style={{ padding: "8px 16px", fontSize: 14 }}>
            <Icon name={x.icon} className="size-4" />
            {x.name}
          </span>
        ))}
      </div>
    </div>
  );
}
