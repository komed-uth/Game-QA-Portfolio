import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = new URL(
  "../Performance-Testing-Mobile/Full Report/",
  import.meta.url,
);
const destination = new URL(
  "../public/Performance-Testing-Mobile/Full Report/",
  import.meta.url,
);
const filenames = [
  "S10_Very_High_Fixed.html",
  "S10_High_Fixed.html",
  "S10_Medium_Fixed.html",
  "S10_Low_Fixed.html",
  "S10_Very_Low_Fixed.html",
];
const presentation = `<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../report-responsive.css">
`;

await mkdir(destination, { recursive: true });
for (const filename of filenames) {
  const original = await readFile(new URL(filename, source), "utf8");
  if (!original.includes("</head>")) {
    throw new Error(`Missing report head: ${filename}`);
  }
  // Only add presentation metadata and CSS; capture data and chart scripts stay intact.
  await writeFile(
    new URL(filename, destination),
    original.replace("</head>", `${presentation}</head>`),
  );
}
console.log(
  `Prepared ${filenames.length} responsive reports from unchanged original evidence.`,
);
