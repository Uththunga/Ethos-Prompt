# OCR/Table Extraction Deployment Notes

This project includes optional OCR and table extraction enhancements for PDF processing:

- Python packages: pdfplumber, pytesseract, pillow
- System dependency: Tesseract OCR binary (required for pytesseract)

Behavior:
- If optional packages/binaries are present: enhanced OCR and table extraction are enabled.
- If not present: the system gracefully falls back to standard text extraction (no OCR/tables).

Firebase Cloud Functions considerations:
- The default Node.js/Python runtimes do not ship with the Tesseract binary. To enable OCR in production, consider:
  - Using a separate microservice (Cloud Run) with a custom image including Tesseract
  - Or building a custom Cloud Functions runtime layer with Tesseract
- Keep function cold start in mind: keep dependencies minimal in Functions; offload heavy OCR to Cloud Run where possible.

Local development:
- Install Tesseract binary locally (Windows: install from official site; macOS: `brew install tesseract`; Linux: `apt-get install tesseract-ocr`).
- Ensure the `tesseract` executable is on PATH so `pytesseract` can find it.

Troubleshooting:
- If OCR returns empty text, verify the Tesseract installation and language packs.
- For tables, pdfplumber works best with high-quality PDFs; extraction quality varies by document.

