import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";

const IMGPATH = "public";

const slides = [
  {
    title: "AI Dashboard App",
    bullets: [
      "Unified workspace for models, ontology, prompts, AI chat",
      "Branch: three-panel"
    ],
    notes: "Intro – integration of structured + unstructured knowledge."
  },
  {
    title: "Architecture Overview",
    img: { file: "architecture.png", w: 9, h: 5, x: 1, y: 1, alt: "Architecture diagram" },
    bullets: ["Next.js App Router", "Redux modelSlice", "LLM integration", "Modular builders"]
  },
  {
    title: "Data Flow",
    img: { file: "data-flow.png", w: 9, h: 5, x: 1, y: 1 },
    bullets: ["Prompt -> AI -> OutputPanel", "mergeModels", "Redux update", "UI re-render"]
  },
  {
    title: "OutputPanel Anatomy",
    img: { file: "panel-anatomy.png", w: 8, h: 4.5, x: 1.25, y: 1.2 },
    bullets: ["Three tabs", "Dispatch button", "Markdown preview", "Modelview card"]
  },
  {
    title: "Model Merge Logic",
    img: { file: "model-merge.png", w: 6.5, h: 4, x: 2, y: 1.4 },
    bullets: ["Union by id", "Incoming overrides scalar fields", "Preserves modelviews"]
  },
  {
    title: "State Layers",
    img: { file: "state-layers.png", w: 8, h: 4.5, x: 1.2, y: 1.2 },
    bullets: ["UI dispatches actions", "Slice holds canonical data", "Schemas underpin types"]
  },
  {
    title: "Builders Ecosystem",
    img: { file: "ecosystem.png", w: 7.5, h: 4.2, x: 1.5, y: 1.3 },
    bullets: ["Domain", "Model", "Ontology", "Prompt", "IRTV"]
  },
  {
    title: "Testing & Quality",
    bullets: ["Jest setup", "Add reducer tests", "Snapshot UI", "Schema validation tests"]
  },
  {
    title: "Roadmap",
    bullets: ["Persistence layer", "Graph visualization", "Autosave", "Versioning", "Plugin pipeline"]
  },
  {
    title: "Summary",
    bullets: ["Integrated AI modeling loop", "Extensible modules", "Structured + unstructured synergy"]
  }
];

async function main() {
  const pres = new PptxGenJS();
  pres.author = "AI Dashboard Auto-Gen";
  pres.company = "Your Org";
  pres.title = "AI Dashboard App";
  pres.layout = "LAYOUT_16x9";

  slides.forEach(spec => {
    const slide = pres.addSlide();
    slide.addText(spec.title, {
      x: 0.5, y: 0.3, fontSize: 30, bold: true, color: "203040"
    });
    if (spec.bullets?.length) {
      slide.addText(spec.bullets.map(b => "• " + b).join("\n"), {
        x: 0.7, y: 1.2, fontSize: 16, color: "202020", breakLine: true
      });
    }
    if (spec.img) {
      const imgPath = path.join(IMGPATH, spec.img.file);
      if (fs.existsSync(imgPath)) {
        slide.addImage({
          path: imgPath,
          x: spec.img.x ?? 5.5,
          y: spec.img.y ?? 1.0,
          w: spec.img.w ?? 4,
          h: spec.img.h,
          altText: spec.img.alt || spec.title
        });
      } else {
        slide.addText(`(Missing image: ${spec.img.file})`, { x: 5, y: 3, color: "aa0000" });
      }
    }
    if (spec.notes) slide.addNotes(spec.notes);
  });

  fs.mkdirSync("dist", { recursive: true });
  const outFile = "dist/ai-dashboard-app.pptx";
  await pres.writeFile({ fileName: outFile });
  console.log("Wrote", outFile);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});