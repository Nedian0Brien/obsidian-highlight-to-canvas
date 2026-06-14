import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { writeHighlightAnnotation } from "../src/pdf/pdfAnnotationWriter";

describe("pdfAnnotationWriter", () => {
  it("writes a highlight annotation to a PDF page", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 400]);
    const bytes = await doc.save();

    const result = await writeHighlightAnnotation(bytes, {
      pageNumber: 1,
      selectedText: "Highlighted text",
      pdfRects: [{ x: 40, y: 300, width: 120, height: 18 }],
      color: "#f59e0b"
    });

    const updated = await PDFDocument.load(result.bytes);
    const page = updated.getPage(0);
    const annots = page.node.lookup(PDFName.of("Annots"));

    expect(result.annotationFingerprint.startsWith("sha256:")).toBe(true);
    expect(annots).toBeTruthy();
  });

  it("rejects page numbers outside the document", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 400]);
    const bytes = await doc.save();

    await expect(
      writeHighlightAnnotation(bytes, {
        pageNumber: 2,
        selectedText: "Bad page",
        pdfRects: [{ x: 40, y: 300, width: 120, height: 18 }],
        color: "#f59e0b"
      })
    ).rejects.toThrow("PDF page 2 does not exist");
  });
});

