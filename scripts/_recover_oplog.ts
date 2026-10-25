import { MongoClient, type Document } from "mongodb";

// Rebuilds `testing` from the replica-set oplog (ops of namespace testing.* up to CUTOFF) into a NEW database, never into `testing` itself.
const SRC = "testing";
const DST = process.env.DST || "testing_recovered";
const CUTOFF = new Date(process.env.CUTOFF || "2026-10-25T02:28:44.000Z");

function applyDiff(doc: Document, diff: Document): void {
  for (const k of Object.keys(diff)) {
    if (k === "d") for (const f of Object.keys(diff.d)) delete doc[f];
    else if (k === "i" || k === "u") for (const [f, v] of Object.entries(diff[k])) doc[f] = v;
    else if (k[0] === "s" && k.length > 1) {
      const name = k.slice(1);
      const sub = diff[k];
      if (sub && sub.a === true) {
        const arr: unknown[] = Array.isArray(doc[name]) ? doc[name] : [];
        for (const kk of Object.keys(sub)) {
          if (kk === "a") continue;
          if (kk === "l") arr.length = sub.l;
          else if (kk[0] === "u") arr[Number(kk.slice(1))] = sub[kk];
          else if (kk[0] === "s") {
            const idx = Number(kk.slice(1));
            const el = (arr[idx] ?? {}) as Document;
            applyDiff(el, sub[kk]);
            arr[idx] = el;
          }
        }
        doc[name] = arr;
      } else {
        const el = (doc[name] ?? {}) as Document;
        applyDiff(el, sub);
        doc[name] = el;
      }
    }
  }
}

const stats: Record<string, number> = {};
const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1);

(async () => {
  const c = await MongoClient.connect("mongodb://localhost:27017");
  const op = c.db("local").collection("oplog.rs");
  const dst = c.db(DST);
  await dst.dropDatabase().catch(() => {});

  const apply = async (r: Document) => {
    const coll = String(r.ns).split(".").slice(1).join(".");
    if (r.op === "i") {
      try { await dst.collection(coll).insertOne(r.o); bump("insert"); } catch (e: any) { if (e.code === 11000) bump("insert-dup"); else throw e; }
    } else if (r.op === "d") {
      await dst.collection(coll).deleteOne({ _id: r.o._id }); bump("delete");
    } else if (r.op === "u") {
      const id = r.o2._id;
      const o = r.o as Document;
      if (o.$v === 2 && o.diff) {
        const cur = await dst.collection(coll).findOne({ _id: id });
        if (!cur) { bump("update-missing-doc"); return; }
        applyDiff(cur, o.diff);
        await dst.collection(coll).replaceOne({ _id: id }, cur);
        bump("update-diff");
      } else if (Object.keys(o).some((k) => k.startsWith("$"))) {
        const { $v, ...mods } = o;
        void $v;
        await dst.collection(coll).updateOne({ _id: id }, mods);
        bump("update-mod");
      } else {
        await dst.collection(coll).replaceOne({ _id: id }, o, { upsert: true });
        bump("update-replace");
      }
    } else if (r.op === "c") {
      const o = r.o as Document;
      const name = Object.keys(o)[0];
      if (name === "create") {
        const { create, idIndex, uuid, ...opts } = o;
        void idIndex; void uuid;
        try { await dst.createCollection(create, opts); } catch { /* exists */ }
        bump("create");
      } else if (name === "createIndexes" || name === "commitIndexBuild") {
        const list: Document[] = name === "commitIndexBuild" ? o.indexes : [o];
        const collName = name === "commitIndexBuild" ? o.commitIndexBuild : o.createIndexes;
        for (const ix of list) {
          const { v, key, name: ixName, ns, ...opts } = ix as Document;
          void v; void ns; delete (opts as Document).createIndexes; delete (opts as Document).commitIndexBuild; delete (opts as Document).indexBuildUUID; delete (opts as Document).indexes;
          try { await dst.collection(collName).createIndex(key, { name: ixName, ...opts }); bump("index"); } catch (e: any) { bump("index-fail:" + (e.codeName ?? e.code)); }
        }
      } else if (name === "drop") {
        await dst.collection(o.drop).drop().catch(() => {}); bump("drop");
      } else if (name === "dropIndexes") {
        await dst.collection(o.dropIndexes).dropIndex(o.index).catch(() => {}); bump("dropIndex");
      } else if (name === "renameCollection") {
        const to = String(o.to).split(".").slice(1).join(".");
        await dst.collection(String(o.renameCollection).split(".").slice(1).join(".")).rename(to, { dropTarget: !!o.dropTarget }).catch(() => {}); bump("rename");
      } else if (name === "dropDatabase") {
        bump("dropDatabase-SEEN");
      } else bump("cmd-skipped:" + name);
    }
  };

  const cur = op.find({ $or: [{ ns: /^testing\./ }, { ns: "admin.$cmd", "o.applyOps": { $exists: true } }], wall: { $lt: CUTOFF } }).sort({ $natural: 1 });
  let n = 0;
  for await (const r of cur) {
    if (r.ns === "admin.$cmd") {
      for (const inner of (r.o.applyOps as Document[]) ?? []) if (String(inner.ns).startsWith("testing.")) await apply(inner);
    } else await apply(r);
    n++;
  }
  console.log("replayed", n, "ops up to", CUTOFF.toISOString());
  console.log(stats);
  const cols = await dst.listCollections().toArray();
  let docs = 0;
  for (const col of cols) docs += await dst.collection(col.name).estimatedDocumentCount();
  console.log(`${DST}: ${cols.length} collections, ${docs} documents`);
  await c.close();
})();
