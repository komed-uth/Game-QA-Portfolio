import { readFile, readdir } from "node:fs/promises";

const reportDataScript = /(<script\b[^>]*\bid=["']meerkatData["'][^>]*>)([\s\S]*?)(<\/script>)/i;

export function parseReportData(html) {
  const embedded = html.match(reportDataScript);
  if (!embedded) throw new Error("Missing meerkatData report JSON");
  const data = JSON.parse(embedded[2]);
  if (!Array.isArray(data)) throw new Error("Report data must be an array");
  return data;
}

export function replaceReportData(html, data) {
  // Validate the original block so replacement cannot conceal malformed report data.
  parseReportData(html);
  return html.replace(reportDataScript, (_, start, _original, end) => start + JSON.stringify(data) + end);
}

export function inspectOverlayData(html) {
  const graphs = parseReportData(html).filter(element => !element.excludeFromHtml && "screenshotPathList" in element);
  const paths = graphs.flatMap(graph => {
    if (!Array.isArray(graph.screenshotPathList) || graph.screenshotPathList.some(path => typeof path !== "string")) {
      throw new Error("screenshotPathList must be an array of strings");
    }
    return graph.screenshotPathList.filter(path => path.trim());
  });
  return { graphs: graphs.length, paths: paths.length };
}

export async function checkOverlayReadiness(directory = new URL("../../Performance-Testing-Mobile/Full Report/", import.meta.url)) {
  const filenames = (await readdir(directory)).filter(name => name.endsWith(".html")).sort();
  if (!filenames.length) throw new Error("No supplied HTML reports found");
  for (const filename of filenames) {
    let readiness;
    try {
      readiness = inspectOverlayData(await readFile(new URL(filename, directory), "utf8"));
    } catch (error) {
      throw new Error(`${filename}: ${error.message}`, { cause: error });
    }
    if (readiness.paths === 0) {
      console.log(`SKIP: real capture overlay checks — ${filename}: ${readiness.graphs ? "screenshotPathList is empty" : "no screenshot path data"}.`);
    } else {
      console.log(`INFO: ${filename}: ${readiness.paths} supplied screenshot paths; file availability and real chart-to-image interaction still require certification.`);
    }
  }
  console.log("COVERAGE: the synthetic overlay fixture checks modal integration; it does not certify real capture images.");
}
