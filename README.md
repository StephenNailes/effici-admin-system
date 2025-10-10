# EFFICI Admin System – Developer Notes

## PDF generation removed

Server-side PDF generation (Spatie Browsershot + headless Chrome) has been fully removed from this project. There are no remaining routes, UI, or dependencies for PDF export.

What to do instead:
- Use the in-app HTML preview to review documents.
- To produce a PDF ad-hoc, use the browser's native Print to PDF from the preview page. Ensure margins and headers/footers are configured as desired in the print dialog.

If a future server-side export is needed, consider adding it as a new, isolated feature (e.g., via a dedicated queue job and a maintained renderer). For now, the codebase intentionally contains no PDF generation logic or configuration.
