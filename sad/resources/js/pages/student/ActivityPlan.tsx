import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { router, usePage } from '@inertiajs/react';
import { getCsrfMetaToken, refreshCsrfToken } from '@/lib/csrf';
import ReactSignatureCanvas from 'react-signature-canvas';
import MainLayout from "@/layouts/mainlayout";
import SubmissionModal from "@/components/SubmissionModal";
import SignatureWarningModal from "@/components/SignatureWarningModal";
import PDFPreviewModal from "@/components/PDFPreviewModal";
// Local type definitions (no external template export/generation)
export type Member = { name: string; role: string };
export type Signatory = { name: string; position: string };
export type SignatoriesMap = Record<string, Signatory[]>;
import { useActivityPlanIO } from "@/hooks/useActivityPlanIO";
import uicLogo from "/public/images/uic-logo.png";
import tuvCertified from "/public/images/tuv-certified.jpg";
import uicFooter from "/public/images/uic-footer.jpg";
import axios from 'axios';
import {
  Undo2,
  Redo2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  List as BulletListIcon,
  ListOrdered as NumberListIcon,
  Printer as PrinterIcon,
  Eye as EyeIcon,
  FileText as FileTextIcon,
  Save as SaveIcon,
} from "lucide-react";

/*---------- Types ----------*/
// Member, Signatory, SignatoriesMap now imported from templateExport

/*---------- Small inline SVG Icons ----------*/
type IconProps = React.SVGProps<SVGSVGElement>;

const IconPin = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPhone = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v2a2 2 0 0 1-2.18 2A19 19 0 0 1 3.08 4.18 2 2 0 0 1 5.1 2h2a2 2 0 0 1 2 1.72c.1.78.27 1.55.5 2.3a2 2 0 0 1-.45 2.11L8.6 9.5a16 16 0 0 0 6 6l1.37-1.37a2 2 0 0 1 2.11-.45c.75.23 1.52.4 2.3.5A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const IconPrinter = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9V4h12v5" />
    <rect x="6" y="9" width="12" height="8" rx="2" />
    <path d="M6 17h12M8 13h2m4 0h4" />
  </svg>
);

const IconGlobe = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a16 16 0 0 1 0 20a16 16 0 0 1 0-20Z" />
  </svg>
);

const IconMail = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

/*---------- Styling (CSS) ----------*/
const GlobalStyles = () => (
  <style id="ap-global-css">{`
    /* Removed page-level Tailwind import to avoid conflicting resets with app Tailwind */
    /* Fonts loaded globally by app; no @import needed here to avoid side effects */
    
    :root { --brand-pink: #FF67D3; }
    /* Force base text color to black within Activity Plan scope */
    .ap-scope, .ap-scope .App, .ap-scope .page, .ap-scope .main-text, .ap-scope .static-content, .ap-scope .editable-content, .ap-scope .signatories-container, .ap-scope .sidebar, .ap-scope .page-footer, .ap-scope .formatting-toolbar {
      color: #000;
    }
    /* Override Tailwind utilities ONLY inside Activity Plan scope */
    .ap-scope .text-gray-50, .ap-scope .text-gray-100, .ap-scope .text-gray-200, .ap-scope .text-gray-300, .ap-scope .text-gray-400,
    .ap-scope .text-gray-500, .ap-scope .text-gray-600, .ap-scope .text-gray-700, .ap-scope .text-gray-800, .ap-scope .text-gray-900 { color: #000 !important; }
    .ap-scope .text-pink-50, .ap-scope .text-pink-100, .ap-scope .text-pink-200, .ap-scope .text-pink-300, .ap-scope .text-pink-400,
    .ap-scope .text-pink-500, .ap-scope .text-pink-600, .ap-scope .text-pink-700, .ap-scope .text-pink-800, .ap-scope .text-pink-900 { color: var(--brand-pink) !important; }
    .ap-scope .border-pink-50, .ap-scope .border-pink-100, .ap-scope .border-pink-200, .ap-scope .border-pink-300, .ap-scope .border-pink-400,
    .ap-scope .border-pink-500, .ap-scope .border-pink-600, .ap-scope .border-pink-700, .ap-scope .border-pink-800, .ap-scope .border-pink-900 { border-color: var(--brand-pink) !important; }
    .ap-scope .bg-pink-50, .ap-scope .bg-pink-100, .ap-scope .bg-pink-200, .ap-scope .bg-pink-300, .ap-scope .bg-pink-400,
    .ap-scope .bg-pink-500, .ap-scope .bg-pink-600, .ap-scope .bg-pink-700, .ap-scope .bg-pink-800, .ap-scope .bg-pink-900 { background-color: var(--brand-pink) !important; }
    .ap-scope .hover\:bg-pink-50:hover, .ap-scope .hover\:bg-pink-100:hover, .ap-scope .hover\:bg-pink-200:hover, .ap-scope .hover\:bg-pink-300:hover, .ap-scope .hover\:bg-pink-400:hover,
    .ap-scope .hover\:bg-pink-500:hover, .ap-scope .hover\:bg-pink-600:hover, .ap-scope .hover\:bg-pink-700:hover, .ap-scope .hover\:bg-pink-800:hover, .ap-scope .hover\:bg-pink-900:hover { background-color: var(--brand-pink) !important; }
    .ap-scope .hover\:text-pink-50:hover, .ap-scope .hover\:text-pink-100:hover, .ap-scope .hover\:text-pink-200:hover, .ap-scope .hover\:text-pink-300:hover, .ap-scope .hover\:text-pink-400:hover,
    .ap-scope .hover\:text-pink-500:hover, .ap-scope .hover\:text-pink-600:hover, .ap-scope .hover\:text-pink-700:hover, .ap-scope .hover\:text-pink-800:hover, .ap-scope .hover\:text-pink-900:hover { color: var(--brand-pink) !important; }

  /* Header exception: let gray text be gray in the screen-only header to match BorrowEquipment */
  .ap-scope .ap-screen-header .text-gray-600 { color: #4b5563 !important; }

    /* --- Base Styles (scoped) --- */
    /* Avoid affecting MainLayout header and screen-only header; keep Times inside document areas only via specific blocks below */
    /* Ensure Poppins applies where requested, overriding the Times base */
    .ap-scope .font-poppins { 
      font-family: 'Poppins', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji" !important;
      font-weight: 400 !important; /* explicit normal weight */
    }
    .ap-scope .font-poppins.font-bold {
      font-weight: 700 !important; /* explicit bold */
    }
    .ap-scope .App {
      background-color: #ffffff; /* remove gray background */
      padding: 2rem 0;
    }

    /* --- Page Layout for Screen View --- */
    .ap-scope .page {
      background: white; 
      width: 210mm; 
      height: 297mm; 
      max-height: 297mm;
      margin: 20px auto; 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* subtle shadow on screen */
  border: 1px solid #374151; /* Tailwind gray-700 for even stronger visibility */
      box-sizing: border-box; 
      display: flex; 
      flex-direction: column;
      page-break-after: always; 
      page-break-inside: avoid; 
      overflow: hidden;
      padding: 0mm;
    }
    /* Zoom wrapper: centers scaled pages; toolbar stays unscaled */
    .ap-scope .pages-viewport { display: flex; justify-content: center; }
    .ap-scope .pages-scale-wrapper { display: inline-block; transform-origin: top center; }
  /* Screen-only page header handled via Tailwind classes in markup; no scoped CSS needed */
    .ap-scope #page-header {
      padding-left: 6mm;
      padding-right: 13mm;
      padding-top: 6mm;
    }
    .ap-scope .page-content {
      padding-left: 6mm;
      padding-right: 13mm;
    }
    .ap-scope .page-footer { 
      flex-shrink: 0; 
      padding: 0 13mm 5mm 6mm;
      position: relative;
    }
  .ap-scope .page-content { 
        display: flex; 
        flex: 1;
        overflow: hidden;
    }
    .ap-scope .main-text { 
      flex: 1; 
      padding-left: 1.5rem; 
      position: relative; 
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .ap-scope .editable-content, .ap-scope .static-content { 
      outline: none; 
      line-height: 1.5; 
    }
    .ap-scope .static-content { 
      cursor: text; 
    }
    .ap-scope .editable-content:focus { 
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); 
      border-radius: 4px; 
    }
    .ap-scope .sidebar { 
      position: relative; 
      width: 130px; 
      align-self: stretch; 
      flex-shrink: 0; 
    }
    .ap-scope .sidebar-line { 
      position: absolute; 
      right: 4.09mm; 
      top: 1mm; 
      bottom: 40mm; /* stop before footer lines; increase to end higher, decrease to extend lower */
      border-right: 2px solid var(--brand-pink); 
    }

    /* --- Header rule helpers --- */
    .ap-scope .header-vertical-rule {
      position: absolute; left: 135.3px; top: 0; bottom: -2mm; width: 0; 
      border-left-width: 2px; border-left-style: solid; /* color via utility class */
    }
    .ap-scope .header-bottom-rule {
      position: absolute; left: 130px; right: 0; bottom: 3mm; /* adjust bottom to move the line up/down */
    }
    .ap-scope .header-left-bottom-rule {
      position: absolute; left: 0; bottom: 3mm; width: 130px; /* adjust bottom to move the line up/down */
    }

    /* Slight left nudge for header logo */
  .ap-scope .header-logo { margin-left: -9px; }

    /* --- Header typography --- */
  .ap-scope .header-title { font-family: Cambria, "Times New Roman", Times, serif; font-size: 18pt; font-style: italic; }
  .ap-scope .header-contacts { font-family: "Times New Roman", Times, serif; font-size: 8pt; line-height: 1.1; }
  .ap-scope .header-society { font-family: "Times New Roman", Times, serif; font-size: 9.5pt; }

    /* --- Footer rules (first page) --- */
    .ap-scope .footer-rules {
      position: absolute; top: -4mm; left: -6mm; right: 240px; /* screen: extend to left edge, shorten more on right to clear ISO */
    }
    /* --- Footer rules (middle/subsequent pages) - bleed to both edges --- */
    .ap-scope .footer-rules-middle {
      position: absolute; top: -4mm; left: -6mm; right: -13mm; /* screen: full bleed on both sides */
    }

    /* --- Footer accreditation text size --- */
    .ap-scope .footer-acc {
      font-size: 8.67px; /* ~6.5pt at 96dpi */
      line-height: 1.25;
      font-family: Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 700; /* Tahoma Bold */
    }
    .ap-scope .footer-acc-block { max-width: 148mm; margin-left: auto; margin-right: auto; }

    /* --- Formatting Toolbar (centered above first page, non-sticky) --- */
    .ap-scope .formatting-toolbar {
      position: sticky; /* follow page scroll */
      top: 12px; /* distance from top while scrolling */
      background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-radius: 0.75rem; padding: 0.35rem 0.5rem; display: flex; align-items: center;
      gap: 0.5rem; z-index: 30; width: fit-content; margin: 0 auto 1rem auto;
      backdrop-filter: saturate(1.1) blur(2px);
      font-size: 12px;
    }
    .ap-scope .formatting-toolbar .group { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0 0.25rem; }
    .ap-scope .formatting-toolbar .divider { width: 1px; background: #e5e7eb; margin: 0 0.5rem; align-self: stretch; }
  .ap-scope .formatting-toolbar .btn { padding: 0.25rem; border-radius: 0.5rem; border: none; background: transparent; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; font-size: 12px; }
    .ap-scope .formatting-toolbar .btn:hover:not(:disabled) { background: #f3f4f6; color: #ec4B99; }
    .ap-scope .formatting-toolbar .btn:disabled { cursor: not-allowed; opacity: 0.5; }
  .ap-scope .formatting-toolbar .select { height: 28px; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0 0.4rem; background: #fff; font-size: 12px; }

    /* --- Signatories Section --- */
    .ap-scope .signatories-container {
      margin-top: auto; /* Pushes signatories to the bottom */
      padding-top: 2rem;
      padding-bottom: 8mm; /* lift signatories above footer lines to avoid clipping (affects screen + print) */
      position: relative; /* Enable absolute positioning for signatures */
      min-height: 200px; /* Ensure enough space for signatures */
    }
    .ap-scope .signatory-item {
        break-inside: avoid;
    }
    .ap-scope .add-signatory-form {
      border: 1px dashed #d1d5db;
      border-radius: 0.5rem;
      background-color: #f9fafb;
    }
    .ap-scope .add-signatory-form input {
        width: 100%;
        font-size: 10pt;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        margin-bottom: 0.5rem;
    }

    /* --- Body content and signatories: uniform Times New Roman 11pt --- */
    .ap-scope .main-text,
    .ap-scope .main-text .editable-content,
    .ap-scope .main-text .static-content,
    .ap-scope .signatories-container {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    /* Tables inside the document */
    .ap-scope .main-text table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .ap-scope .main-text table, 
    .ap-scope .main-text th, 
    .ap-scope .main-text td {
      border: 1px solid #000;
    }
    .ap-scope .main-text th, 
    .ap-scope .main-text td {
      padding: 4px 6px;
      vertical-align: top;
      word-wrap: break-word;
    }
    /* Lists inside content */
    .ap-scope .main-text ul, .ap-scope .main-text ol {
      margin-left: 1.25em !important;
      padding-left: 1.25em !important;
      list-style-position: outside;
    }
    .ap-scope .main-text li { margin: 0.2em 0; }

    /* Table insertion menu (popover) */
    .table-menu {
      position: absolute;
      z-index: 50;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      padding: 0.75rem;
      width: max-content;
    }
    .table-menu .grid {
      display: grid;
      grid-template-columns: repeat(10, 18px);
      grid-auto-rows: 18px;
      gap: 4px;
      padding: 4px;
      background: #f9fafb;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    }
    .table-menu .cell {
      width: 18px; height: 18px;
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 2px;
    }
    .table-menu .cell.active {
      background: #fde7f4; /* light pink highlight */
      border-color: #ec4899;
    }
    .table-menu .label { font-size: 12px; color: #374151; margin-top: 6px; text-align: center; }
    .table-menu .row { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
    .table-menu select, .table-menu input[type="checkbox"] { font-size: 12px; }
    .table-menu .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: space-between; }
    .table-menu .btn-sm { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; }
    .table-menu .btn-sm:hover { background: #f3f4f6; }

    /* Table design variants */
    .ap-scope .main-text table.table--borders-none,
    .ap-scope .main-text table.table--borders-none th,
    .ap-scope .main-text table.table--borders-none td { border: 0 !important; }
    .ap-scope .main-text table.table--borders-gray,
    .ap-scope .main-text table.table--borders-gray th,
    .ap-scope .main-text table.table--borders-gray td { border-color: #9ca3af !important; }
    .ap-scope .main-text table.table--auto { width: auto !important; }
    /* Ensure headings inside body use 11pt but keep their boldness where applied */
    .ap-scope .main-text h1,
    .ap-scope .main-text h2,
    .ap-scope .main-text h3,
    .ap-scope .main-text h4,
    .ap-scope .main-text h5,
    .ap-scope .main-text h6 {
      font-size: 11pt !important;
    }
    /* Neutralize Tailwind font-size utilities within body content/signatories to keep sizes equal */
    .ap-scope .main-text .text-xs,
    .ap-scope .main-text .text-sm,
    .ap-scope .main-text .text-base,
    .ap-scope .main-text .text-lg,
    .ap-scope .main-text .text-xl,
    .ap-scope .main-text .text-2xl,
    .ap-scope .signatories-container .text-xs,
    .ap-scope .signatories-container .text-sm,
    .ap-scope .signatories-container .text-base,
    .ap-scope .signatories-container .text-lg,
    .ap-scope .signatories-container .text-xl,
    .ap-scope .signatories-container .text-2xl {
      font-size: inherit !important;
    }

  /* --- Sidebar inner container to keep content centered and away from the vertical line --- */
  .ap-scope .sidebar-inner { width: 100%; max-width: 105px; margin-left: -8px; margin-right: auto; }

    /* --- Executive Board heading style (bold, uppercase, double underline) --- */
    .ap-scope .sidebar-heading {
      position: relative;
      display: inline-block;
      font-family: "Times New Roman", Times, serif;
      font-weight: 800;
      text-transform: uppercase;
      color: #111827; /* near-black for strong contrast */
      letter-spacing: 0.3px;
      
      white-space: nowrap;
    }
    .ap-scope .sidebar-heading::after {
      content: "";
      position: absolute; left: 0; right: 0; bottom: 0;
      height: 2px; background: #000;
    }
    /* Sidebar typography scale to avoid overlaps */
  .ap-scope .member-name { font-family: "Times New Roman", Times, serif; font-size: 10px; line-height: 1.1; letter-spacing: 0.2px; }
  .ap-scope .member-role { font-family: "Times New Roman", Times, serif; font-size: 9px; line-height: 1.1; }
  .ap-scope .sidebar-subheading { font-family: "Times New Roman", Times, serif; font-weight: 800; font-size: 10px; letter-spacing: 0.2px; }
  .ap-scope .sidebar-input { font-family: "Times New Roman", Times, serif; font-size: 10px; }
  .ap-scope .sidebar-btn { font-family: "Times New Roman", Times, serif; font-size: 11px; padding-top: 6px; padding-bottom: 6px; }

    /* --- Print Styles --- */
    @media print {
      @page { size: A4; margin: 0; }
      body, html, .App { 
        background: white !important; 
        margin: 0 !important; 
        padding: 0 !important; 
      }
      /* Hide off-screen measurement nodes to avoid blank printed pages */
      .no-print { display: none !important; }
      .formatting-toolbar, .sidebar-form, .add-signatory-form, .remove-btn { 
        display: none !important; 
      }
      /* Hide the application shell sidebar during print */
      aside[aria-label="Sidebar"] { display: none !important; }
      /* Show the Activity Plan document sidebar (EXECUTIVE BOARD) ONLY on the first page in print */
      .ap-scope .page:first-of-type .sidebar { 
        visibility: visible !important; 
        display: block !important; 
      }
      /* Hide sidebar content on subsequent pages but keep its width (preserve layout/format) */
      .ap-scope .page:not(:first-of-type) .sidebar { 
        visibility: hidden !important; /* preserves space */
      }
      .ap-scope .page:first-of-type .sidebar-heading::after {
        visibility: visible !important;
        display: block !important;
      }
      /* Ensure the underline prints even when background graphics are disabled */
      .ap-scope .sidebar-heading {
        border-bottom: 1.5px solid #000 !important;
        padding-bottom: 1px !important; /* create space for the printed border */
      }
      .ap-scope .sidebar-heading::after {
        content: none !important; /* rely on border-bottom for reliable printing */
      }
      /* Remove left margin/padding from MainLayout's main area when printing */
      main.ml-64 { margin-left: 0 !important; padding: 0 !important; background: white !important; }
      .ap-scope .page {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important; /* hide on print */
        height: 100vh !important;
        max-height: none !important;
        overflow: hidden !important;
        padding: 0mm !important;
      }
      /* Do not apply zoom transform when printing */
      .ap-scope .pages-scale-wrapper { transform: none !important; }
  /* Screen-only header hidden via .no-print (already applied globally above) */
      #page-header {
        padding-left: 6mm !important;
        padding-right: 13mm !important;
        padding-top: 6mm !important;
      }
      .page-content {
        padding-left: 6mm !important;
        padding-right: 13mm !important;
      }
      /* Header bottom rule: start at vertical rule and end at header's right padding in print */
  .header-bottom-rule { left: 130px !important; right: 0 !important; bottom: 3mm !important; }
  .header-left-bottom-rule { left: 0 !important; width: 130px !important; bottom: 3mm !important; }
    /* Header fonts in print */
    .header-title { font-family: Cambria, "Times New Roman", Times, serif !important; font-size: 18pt !important; font-style: italic !important; }
  .header-contacts { font-family: "Times New Roman", Times, serif !important; font-size: 8pt !important; line-height: 1.1 !important; margin-bottom: 2mm !important; }
    .header-society { font-family: "Times New Roman", Times, serif !important; font-size: 9.5pt !important; }
  /* Footer rules: meet left page edge, reduce on right to clear ISO, and lift upward */
  .footer-rules { left: -6mm !important; right: 62mm !important; top: -4.5mm !important; }
  /* Middle pages: push to both edges when printing */
  .footer-rules-middle { left: -6mm !important; right: -13mm !important; top: -4.5mm !important; }
  /* Keep footer accreditation text small in print */
      .footer-acc { 
        font-size: 8.67px !important; 
        line-height: 1.25 !important; 
        font-family: Tahoma, Geneva, Verdana, sans-serif !important;
        font-weight: 700 !important;
      }
      .page-footer {
        padding: 0 13mm 5mm 6mm !important;
      }
      .page:last-child { page-break-after: avoid; }
      .page-content, .main-text, .editable-content, .static-content {
        overflow: visible !important;
        height: auto !important;
      }
  .header-logo { margin-left: -9px !important; }
    }
    /* --- E-Signature styles --- */
    .signature-draggable { 
      display: inline-block; 
      cursor: move; 
      border: none; 
      padding: 0; 
      margin: 2px; 
      background: transparent; 
      user-select: none; 
      transition: all 0.2s;
      box-shadow: none;
      pointer-events: auto;
    }
    .signature-draggable:hover { 
      box-shadow: 0 2px 6px rgba(236,72,153,0.15);
    }
    .signature-draggable:active {
      cursor: grabbing;
    }
    .signature-draggable img { display: block; max-width: 240px; height: auto; pointer-events: none; }
    
    /* Ensure signatory items don't interfere with signature dragging */
    .ap-scope .signatory-item {
      position: relative;
      z-index: 1;
    }
    .ap-scope .signatories-container.dragging .signatory-item,
    .ap-scope .signatories-container.dragging .add-signatory-form,
    .ap-scope .signatories-container.dragging button {
      pointer-events: none !important;
    }
    .ap-scope .signatories-container.dragging {
      user-select: none !important;
    }
    
    /* Hide signature borders when printing */
    @media print {
      .signature-draggable {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
  `}</style>
);

/* ---------- Toolbar Component ---------- */
type ToolbarProps = { 
  onZoomChange?: (scale: number) => void;
  onStartSignature?: (range: Range | null) => void;
  onSubmit?: () => void;
  onPreview?: () => void;
  onGeneratePDF?: () => void;
  onSave?: () => void;
};
const Toolbar: React.FC<ToolbarProps> = ({ onZoomChange, onStartSignature, onSubmit, onPreview, onGeneratePDF, onSave }) => {
  const exec = (command: string, value?: string) => document.execCommand(command, false, value ?? "");
  const [zoom, setZoom] = useState<number>(1);
  const [font, setFont] = useState<string>("Times New Roman");
  const [fontSize, setFontSize] = useState<number>(11);
  const [showTableMenu, setShowTableMenu] = useState<boolean>(false);
  const [tableMenuPos, setTableMenuPos] = useState<{x:number;y:number}>({x:0,y:0});
  const savedSelectionRef = useRef<Range | null>(null);
  // removed text color control per request

  const applyFont = (f: string) => { setFont(f); exec("fontName", f); };
  // execCommand fontSize expects 1..7; map a few common sizes
  const sizeMap: Record<number, number> = { 10: 2, 11: 3, 12: 3, 14: 4, 16: 5 };
  const applyFontSize = (pt: number) => { setFontSize(pt); exec("fontSize", String(sizeMap[pt] ?? 3)); };
  const promptLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    const safeUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    exec("createLink", safeUrl);
  };
  const captureSelection = (): Range | null => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  };
  const insertSimpleTable = (rows: number, cols: number) => {
    // Build table HTML
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border: 1px solid #000; padding: 4px 6px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    
    // Try to use saved selection first (from toolbar interaction)
    let range = savedSelectionRef.current;
    
    // If no saved selection, try to get current selection
    if (!range) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }
    }
    
    // Insert at cursor position if we have a range
    if (range) {
      const editableParent = (range.commonAncestorContainer as Node).parentElement?.closest('.editable-content');
      
      if (editableParent) {
        // Delete any selected content first
        range.deleteContents();
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Insert each node from the parsed HTML
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
        
        // Move cursor after the inserted content
        range.collapse(false);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Clear saved selection
        savedSelectionRef.current = null;
        return;
      }
    }
    
    // Fallback: if no selection, find active editable and append
    const editableDiv = document.querySelector('.editable-content[contenteditable="true"]') as HTMLElement;
    if (editableDiv) {
      editableDiv.focus();
      document.execCommand('insertHTML', false, html);
    }
    
    // Clear saved selection
    savedSelectionRef.current = null;
  };
  const openTableMenu = (btnEl: HTMLButtonElement | null) => {
    // Save current selection before opening menu
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
    
    if (!btnEl) { setShowTableMenu((s)=>!s); return; }
    const rect = btnEl.getBoundingClientRect();
    // Use viewport coordinates for fixed-position portal (do NOT add scrollY)
    setTableMenuPos({ x: rect.left, y: rect.bottom + 6 });
    setShowTableMenu(true);
  };
  const insertTable = () => {
    const colsStr = window.prompt("How many columns?", "3");
    const rowsStr = window.prompt("How many rows?", "3");
    if (!colsStr || !rowsStr) return;
    const cols = Math.max(1, Math.min(10, Number(colsStr)));
    const rows = Math.max(1, Math.min(20, Number(rowsStr)));
    const header = window.confirm("Use first row as header?");
    let html = '<table contenteditable="false">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        if (header && r === 0) {
          html += '<th><div contenteditable="true">&nbsp;</div></th>';
        } else {
          html += '<td><div contenteditable="true">&nbsp;</div></td>';
        }
      }
      html += "</tr>";
    }
    html += "</table>";
    exec("insertHTML", html);
  };
  const withTableCell = (fn: (cell: HTMLTableCellElement, table: HTMLTableElement) => void) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode as Node | null;
    const cell = anchor ? (anchor instanceof HTMLElement ? anchor : (anchor.parentElement as HTMLElement | null))?.closest("td,th") as HTMLTableCellElement | null : null;
    if (!cell) return;
    const table = cell.closest("table") as HTMLTableElement | null;
    if (!table) return;
    fn(cell, table);
  };
  const addRowBelow = () => withTableCell((cell, table) => {
    const row = cell.parentElement as HTMLTableRowElement;
    const newRow = row.cloneNode(true) as HTMLTableRowElement;
    newRow.querySelectorAll("th,td").forEach((el) => { el.innerHTML = '<div contenteditable="true">&nbsp;</div>'; if (el.tagName === 'TH') (el as HTMLElement).outerHTML = (el as HTMLElement).outerHTML.replace('<th', '<td').replace('</th>', '</td>'); });
    row.after(newRow);
  });
  const addColRight = () => withTableCell((cell, table) => {
    const colIndex = (cell as HTMLTableCellElement).cellIndex;
    Array.from(table.rows).forEach((tr, idx) => {
      const isHeaderRow = tr.cells[0]?.tagName === 'TH' && idx === 0;
      const el = document.createElement(isHeaderRow ? 'th' : 'td');
      el.innerHTML = '<div contenteditable="true">&nbsp;</div>';
      tr.insertBefore(el, tr.cells[colIndex + 1] || null);
    });
  });
  const deleteRow = () => withTableCell((cell) => { (cell.parentElement as HTMLTableRowElement).remove(); });
  const deleteCol = () => withTableCell((cell, table) => {
    const colIndex = cell.cellIndex;
    Array.from(table.rows).forEach((tr) => { if (tr.cells[colIndex]) tr.deleteCell(colIndex); });
  });
  const normalizeList = (ordered: boolean) => {
    const cmd = ordered ? "insertOrderedList" : "insertUnorderedList";
    exec(cmd);
    // Ensure proper <ul>/<ol><li> structure and avoid nested <div> artifacts
    const sel = window.getSelection();
    const root = sel?.anchorNode ? (sel.anchorNode as HTMLElement | Text).parentElement?.closest(".editable-content") : null;
    if (!root) return;
    root.querySelectorAll('li > div').forEach((div) => {
      const li = div.parentElement as HTMLLIElement;
      // unwrap div but keep its children
      while (div.firstChild) li.insertBefore(div.firstChild, div);
      div.remove();
    });
  };
  const handleZoom = (v: string) => {
    const scale = Number(v) / 100;
    setZoom(scale);
    onZoomChange?.(scale);
  };

  return (
    <div className="formatting-toolbar" role="toolbar" aria-label="Document formatting toolbar">
      {/* Undo/Redo */}
      <div className="group">
        <button className="btn" title="Undo" onClick={() => exec("undo")}> <Undo2 size={18} /> </button>
        <button className="btn" title="Redo" onClick={() => exec("redo")}> <Redo2 size={18} /> </button>
        <button className="btn" title="Print" onClick={() => window.print()}> <PrinterIcon size={18} /> </button>
      </div>
      <div className="divider" />
      
      {/* Document Actions */}
      <div className="group">
        <button className="btn" title="Save Draft" onClick={() => onSave?.()}><SaveIcon size={18} /> Save</button>
        <button className="btn" title="Preview PDF" onClick={() => onPreview?.()}><EyeIcon size={18} /> Preview</button>
        <button className="btn" title="Generate PDF" onClick={() => onGeneratePDF?.()}><FileTextIcon size={18} /> Generate PDF</button>
        <button className="btn" title="Submit for Approval" onClick={() => onSubmit?.()}>✅ Submit</button>
      </div>
      <div className="divider" />

      {/* Zoom */}
      <div className="group">
        <select className="select" aria-label="Zoom" value={Math.round(zoom * 100)} onChange={(e) => handleZoom(e.target.value)}>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="90">90%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
        </select>
      </div>
      <div className="divider" />

      {/* Font family and size (no heading styles) */}
      <div className="group">
        <select className="select" aria-label="Font" value={font} onChange={(e) => applyFont(e.target.value)}>
          <option>Times New Roman</option>
          <option>Arial</option>
          <option>Cambria</option>
          <option>Georgia</option>
          <option>Montserrat</option>
        </select>
        <select className="select" aria-label="Font size" value={fontSize} onChange={(e) => applyFontSize(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={11}>11</option>
          <option value={12}>12</option>
          <option value={14}>14</option>
          <option value={16}>16</option>
        </select>
      </div>
      <div className="divider" />

      {/* Basic styles */}
      <div className="group">
        <button className="btn" title="Bold" onClick={() => exec("bold")}> <BoldIcon size={18} /> </button>
        <button className="btn" title="Italic" onClick={() => exec("italic")}> <ItalicIcon size={18} /> </button>
        <button className="btn" title="Underline" onClick={() => exec("underline")}> <UnderlineIcon size={18} /> </button>
      </div>
      <div className="divider" />

      {/* Link */}
      <div className="group">
        <button className="btn" title="Insert link" onClick={promptLink}> <LinkIcon size={18} /> </button>
      </div>
      <div className="divider" />

      {/* Alignment */}
      <div className="group">
        <button className="btn" title="Align left" onClick={() => exec("justifyLeft")}> <AlignLeft size={18} /> </button>
        <button className="btn" title="Align center" onClick={() => exec("justifyCenter")}> <AlignCenter size={18} /> </button>
        <button className="btn" title="Align right" onClick={() => exec("justifyRight")}> <AlignRight size={18} /> </button>
        <button className="btn" title="Justify" onClick={() => exec("justifyFull")}> <AlignJustify size={18} /> </button>
      </div>
      <div className="divider" />

      {/* Lists (no image insertion, no clear formatting) */}
      <div className="group">
        <button className="btn" title="Bulleted list" onClick={() => normalizeList(false)}> <BulletListIcon size={18} /> </button>
        <button className="btn" title="Numbered list" onClick={() => normalizeList(true)}> <NumberListIcon size={18} /> </button>
      </div>
      <div className="divider" />

      {/* E-Signature */}
      <div className="group">
        <button
          className="btn"
          title="Add E-Signature"
          onMouseDown={() => {
            // Save selection before focus shifts to the button
            const r = captureSelection();
            if (r && savedSelectionRef) savedSelectionRef.current = r;
          }}
          onClick={() => {
            const r = savedSelectionRef?.current ?? captureSelection();
            onStartSignature?.(r ?? null);
          }}
        >
          Add E-Signature
        </button>
      </div>
      <div className="divider" />

      {/* Tables (Google Docs-like) */}
      <div className="group" style={{ position: 'relative' }}>
        <button className="btn" title="Table" ref={(el)=>{/* attach for position */}} onClick={(e)=>openTableMenu(e.currentTarget)}>Table</button>
        {showTableMenu && (
          <TableMenu x={tableMenuPos.x} y={tableMenuPos.y} onClose={()=>setShowTableMenu(false)} onInsert={insertSimpleTable} />
        )}
      </div>
    </div>
  );
};

/* ---------- Table Menu (popover) ---------- */
interface TableMenuProps {
  x: number; y: number;
  onInsert: (rows:number, cols:number) => void;
  onClose: () => void;
}
const TableMenu: React.FC<TableMenuProps> = ({ x, y, onInsert, onClose }) => {
  const [hoverRows, setHoverRows] = useState(1);
  const [hoverCols, setHoverCols] = useState(1);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Use 'click' instead of 'mousedown' to avoid immediate close from the opener click
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Defer binding to the end of the event loop so the opening click doesn't immediately close it
    const id = setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => { clearTimeout(id); document.removeEventListener('click', onDocClick); };
  }, [onClose]);

  const maxRows = 10;
  const maxCols = 10;
  const cells: React.ReactElement[] = [];
  for (let r = 1; r <= maxRows; r++) {
    for (let c = 1; c <= maxCols; c++) {
      const active = r <= hoverRows && c <= hoverCols;
      cells.push(
        <div
          key={`g-${r}-${c}`}
          className={`cell${active ? ' active' : ''}`}
          onMouseEnter={() => { setHoverRows(r); setHoverCols(c); }}
          onClick={() => { onInsert(r, c); onClose(); }}
        />
      );
    }
  }

  return createPortal(
    <div className="table-menu" ref={ref} style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(10, 18px)' }}>
        {cells}
      </div>
      <div className="label">{hoverRows} × {hoverCols}</div>
    </div>,
    document.body
  );
};/*---------- Layout Components ----------*/
const Header: React.FC = () => (
  <header id="page-header" className="flex-shrink-0 relative">
    {/* Vertical line extending from top to horizontal line */}
    <div className="header-vertical-rule border-pink-500"></div>
    
    <div className="flex relative">
      <div className="flex flex-col items-start justify-center pr-3.5 w-[130px] -mt-6 header-logo">
        <div className="relative z-10 w-28 h-28 rounded overflow-hidden bg-white">
          <img src={uicLogo} alt="UIC logo" className="block w-full h-full object-contain" />
        </div>
      </div>
    <div className="flex-1 pl-12 relative pb-4 -mt-3">
  <h1 className="text-pink-600 header-title font-serif">University of the Immaculate Conception</h1>
  <div className="text-pink-500 header-contacts mt-0.5 space-y-0.5 max-w-md">
          <div className="flex items-center gap-2">
            <IconPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>Father Selga Street, Davao City 8000, Philippines</span>
          </div>
          <div className="flex items-center gap-2">
            <IconPhone className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>221-8090; 221-8181 local 107</span>
          </div>
          <div className="flex items-center gap-2">
            <IconPrinter className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>(63-082) 226-2676</span>
          </div>
          <div className="flex items-center gap-2">
            <IconGlobe className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <a href="https://www.uic.edu.ph" target="_blank" rel="noopener noreferrer" className="hover:underline text-pink-500">www.uic.edu.ph</a>
          </div>
          <div className="flex items-center gap-2">
            <IconMail className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <a href="mailto:sites@uic.edu.ph" className="hover:underline text-pink-500">sites@uic.edu.ph</a>
            <span className="text-pink-600 font-bold header-society whitespace-nowrap ml-6">Society of Information Technology Education Students</span>
          </div>
        </div>
      </div>
    </div>
    {/* Horizontal line extending full width */}
    <div className="header-bottom-rule">
      <div className="w-full border-b-2 border-pink-500"></div>
    </div>
    <div className="header-left-bottom-rule">
      <div className="w-full border-b-2 border-pink-500"></div>
    </div>
  </header>
);

const SubsequentPageHeader: React.FC = () => (
    <div id="subsequent-page-header" className="flex-shrink-0" style={{ height: '2.7mm' }}></div>
);

interface SidebarProps {
  isVisible?: boolean;
  members: Member[];
  onAddMember: (name: string, role: string) => void;
  onDeleteMember: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible = true, members, onAddMember, onDeleteMember }) => {
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState("");

    const handleAddClick = () => {
        if (newName.trim() && newRole.trim()) {
            onAddMember(newName, newRole);
            setNewName("");
            setNewRole("");
        }
    };

    return (
        <aside className="sidebar" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
            <div className="sidebar-line"></div>
            <div className="text-xs space-y-3 pt-1 px-0 text-center">
              <div className="sidebar-inner">
                <p className="sidebar-heading text-[11px]">EXECUTIVE BOARD</p>
                <div className="mt-8 space-y-2">
                  {members.map((m: Member, i: number) => (
                    <div key={i} className="relative group p-1 text-center">
                      <p>
                        <span className="font-bold uppercase member-name">{m.name}</span>
                        <br />
                        <span className="text-pink-600 member-role">{m.role}</span>
                      </p>
                      <button 
                        onClick={() => onDeleteMember(i)}
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none p-1 remove-btn"
                        title="Remove member"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                
      <div className="pt-3 border-t mt-3 sidebar-form text-center">
      <p className="sidebar-subheading mb-2">ADD NEW MEMBER</p>
                    <input 
            type="text" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} 
      className="w-full sidebar-input p-1 border rounded mb-2 text-gray-700 text-left"
                    />
                    <input 
            type="text" placeholder="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} 
      className="w-full sidebar-input p-1 border rounded mb-2 text-gray-700 text-left"
                    />
                    <button 
                        onClick={handleAddClick} 
            className="w-full bg-pink-500 text-white sidebar-btn rounded hover:bg-pink-600 transition-colors"
                    >
                        Add Member
                    </button>
              </div>
              </div>
            </div>
        </aside>
    );
};

/* Submission confirmation modal moved to @/components/SubmissionModal */

/*---------- Signature Canvas Component ----------*/
interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  signerRole: 'prepared_by' | 'dean';
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel, signerRole }) => {
  const sigRef = useRef<ReactSignatureCanvas | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = () => { sigRef.current?.clear(); setHasDrawn(false); };
  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border border-gray-200">
        <h3 className="text-lg font-bold mb-4">
          {signerRole === 'prepared_by' ? 'Add Your Signature (Prepared By)' : 'Add Dean Signature'}
        </h3>
        <div className="border-2 border-gray-300 rounded mb-4 bg-gray-50">
          <ReactSignatureCanvas
            ref={sigRef}
            penColor="#000"
            onBegin={() => setHasDrawn(true)}
            canvasProps={{ width: 500, height: 200, className: 'w-full cursor-crosshair' }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">Clear</button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!hasDrawn} className="flex-1 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">Save Signature</button>
        </div>
      </div>
    </div>
  );
};

/*---------- Signatories Component ----------*/
interface AddSignatoryFormProps {
  category: string;
  onAdd: (category: string, name: string, position: string) => void;
  onCancel: () => void;
}

const AddSignatoryForm: React.FC<AddSignatoryFormProps> = ({ category, onAdd, onCancel }) => {
    const [name, setName] = useState("");
    const [position, setPosition] = useState("");

    const handleAddClick = () => {
        if (name.trim() && position.trim()) {
            onAdd(category, name, position);
            onCancel(); // Close form after adding
        }
    };

    return (
        <div className="w-full md:w-2/3">
          <div className="add-signatory-form p-3">
            <p className="font-bold text-xs mb-2 text-gray-700">Add to "{category}"</p>
            <input type="text" placeholder="Full Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <input type="text" placeholder="Position" value={position} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)} />
            <div className="flex gap-2">
                <button onClick={handleAddClick} className="w-full bg-pink-500 text-white text-xs py-1 rounded hover:bg-pink-600 transition-colors">Add</button>
                <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 text-xs py-1 rounded hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
    );
};

interface SignatoriesProps {
  signatories: SignatoriesMap;
  onAdd: (category: string, name: string, position: string) => void;
  onDelete: (category: string, index: number) => void;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  signatures?: Array<{id: string; data: string; x: number; y: number}>;
  onSignatureMove?: (id: string, x: number, y: number) => void;
}

const Signatories: React.FC<SignatoriesProps> = ({ signatories, onAdd, onDelete, innerRef, signatures = [], onSignatureMove }) => {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{dx: number; dy: number}>({ dx: 0, dy: 0 });
  const preparedByRef = useRef<HTMLDivElement | null>(null);

  // Attach global mousemove/mouseup while dragging
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingId || !onSignatureMove || !innerRef?.current || !preparedByRef?.current) return;
      const containerEl = innerRef.current;
      const preparedByEl = preparedByRef.current;
      
      // Get bounding rects
      const containerRect = containerEl.getBoundingClientRect();
      const preparedByRect = preparedByEl.getBoundingClientRect();
      
      // Adjust for CSS transform scale applied to pages wrapper (zoom)
      const scaleX = containerRect.width / (containerEl.offsetWidth || containerRect.width);
      const scaleY = containerRect.height / (containerEl.offsetHeight || containerRect.height);
      
      // Compute position relative to container (for absolute positioning)
      let newX = (e.clientX - containerRect.left) / (scaleX || 1) - dragOffsetRef.current.dx;
      let newY = (e.clientY - containerRect.top) / (scaleY || 1) - dragOffsetRef.current.dy;
      
      // Calculate "Prepared by:" section bounds relative to container
      const preparedByTop = (preparedByRect.top - containerRect.top) / (scaleY || 1);
      const preparedByLeft = (preparedByRect.left - containerRect.left) / (scaleX || 1);
      const preparedByWidth = preparedByRect.width / (scaleX || 1);
      const preparedByHeight = preparedByRect.height / (scaleY || 1);
      
      // Clamp within "Prepared by:" section only
      const margin = 5;
      newX = Math.max(preparedByLeft - margin, Math.min(preparedByLeft + preparedByWidth - 1 + margin, newX));
      newY = Math.max(preparedByTop - margin, Math.min(preparedByTop + preparedByHeight - 1 + margin, newY));
      
      onSignatureMove(draggingId, newX, newY);
    };
    const handleUp = () => {
      if (draggingId && innerRef?.current) {
        innerRef.current.classList.remove('dragging');
      }
      setDraggingId(null);
    };
    if (draggingId) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [draggingId, onSignatureMove, innerRef]);

  return (
        <div ref={innerRef} className="signatories-container space-y-1">
      {/* Render signatures */}
      {signatures.map((sig) => (
        <div
          key={sig.id}
          className="signature-draggable"
          style={{
            position: 'absolute',
            left: `${sig.x}px`,
            top: `${sig.y}px`,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDraggingId(sig.id);
            if (innerRef?.current) {
              innerRef.current.classList.add('dragging');
              const el = innerRef.current;
              const rect = el.getBoundingClientRect();
              const scaleX = rect.width / (el.offsetWidth || rect.width);
              const scaleY = rect.height / (el.offsetHeight || rect.height);
              // store offset between mouse and signature top-left in unscaled coords
              const mouseX = (e.clientX - rect.left) / (scaleX || 1);
              const mouseY = (e.clientY - rect.top) / (scaleY || 1);
              dragOffsetRef.current = { dx: mouseX - sig.x, dy: mouseY - sig.y };
            }
          }}
        >
          <img src={sig.data} alt="E-Signature" style={{ maxWidth: '240px', display: 'block', pointerEvents: 'none' }} />
        </div>
      ))}
      
      {(Object.entries(signatories) as Array<[string, Signatory[]]>).map(([category, people]) => (
                <div key={category} ref={category === "Prepared by:" ? preparedByRef : null}>
                    <p className="font-bold text-sm mb-1">
                        {category}
                    </p>
                    <div className="space-y-1">
            {people.map((person: Signatory, index: number) => (
              <div key={index} className="w-full md:w-2/3 text-left text-sm signatory-item relative group">
                <div className="h-4"></div>
                                <p className="font-bold uppercase pt-0">{person.name}</p>
                                <p className="italic">{person.position}</p>
                                <button 
                                    onClick={() => onDelete(category, index)}
                                    className="absolute top-0 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none p-1 remove-btn"
                                    title={`Remove ${person.name}`}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        
                        {addingTo === category ? (
                            <AddSignatoryForm 
                                category={category}
                                onAdd={onAdd}
                                onCancel={() => setAddingTo(null)}
                            />
                        ) : (
                            // Only show "+ Add Signatory" button if:
                            // - Category is NOT "Prepared by:" OR
                            // - Category is "Prepared by:" AND no people added yet
                            (category !== "Prepared by:" || people.length === 0) && (
                                <div className="pt-2">
                                    <button 
                      onClick={() => setAddingTo(category)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full remove-btn transition-colors"
                                    >
                                        + Add Signatory
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};


interface PageNumberInfoProps { pageIndex: number; totalPages: number; showLogo?: boolean; }
const PageNumberInfo: React.FC<PageNumberInfoProps> = ({ pageIndex, totalPages, showLogo = true }) => (
    <div className="flex justify-between items-center mt-2">
        <div className="w-28">{/* Left Spacer */}</div>
        <div className="flex-1 text-center text-sm">
            Page {pageIndex + 1} of {totalPages}
        </div>
        {showLogo ? (
      <div className="w-28 flex justify-end">
        <img src={uicFooter} alt="UIC" className="w-20 h-12 object-contain" />
            </div>
        ) : (
            <div className="w-28">{/* Right Spacer to keep page number centered */}</div>
        )}
    </div>
);

interface FooterProps { pageIndex: number; totalPages: number; }
const Footer: React.FC<FooterProps> = ({ pageIndex, totalPages }) => (
  <footer id="page-footer" className="page-footer">
    <div>
      {/* Footer lines: left-bleed, shortened on the right to clear the ISO block */}
      <div className="footer-rules">
        <div className="border-t-2 border-pink-500"></div>
        <div className="border-t-2 border-pink-500 mt-0.5"></div>
      </div>
      <div className="flex justify-between items-start mt-1">
  <div className="footer-acc footer-acc-block text-center flex-1 px-4 leading-snug tracking-tight">
          <p className="font-bold">CHED Full Autonomous Status • PAASCU Accredited, Institutional Accreditation Status •</p>
          <p className="font-bold mt-0.5">Bureau of Immigration Accredited • Deputized to offer ETEEAP • Science Resource Center, DENR Recognized •</p>
                  <p className="mt-1 mb-2 font-bold">
                    <span className="font-bold">MEMBER:</span> Catholic Educational Association of the Philippines (CEAP) • Association of Catholic Universities of the <br />
                    Philippines{"\u00A0"}(ACUP) ● ASEAN University Network (AUN-QA, Associate Member) • University Mobility in Asia and the Pacific <br />
                    (UMAP) Association of Southeast and East Asian Catholic Colleges and Universities (ASEACCU) • <br />
                    Southeast Asian Ministers of Education Organization (SEAMEO) Schools’ Network
                  </p>
        </div>
        <div className="ml-4 flex flex-col items-end self-start -mt-14">
          <div className="w-40 ml-auto">
            <img src={tuvCertified} alt="TÜV Rheinland ISO Certified" className="w-40 h-20 object-contain rounded bg-white" />
            <div className="text-xs mt-0.5 text-gray-900 text-center">Page {pageIndex + 1} of {totalPages}</div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const MiddlePageFooter: React.FC<FooterProps> = ({ pageIndex, totalPages }) => (
    <footer id="middle-page-footer" className="page-footer">
        <div>
      <div className="footer-rules-middle">
        <div className="border-t-2 border-pink-500"></div>
        <div className="border-t-2 border-pink-500 mt-0.5"></div>
      </div>
            <PageNumberInfo pageIndex={pageIndex} totalPages={totalPages} showLogo={true} />
        </div>
    </footer>
);

/* ---------- Smart Editable Component ---------- */
interface EditableContentProps {
  id: string;
  html: string;
  onContentChange: (newHtml: string) => void;
}

class EditableContent extends React.Component<EditableContentProps> {
  private elRef = React.createRef<HTMLDivElement>();
  constructor(props: EditableContentProps) { super(props); }
  shouldComponentUpdate(nextProps: EditableContentProps) { if (!this.elRef.current) return true; return nextProps.html !== this.elRef.current.innerHTML; }
  componentDidUpdate() { if (this.elRef.current && this.props.html !== this.elRef.current.innerHTML) { this.elRef.current.innerHTML = this.props.html; } }
  handleInput = () => { if (this.elRef.current) { const newContent = this.elRef.current.innerHTML; this.props.onContentChange(newContent); } };
  handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode as Node | null;
    const cell = anchor ? (anchor instanceof HTMLElement ? anchor : (anchor.parentElement as HTMLElement | null))?.closest('td,th') as HTMLTableCellElement | null : null;
    
    // Handle Tab key - insert indentation (outside or inside tables)
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // If inside a table cell, navigate between cells
      if (cell) {
        const table = cell.closest('table') as HTMLTableElement | null;
        if (table) {
          const row = cell.parentElement as HTMLTableRowElement;
          const next = e.shiftKey ? (cell.previousElementSibling as HTMLTableCellElement | null) : (cell.nextElementSibling as HTMLTableCellElement | null);
          let targetCell: HTMLTableCellElement | null = next;
          if (!targetCell) {
            const siblingRow = e.shiftKey ? (row.previousElementSibling as HTMLTableRowElement | null) : (row.nextElementSibling as HTMLTableRowElement | null);
            if (siblingRow) {
              targetCell = (e.shiftKey ? siblingRow.lastElementChild : siblingRow.firstElementChild) as HTMLTableCellElement | null;
            }
          }
          if (targetCell) {
            const editable = targetCell.querySelector('[contenteditable="true"]') as HTMLElement | null;
            (editable ?? targetCell).focus();
            const r = document.createRange();
            r.selectNodeContents(editable ?? targetCell);
            r.collapse(true);
            const s = window.getSelection();
            s?.removeAllRanges(); s?.addRange(r);
          }
          return;
        }
      }
      
      // Otherwise, insert tab spacing (4 non-breaking spaces for consistent indentation)
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      return;
    }
    
    // Handle Enter key - ensure proper line break
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If inside a table cell, just insert a line break
      if (cell) {
        document.execCommand('insertHTML', false, '<br>');
        return;
      }
      
      // For normal text, insert a proper paragraph or line break
      const range = sel.getRangeAt(0);
      const currentBlock = (range.commonAncestorContainer as Node).parentElement?.closest('p, div, li, h1, h2, h3, h4, h5, h6');
      
      if (currentBlock && currentBlock.tagName === 'LI') {
        // Let the browser handle list items naturally
        document.execCommand('insertHTML', false, '<br>');
      } else {
        // Insert a new paragraph for regular content
        document.execCommand('insertParagraph', false);
      }
    }
  };
  render() {
    return <div id={this.props.id} className="editable-content" ref={this.elRef} onInput={this.handleInput} onKeyDown={this.handleKeyDown} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

/*---------- Page Component ----------*/
interface PageProps {
  children: React.ReactNode;
  pageIndex: number;
  totalPages: number;
  members: Member[];
  onAddMember: (name: string, role: string) => void;
  onDeleteMember: (index: number) => void;
  showSignatories: boolean;
  signatoriesComponent: React.ReactNode;
}

const Page: React.FC<PageProps> = ({ children, pageIndex, totalPages, members, onAddMember, onDeleteMember, showSignatories, signatoriesComponent }) => {
    const isFirstPage = pageIndex === 0;
    const useStandardFooter = isFirstPage;

    return (
        <div className="page">
            {isFirstPage ? <Header /> : <SubsequentPageHeader />}
            <main className="page-content">
                <Sidebar 
                    isVisible={isFirstPage} 
                    members={members} 
                    onAddMember={onAddMember}
                    onDeleteMember={onDeleteMember}
                />
                <div className="main-text">
                    <div>{children}</div>
                    {showSignatories && signatoriesComponent}
                </div>
            </main>
            {useStandardFooter ? 
                <Footer pageIndex={pageIndex} totalPages={totalPages} /> :
                <MiddlePageFooter pageIndex={pageIndex} totalPages={totalPages} />
            }
        </div>
    );
};


/*---------- Debounce Hook----------*/
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

/* ---------- Main App Component ---------- */
const App: React.FC = () => {
  const page = usePage();
  // Expecting optional plan prop when editing/viewing a specific plan
  const plan: any = (page.props as any).plan ?? null;
  // PDF generation removed; drafts remain HTML-only
  // CSRF priming to avoid 419 on POST
  const [csrfReady, setCsrfReady] = useState(false);
  const ensureCsrf = useCallback(async () => {
    try {
      // Refresh cookie and update <meta name="csrf-token"> simultaneously
      const token = await refreshCsrfToken();
      if (!token) {
        // Fallback: best-effort cookie refresh
        await fetch('/api/csrf-token', { credentials: 'include' });
      }
    } catch (e) {
      // ignore
    }
  }, []);
  useEffect(() => {
    ensureCsrf().finally(() => setCsrfReady(true));
  }, [ensureCsrf]);
  const getInitialContent = () => `
    <div style="text-align: left;" class="text-sm font-semibold">SEPTEMBER 22, 2025</div><br>
    <h2 style="text-align: center;" class="text-2xl font-bold mb-4">ACTIVITY PLAN</h2>
    <h3 class="font-bold text-lg mb-2">I. NAME OF THE ACTIVITY:</h3><p class="ml-4">&lt;content&gt;</p><br>
    <h3 class="font-bold text-lg mb-2">II. RATIONALE:</h3><p class="ml-4 text-justify">&lt;content&gt;</p><br>
    <h3 class="font-bold text-lg mb-2">III. DATE:</h3><p class="ml-4">&lt;content&gt;</p><br>
    <h3 class="font-bold text-lg mb-2">IV. SCHEDULE/VENUE:</h3><p class="ml-4">&lt;content&gt;</p><br>
    <h3 class="font-bold text-lg mb-2">V. PROVISIONS:</h3><p class="ml-4">&lt;content&gt;</p><br>
    <h3 class="font-bold text-lg mb-2">VI. EVALUATION FORM:</h3><p class="ml-4">&lt;content&gt;</p>
  `;

  const [pages, setPages] = useState<string[]>([getInitialContent()]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [layoutHeights, setLayoutHeights] = useState({
    firstPageContentH: 0,
    subsequentPageContentH: 0,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [signatories, setSignatories] = useState<SignatoriesMap>({
      "Prepared by:": [],
      "Noted by:": [
        { name: "MRS. ANAFLOR E. SACOPAYO, MBA", position: "Director of Student Affairs and Discipline" },
      ],
      "Approved by:": [
        { name: "DR. AVEENIR B. DAYAGANON", position: "Vice President for Academics" },
      ]
  });
  const [signatoriesHeight, setSignatoriesHeight] = useState<number>(0);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatureRole, setSignatureRole] = useState<'prepared_by' | 'dean' | null>(null);
  const [preparedBySignature, setPreparedBySignature] = useState<string | null>(null);
  const [deanSignature, setDeanSignature] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Array<{id: string; data: string; x: number; y: number}>>([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showSignatureWarning, setShowSignatureWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSaveHtml, setPendingSaveHtml] = useState<string | null>(null);
  
  // PDF Preview & Generation States
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  
  // TODO: Get these from backend/props based on user role and activity plan status
  const canSignAsPreparedBy = true; // Only the creator can sign
  const canSignAsDean = true; // Only dean role can sign after admin approval

  const debouncedPages = useDebounce(pages, 250);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorPositionRef = useRef<{ pageIndex: number; offset: number } | null>(null);
  const signatoriesRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionFromToolbarRef = useRef<Range | null>(null);

  const handleAddMember = (name: string, role: string) => setMembers([...members, { name, role }]);
  const handleDeleteMember = (index: number) => setMembers(members.filter((_, i) => i !== index));
  
  const handleAddSignatory = (category: string, name: string, position: string) => {
    setSignatories(prev => ({
        ...prev,
        [category]: [...prev[category], { name, position }]
    }));
  };

  const handleDeleteSignatory = (category: string, index: number) => {
      setSignatories(prev => ({
          ...prev,
          [category]: prev[category].filter((_, i) => i !== index)
      }));
  };

  const handleAddSignature = (role: 'prepared_by' | 'dean') => {
    setSignatureRole(role);
    setShowSignatureCanvas(true);
  };

  const handleToolbarStartSignature = (range: Range | null) => {
    // Check if a signature already exists
    if (signatures.length > 0) {
      setShowSignatureWarning(true);
      return;
    }
    
    // Save selection from toolbar and open signature modal.
    savedSelectionFromToolbarRef.current = range;
    // For now, assume the user is signing as 'prepared_by' by default; could infer from role later.
    setSignatureRole('prepared_by');
    setShowSignatureCanvas(true);
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!signatureRole) return;

    // TODO: Send to backend
    // await axios.post(`/student/requests/activity-plan/${activityPlanId}/signatures`, {
    //   signature_data: signatureData,
    //   signer_role: signatureRole
    // });

    // For now, just save locally
    if (signatureRole === 'prepared_by') {
      setPreparedBySignature(signatureData);
    } else {
      setDeanSignature(signatureData);
    }

    // Add signature to state (will be rendered in signatories section)
    const newSignature = {
      id: `sig-${Date.now()}`,
      data: signatureData,
      x: 20,
      y: 20,
    };
    
    setSignatures(prev => [...prev, newSignature]);

    // Clear saved selection and close modal
    savedSelectionFromToolbarRef.current = null;
    setShowSignatureCanvas(false);
    setSignatureRole(null);
  };

  const handleSignatureMove = (id: string, x: number, y: number) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, x, y } : sig
    ));
  };  const handleCancelSignature = () => {
    setShowSignatureCanvas(false);
    setSignatureRole(null);
  };

  const handleCancelSubmission = () => {
    setShowSubmissionModal(false);
  };

  const handleConfirmSubmission = () => {
    // Close modal and proceed with submission
    setShowSubmissionModal(false);
  };

  // Helper function to capture complete document HTML for PDF generation
  const captureDocumentHTML = (): string => {
    const pagesContainer = pageContainerRef.current;
    if (!pagesContainer) return '';

    // Clone the pages container to avoid affecting the UI
    const clone = pagesContainer.cloneNode(true) as HTMLElement;
    
    // Remove interactive elements that shouldn't be in PDF
    const interactiveElements = clone.querySelectorAll('.no-print, .formatting-toolbar, .sidebar-form, .add-signatory-form, .remove-btn, button[aria-label]');
    interactiveElements.forEach(el => el.remove());
    
    // Get the global styles element
    const globalStylesEl = document.getElementById('ap-global-css');
    const globalStyles = globalStylesEl ? globalStylesEl.textContent : '';
    
    // Get all stylesheets and inline them
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    // Construct complete HTML document with proper structure
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activity Plan</title>
  <style>
    /* Global Activity Plan Styles */
    ${globalStyles}
    
    /* Additional captured styles */
    ${styles}
    
    /* Ensure fonts load */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
    
    /* PDF-specific overrides to match print layout */
    @page { size: A4; margin: 0; }
    body, html { 
      background: white !important; 
      margin: 0 !important; 
      padding: 0 !important; 
    }
    .no-print, .formatting-toolbar, .sidebar-form, .add-signatory-form, .remove-btn { 
      display: none !important; 
    }
    .ap-scope .page {
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
      height: 297mm !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 0mm !important;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .ap-scope .page:last-child {
      page-break-after: avoid;
    }
    /* Show sidebar (EXECUTIVE BOARD) on first page only */
    .ap-scope .page:first-of-type .sidebar { 
      visibility: visible !important; 
      display: block !important; 
    }
    .ap-scope .page:not(:first-of-type) .sidebar { 
      visibility: hidden !important;
    }
    .ap-scope .pages-scale-wrapper { 
      transform: none !important; 
    }
    .page-content, .main-text, .editable-content, .static-content {
      overflow: visible !important;
      height: auto !important;
    }
  </style>
</head>
<body>
  <div class="ap-scope">
    ${clone.innerHTML}
  </div>
</body>
</html>
    `;

    return html;
  };

  // Handle PDF Preview
  const handlePreviewPDF = async () => {
    if (!plan?.id) {
      alert('Please save the activity plan first before previewing.');
      return;
    }

    setPdfGenerating(true);
    setShowPdfPreview(true);
    setPdfPreviewUrl(null);

    try {
      const html = captureDocumentHTML();
      const csrfToken = getCsrfMetaToken();
      
      const response = await axios.post(
        `/student/requests/activity-plan/${plan.id}/preview`,
        {
          html,
          members,
          signatories,
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setPdfPreviewUrl(response.data.preview_url);
        setPdfFilename(response.data.filename);
      } else {
        throw new Error(response.data.error || 'Failed to generate preview');
      }
    } catch (error: any) {
      console.error('PDF Preview Error:', error);
      alert(`Failed to generate PDF preview: ${error.response?.data?.error || error.message}`);
      setShowPdfPreview(false);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Handle PDF Generation
  const handleGeneratePDF = async () => {
    if (!plan?.id) {
      alert('Please save the activity plan first before generating PDF.');
      return;
    }

    if (!confirm('Generate final PDF for this activity plan?')) {
      return;
    }

    setPdfGenerating(true);

    try {
      const html = captureDocumentHTML();
      const csrfToken = getCsrfMetaToken();
      
      const response = await axios.post(
        `/student/requests/activity-plan/${plan.id}/generate-pdf`,
        {
          html,
          members,
          signatories,
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        alert('PDF generated successfully!');
        // Optionally download the PDF
        window.open(response.data.pdf_url, '_blank');
      } else {
        throw new Error(response.data.error || 'Failed to generate PDF');
      }
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      alert(`Failed to generate PDF: ${error.response?.data?.error || error.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Handle PDF Preview Close
  const handleClosePdfPreview = async () => {
    setShowPdfPreview(false);
    
    // Cleanup temporary preview file
    if (pdfFilename) {
      try {
        const csrfToken = getCsrfMetaToken();
        await axios.post(
          '/student/requests/activity-plan/cleanup-preview',
          { filename: pdfFilename },
          {
            headers: {
              'X-CSRF-TOKEN': csrfToken,
            },
          }
        );
      } catch (error) {
        console.error('Failed to cleanup preview file:', error);
      }
    }
    
    setPdfPreviewUrl(null);
    setPdfFilename(null);
  };

  // Handle PDF Download from Preview
  const handleDownloadPdf = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement('a');
      link.href = pdfPreviewUrl;
      link.download = `activity_plan_${plan?.id || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (isSaving) return; // Prevent duplicate saves

    setIsSaving(true);
    
    try {
      const csrfToken = getCsrfMetaToken();
      
      // If no plan exists, create a draft first using Inertia
      if (!plan?.id) {
        router.post('/student/requests/activity-plan/create-draft', {
          category: 'normal'
        }, {
          preserveState: false,
          preserveScroll: false,
          onSuccess: () => {
            // Will redirect to the new plan page
          },
          onError: (errors) => {
            console.error('Failed to create draft:', errors);
            alert('Failed to create draft. Please try again.');
            setIsSaving(false);
          }
        });
        return;
      }

      // Save the current state to database
      const html = captureDocumentHTML();
      
      // Prepare the data to save
      const draftData = {
        html,
        pages,
        members,
        signatories,
        signatures,
        timestamp: new Date().toISOString(),
      };
      
      // Save to database via API
      console.log('Saving document for plan ID:', plan.id);
      const response = await axios.post(
        `/student/requests/activity-plan/${plan.id}/save-document`,
        {
          document_html: html,
          document_data: JSON.stringify(draftData),
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Save response:', response.data);

      if (response.data.success) {
        // Also store in localStorage as backup
        localStorage.setItem(`activity_plan_draft_${plan.id}`, JSON.stringify(draftData));

        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        // Show success message briefly (draft saved)
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = '✓ Draft saved successfully';
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to save document');
      }
      
    } catch (error: any) {
      console.error('Save Error:', error);
      alert(`Failed to save draft: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark as having unsaved changes when content changes
  useEffect(() => {
    if (pages.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [pages, members, signatories]);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, members, signatories, signatures, plan?.id, isSaving]);

  // Removed autosave/draft tracking

  useEffect(() => {
    const measureContentHeight = (pageSelector: string) => {
      const page = document.querySelector(pageSelector) as HTMLElement | null;
      const content = page?.querySelector(".main-text") as HTMLElement | null;
      return content?.clientHeight || 0;
    };

    const firstH = measureContentHeight("#measure-page-1");
    const subH = measureContentHeight("#measure-page-2");
    
    if (firstH > 0 && subH > 0 && (layoutHeights.firstPageContentH !== firstH || layoutHeights.subsequentPageContentH !== subH)) {
        setLayoutHeights({
            firstPageContentH: firstH,
            subsequentPageContentH: subH,
        });
    }
  }, []);

  useLayoutEffect(() => {
      if (signatoriesRef.current) {
          setSignatoriesHeight(signatoriesRef.current.offsetHeight);
      }
  }, [signatories]);

  const calculateAndSetPages = useCallback((currentPages: string[]) => {
    const { firstPageContentH, subsequentPageContentH } = layoutHeights;
    if (firstPageContentH === 0 || subsequentPageContentH === 0 || signatoriesHeight === 0) return;

    const fullHtml = currentPages.join('');
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = fullHtml;
    const allNodes = Array.from(tempContainer.childNodes);

    const measureElement = document.createElement('div');
    document.body.appendChild(measureElement);
    Object.assign(measureElement.style, {
      position: 'absolute', left: '-9999px', visibility: 'hidden',
      fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5',
      width: 'calc(210mm - 19mm - 130px - 1.5rem)', 
    });
    
    const newPages: string[] = [];
    let currentPageNodes: ChildNode[] = [];
    const HEIGHT_BUFFER = 5; 

    for (const node of allNodes) {
      currentPageNodes.push(node);
      const currentContentHtml = currentPageNodes.map((n: any) => (n as any).outerHTML || n.textContent).join('');
      measureElement.innerHTML = currentContentHtml;
      
      const isFirstPage = newPages.length === 0;
      const maxContentHeight = isFirstPage ? firstPageContentH : subsequentPageContentH;

      if (measureElement.scrollHeight > (maxContentHeight - HEIGHT_BUFFER)) {
        const overflowingNode = currentPageNodes.pop() as HTMLElement | ChildNode | undefined;
        const baseContentHtml = currentPageNodes.map((n: any) => (n as any).outerHTML || n.textContent).join('');
        const isElement = !!(overflowingNode && (overflowingNode as any).nodeType === Node.ELEMENT_NODE);
        const tagName = isElement ? (overflowingNode as HTMLElement).tagName?.toLowerCase() : '';
        const isAtomicBlock = tagName === 'table' || tagName === 'ul' || tagName === 'ol';
        const isSplittable = isElement && !isAtomicBlock && (overflowingNode as any).textContent && (overflowingNode as any).textContent.includes(' ');

        if (isSplittable) {
          const elementNode = overflowingNode as HTMLElement;
          const contentParts = elementNode.innerHTML.split(/(<[^>]*>|\s+|[^\s<]+)/g).filter(Boolean);
          let low = 0, high = contentParts.length, bestFitIndex = 0;
          
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testHtml = contentParts.slice(0, mid).join('');
            const tempNode = elementNode.cloneNode(false) as HTMLElement;
            tempNode.innerHTML = testHtml;
            measureElement.innerHTML = baseContentHtml + tempNode.outerHTML;

            if (measureElement.scrollHeight <= (maxContentHeight - HEIGHT_BUFFER)) {
              bestFitIndex = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }

          const fittingHtml = contentParts.slice(0, bestFitIndex).join('');
          const remainingHtml = contentParts.slice(bestFitIndex).join('');

          if (fittingHtml.trim()) {
            const fittingNode = elementNode.cloneNode(false) as HTMLElement;
            fittingNode.innerHTML = fittingHtml;
            newPages.push(baseContentHtml + fittingNode.outerHTML);
          } else if (baseContentHtml.trim()) {
            newPages.push(baseContentHtml);
          }

          if (remainingHtml.trim()) {
            const remainingNode = elementNode.cloneNode(false) as HTMLElement;
            remainingNode.innerHTML = remainingHtml;
            currentPageNodes = [remainingNode];
          } else {
            currentPageNodes = [];
          }
        } else {
          if (baseContentHtml.trim()) newPages.push(baseContentHtml);
          if (overflowingNode) currentPageNodes = [overflowingNode]; else currentPageNodes = [];
        }
      }
    }

    const lastPageTextHtml = currentPageNodes.map((n: any) => (n as any).outerHTML || n.textContent).join('');
    const hasSignatories = Object.values(signatories).some((arr: Signatory[]) => arr.length > 0);

    if (newPages.length === 0) {
        newPages.push(lastPageTextHtml);
        if (hasSignatories) newPages.push(''); 
    } else {
        measureElement.innerHTML = lastPageTextHtml;
        const lastPageTextHeight = measureElement.scrollHeight;
        
        if (hasSignatories && (lastPageTextHeight + signatoriesHeight > subsequentPageContentH - HEIGHT_BUFFER)) {
            newPages.push(lastPageTextHtml);
            newPages.push('');
        } else {
            newPages.push(lastPageTextHtml);
        }
    }
    
    document.body.removeChild(measureElement);
    if (JSON.stringify(newPages) !== JSON.stringify(currentPages)) {
      setPages(newPages);
    }
  }, [layoutHeights, signatoriesHeight, signatories]); 

  useEffect(() => {
    calculateAndSetPages(debouncedPages);
  }, [debouncedPages, calculateAndSetPages]);
  
  const handleContentChange = (index: number, newHtml: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parentEl = (range.startContainer as Node).parentElement as HTMLElement | null;
      const editableDiv = parentEl?.closest('[contenteditable="true"]') as HTMLElement | null;
      if (editableDiv) {
        const preCaretRange = document.createRange();
        preCaretRange.selectNodeContents(editableDiv);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const textContent = preCaretRange.toString();
        cursorPositionRef.current = { pageIndex: index, offset: textContent.length };
      }
    }
    const tempPages = [...pages];
    tempPages[index] = newHtml;
    setPages(tempPages);
    setActivePageIndex(index);
  };

  useLayoutEffect(() => {
    if (cursorPositionRef.current && pageContainerRef.current) {
        const { pageIndex, offset } = cursorPositionRef.current;
    const editableDiv = pageContainerRef.current.querySelector(`#editable-content-page-${pageIndex}`) as HTMLElement | null;
        if (editableDiv) {
            editableDiv.focus();
            let charCount = 0;
      let targetNode: Node | null = null;
            let offsetInNode = 0;

      function findNode(parentNode: Node): boolean {
        for (const node of Array.from(parentNode.childNodes)) {
                    if (node.nodeType === Node.TEXT_NODE) {
            const textLen = (node as Text).length;
            const nextCharCount = charCount + textLen;
                        if (offset <= nextCharCount) {
                            targetNode = node;
                            offsetInNode = offset - charCount;
                            return true;
                        }
                        charCount = nextCharCount;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (findNode(node)) return true;
                    }
                }
                return false;
            }
            findNode(editableDiv);
            
            const sel = window.getSelection();
            const range = document.createRange();
            if (targetNode) {
                const textLen = (targetNode as Text).length ?? 0;
      
                range.setStart(targetNode, Math.min(offsetInNode, textLen));
                range.collapse(true);
                if (sel) {
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
            } else {
                range.selectNodeContents(editableDiv);
                range.collapse(false);
                if (sel) {
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
            }
        }
        cursorPositionRef.current = null;
    }
  }, [pages]);

  useEffect(() => {
    if (cursorPositionRef.current) return;
    const editableDiv = pageContainerRef.current?.querySelector(`#editable-content-page-${activePageIndex}`) as HTMLElement | null;

    if (editableDiv && document.activeElement !== editableDiv) {
      editableDiv.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editableDiv);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [activePageIndex]);


  return (
    <MainLayout>
      <div className="ap-scope">
      
      {/* Back button only; header removed */}
      <div className="no-print px-6 pt-6">
        <button
          onClick={() => router.get('/student/requests/activity-plan')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition"
          aria-label="Back to Activity Requests"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Activity Requests
        </button>
      </div>
      <div className="no-print" style={{ position: 'absolute', left: '-9999px', visibility: 'hidden', pointerEvents: 'none' }}>
        <div id="measure-page-1">
          <Page 
            pageIndex={0} 
            totalPages={2} 
            members={members}
            onAddMember={() => {}}
            onDeleteMember={() => {}}
            showSignatories={false}
            signatoriesComponent={<div />}
          >
            <div />
          </Page>
        </div>
        <div id="measure-page-2">
          <Page 
            pageIndex={1} 
            totalPages={2} 
            members={members}
            onAddMember={() => {}}
            onDeleteMember={() => {}}
            showSignatories={false}
            signatoriesComponent={<div />}
          >
            <div />
          </Page>
        </div>
    <Signatories 
      signatories={signatories} 
      onAdd={()=>{}} 
      onDelete={()=>{}} 
      innerRef={signatoriesRef}
      signatures={signatures}
      onSignatureMove={handleSignatureMove}
    />
      </div>
      
      <div ref={pageContainerRef} className="App">
    <GlobalStyles />
  <Toolbar 
    onZoomChange={setZoomScale} 
    onStartSignature={(range)=>handleToolbarStartSignature(range)}
    onSave={handleSaveDraft}
    onPreview={handlePreviewPDF}
    onGeneratePDF={handleGeneratePDF}
    onSubmit={() => {
      // Show confirmation modal instead of submitting directly
      setShowSubmissionModal(true);
    }}
  />
        <div className="pages-viewport">
          <div className="pages-scale-wrapper" style={{ transform: `scale(${zoomScale})` }}>
            {pages.map((pageHtml, index) => (
                <Page 
                  key={index}
                  pageIndex={index} 
                  totalPages={pages.length}
                  members={members}
                  onAddMember={handleAddMember}
                  onDeleteMember={handleDeleteMember}
                  showSignatories={Object.values(signatories).some(arr => arr.length > 0) && index === pages.length - 1 && index > 0}
                  signatoriesComponent={
                    <Signatories
                        signatories={signatories}
                        onAdd={handleAddSignatory}
                        onDelete={handleDeleteSignatory}
                        signatures={signatures}
                        onSignatureMove={handleSignatureMove}
                    />
                  }
                >
                  {activePageIndex === index ? (
                    <EditableContent id={`editable-content-page-${index}`} html={pageHtml} onContentChange={(newHtml) => handleContentChange(index, newHtml)} />
                  ) : (
                    <div className="static-content" onClick={() => setActivePageIndex(index)} dangerouslySetInnerHTML={{ __html: pageHtml }} />
                  )}
                </Page>
            ))}
          </div>
        </div>
      </div>
      
      {/* Signature Canvas Modal */}
      {showSignatureCanvas && signatureRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border border-gray-200">
            <SignatureCanvas
              signerRole={signatureRole}
              onSave={handleSaveSignature}
              onCancel={handleCancelSignature}
            />
          </div>
        </div>
      )}
      
      {/* Signature Warning Modal */}
      <SignatureWarningModal
        isOpen={showSignatureWarning}
        onClose={() => setShowSignatureWarning(false)}
      />
      
      {/* Submission Confirmation Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onConfirm={handleConfirmSubmission}
        onCancel={handleCancelSubmission}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPdfPreview}
        pdfUrl={pdfPreviewUrl}
        onClose={handleClosePdfPreview}
        onDownload={handleDownloadPdf}
        isLoading={pdfGenerating}
        title="Activity Plan Preview"
      />
      </div>
    </MainLayout>
  );
};

export default App;