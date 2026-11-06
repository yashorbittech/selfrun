import React from "react";
import { Document, Page, Text, View, Font, renderToBuffer } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";
const e = React.createElement;
Font.register({ family: "NotoSans", fonts: [{ src: "src/lib/fonts/noto/NotoSans-Regular.ttf" }] });
const R = ({ pageNumber }: any) => `FOOT-${pageNumber}`;
(async () => {
  const cases: Record<string, any> = {
    base: { },
    font: { fontFamily: "NotoSans" },
    lh: { lineHeight: 1.4 },
    mb: { marginBottom: 6 },
    align: { textAlign: "center" },
    color: { color: "#1F2937", fontSize: 9 },
  };
  for (const [k, st] of Object.entries(cases)) {
    const doc = e(Document, null, e(Page, { size: "A4", style: { padding: 40, fontFamily: "NotoSans" } }, e(Text, null, "Body"), e(View, { fixed: true, style: { position: "absolute", left: 40, right: 40, bottom: 30 } }, e(Text, { style: st, render: R }))));
    writeFileSync(`${process.argv[2]}/k-${k}.pdf`, await renderToBuffer(doc));
  }
})();
