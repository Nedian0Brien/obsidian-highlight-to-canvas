import { describe, expect, it } from "vitest";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber } from "pdf-lib";
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

    expect(result.annotationFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(annots).toBeTruthy();
  });

  it("compresses highlight geometry and sets opacity so saved highlights stay text-sized", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 400]);
    const bytes = await doc.save();

    const result = await writeHighlightAnnotation(bytes, {
      pageNumber: 1,
      selectedText: "Highlighted text",
      pdfRects: [{ x: 40, y: 300, width: 120, height: 20 }],
      color: "#f59e0b"
    });

    const updated = await PDFDocument.load(result.bytes);
    const page = updated.getPage(0);
    const annots = page.node.lookup(PDFName.of("Annots"), PDFArray);
    const annotation = annots.lookup(0, PDFDict);
    const rect = readNumberArray(annotation.lookup(PDFName.of("Rect"), PDFArray));
    const quadPoints = readNumberArray(annotation.lookup(PDFName.of("QuadPoints"), PDFArray));
    const opacity = annotation.lookup(PDFName.of("CA"), PDFNumber).asNumber();

    expect(rect).toEqual([40, 304, 160, 316]);
    expect(quadPoints).toEqual([40, 316, 160, 316, 40, 304, 160, 304]);
    expect(opacity).toBe(0.35);
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

function readNumberArray(array: PDFArray): number[] {
  return Array.from({ length: array.size() }, (_, index) => array.lookup(index, PDFNumber).asNumber());
}
