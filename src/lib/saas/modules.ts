import "server-only";
import { listPanels } from "@/lib/platform/panels/store";
import { MODULE_COPY, type ModuleCopy } from "@/lib/saas/content";
import { FEATURE_GROUPS, type FeatureGroup } from "@/lib/saas/site";

export interface FeatureModule extends ModuleCopy {
  key: string;
  name: string;
  description: string;
}

/** Every active product module that has marketing copy, named and described by the Panel Registry (the product itself), in registry order. */
export async function getFeatureModules(): Promise<FeatureModule[]> {
  const panels = await listPanels().catch(() => []);
  return panels
    .filter((p) => p.active && MODULE_COPY[p.key])
    .map((p) => ({ ...MODULE_COPY[p.key], key: p.key, name: p.name, description: p.description }));
}

/** The feature groups with their modules resolved (empty groups dropped). */
export async function getFeatureGroups(): Promise<(FeatureGroup & { items: FeatureModule[] })[]> {
  const mods = await getFeatureModules();
  const byKey = new Map(mods.map((m) => [m.key, m]));
  const used = new Set<string>();
  const groups = FEATURE_GROUPS.map((g) => {
    const items = g.modules.flatMap((k) => (byKey.get(k) ? (used.add(k), [byKey.get(k)!]) : []));
    return { ...g, items };
  });
  // A module the registry holds but no group names still belongs on the page.
  const rest = mods.filter((m) => !used.has(m.key));
  if (rest.length) groups.push({ id: "more", title: "More modules", lead: "Further modules in the platform.", icon: "layers", modules: rest.map((m) => m.key), items: rest });
  return groups.filter((g) => g.items.length > 0);
}
