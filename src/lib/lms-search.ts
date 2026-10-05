import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { CATEGORIES, collectionNameFor, type CategorySlug } from "@/lib/categories";
import { APPLICATIONS_COLLECTION } from "@/lib/career-applications";
import { escapeRegExp } from "@/lib/text-search";

interface RawLeadDoc {
  _id: ObjectId;
  name: string;
  email?: string;
  phone: string;
  createdAt: Date;
}

interface RawApplicationDoc {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  positionTitle: string;
  createdAt: Date;
}

export interface GlobalSearchLeadItem {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: string;
}

export interface GlobalSearchLeadGroup {
  category: CategorySlug;
  label: string;
  items: GlobalSearchLeadItem[];
}

export interface GlobalSearchApplicationItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionTitle: string;
  createdAt: string;
}

export interface GlobalSearchResult {
  leads: GlobalSearchLeadGroup[];
  applications: GlobalSearchApplicationItem[];
}

const MIN_QUERY_LENGTH = 2;

export async function globalLmsSearch(query: string, limit = 5): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return { leads: [], applications: [] };

  const regex = new RegExp(escapeRegExp(trimmed), "i");
  const filter = { $or: [{ name: regex }, { email: regex }, { phone: regex }] };
  const db = await getDb();

  const [leadGroups, applicationDocs] = await Promise.all([
    Promise.all(
      CATEGORIES.map(async (c) => {
        const collection = db.collection<RawLeadDoc>(collectionNameFor(c.slug));
        const docs = await collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
        return {
          category: c.slug,
          label: c.label,
          items: docs.map((d) => ({
            id: String(d._id),
            name: d.name,
            email: d.email,
            phone: d.phone,
            createdAt: new Date(d.createdAt).toISOString(),
          })),
        };
      })
    ),
    db.collection<RawApplicationDoc>(APPLICATIONS_COLLECTION).find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
  ]);

  return {
    leads: leadGroups.filter((g) => g.items.length > 0),
    applications: applicationDocs.map((d) => ({
      id: String(d._id),
      name: d.name,
      email: d.email,
      phone: d.phone,
      positionTitle: d.positionTitle,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
  };
}
