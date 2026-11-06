import JSZip from "jszip";
import { parseDoc, sequentialIds } from "../src/lib/products/playbook-ai/doc";
import { renderDocx } from "../src/lib/products/playbook-ai/doc/render/docx";
import { OFFER_LISTS, OFFER_VALUES, offerLetterRaw } from "./lib/pbdoc-fixtures";
(async () => {
  const mk = async () => { const r = parseDoc(offerLetterRaw(), { assignIds: true, idFactory: sequentialIds() }); if (!r.ok) throw 1; return (await renderDocx(r.doc, { meta: { title: "O", dateIso: "2026-11-05" }, values: OFFER_VALUES, lists: OFFER_LISTS })).buffer; };
  const a = await JSZip.loadAsync(await mk()); const b = await JSZip.loadAsync(await mk());
  for (const n of Object.keys(a.files)) { const x = await a.files[n].async("nodebuffer"); const y = await b.files[n].async("nodebuffer"); if (!x.equals(y)) { console.log("differs:", n, x.length, y.length); if (n.endsWith(".xml") || n.endsWith("rels")) { const sx = x.toString(), sy = y.toString(); let i = 0; while (sx[i] === sy[i]) i++; console.log(sx.slice(i - 60, i + 80), "\n---\n", sy.slice(i - 60, i + 80)); } } }
})();
