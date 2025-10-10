import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import uicLogo from "./assets/uic-logo.png";
import tuvCertified from "./assets/tuv-certified.jpg";
import uicFooter from "./assets/uic-footer.jpg";

/*---------- Types ----------*/
type Member = { name: string; role: string };
type Signatory = { name: string; position: string };
type SignatoriesMap = Record<string, Signatory[]>;

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
  <style>{`
    @import "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
    @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap");
    
    :root { --brand-pink: #FF67D3; }
    /* Override Tailwind pink utilities to brand pink */
    .text-pink-50, .text-pink-100, .text-pink-200, .text-pink-300, .text-pink-400,
    .text-pink-500, .text-pink-600, .text-pink-700, .text-pink-800, .text-pink-900 { color: var(--brand-pink) !important; }
    .border-pink-50, .border-pink-100, .border-pink-200, .border-pink-300, .border-pink-400,
    .border-pink-500, .border-pink-600, .border-pink-700, .border-pink-800, .border-pink-900 { border-color: var(--brand-pink) !important; }
    .bg-pink-50, .bg-pink-100, .bg-pink-200, .bg-pink-300, .bg-pink-400,
    .bg-pink-500, .bg-pink-600, .bg-pink-700, .bg-pink-800, .bg-pink-900 { background-color: var(--brand-pink) !important; }
    .hover\:bg-pink-50:hover, .hover\:bg-pink-100:hover, .hover\:bg-pink-200:hover, .hover\:bg-pink-300:hover, .hover\:bg-pink-400:hover,
    .hover\:bg-pink-500:hover, .hover\:bg-pink-600:hover, .hover\:bg-pink-700:hover, .hover\:bg-pink-800:hover, .hover\:bg-pink-900:hover { background-color: var(--brand-pink) !important; }
    .hover\:text-pink-50:hover, .hover\:text-pink-100:hover, .hover\:text-pink-200:hover, .hover\:text-pink-300:hover, .hover\:text-pink-400:hover,
    .hover\:text-pink-500:hover, .hover\:text-pink-600:hover, .hover\:text-pink-700:hover, .hover\:text-pink-800:hover, .hover\:text-pink-900:hover { color: var(--brand-pink) !important; }

    /* --- Base Styles --- */
    body, .App { 
      font-family: "Times New Roman", Times, serif; 
      font-size: 12pt; 
    }
    .App {
      background-color: #f3f4f6; /* Light gray background for screen */
      padding: 2rem 0;
    }

    /* --- Page Layout for Screen View --- */
    .page {
      background: white; 
      width: 210mm; 
      height: 297mm; 
      max-height: 297mm;
      margin: 20px auto; 
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      box-sizing: border-box; 
      display: flex; 
      flex-direction: column;
      page-break-after: always; 
      page-break-inside: avoid; 
      overflow: hidden;
      padding: 0mm;
    }
    #page-header {
      padding-left: 6mm;
      padding-right: 13mm;
      padding-top: 6mm;
    }
    .page-content {
      padding-left: 6mm;
      padding-right: 13mm;
    }
    .page-footer { 
      flex-shrink: 0; 
      padding: 0 13mm 5mm 6mm;
      position: relative;
    }
  .page-content { 
        display: flex; 
        flex: 1;
        overflow: hidden;
    }
    .main-text { 
      flex: 1; 
      padding-left: 1.5rem; 
      position: relative; 
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .editable-content, .static-content { 
      outline: none; 
      line-height: 1.5; 
    }
    .static-content { 
      cursor: text; 
    }
    .editable-content:focus { 
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); 
      border-radius: 4px; 
    }
    .sidebar { 
      position: relative; 
      width: 130px; 
      align-self: stretch; 
      flex-shrink: 0; 
    }
    .sidebar-line { 
      position: absolute; 
      right: 4.02mm; 
      top: 1mm; 
      bottom: 40mm; /* stop before footer lines; increase to end higher, decrease to extend lower */
      border-right: 2px solid var(--brand-pink); 
    }

    /* --- Header rule helpers --- */
    .header-vertical-rule {
      position: absolute; left: 135.3px; top: 0; bottom: -2mm; width: 0; 
      border-left-width: 2px; border-left-style: solid; /* color via utility class */
    }
    .header-bottom-rule {
      position: absolute; left: 130px; right: 0; bottom: 3mm; /* adjust bottom to move the line up/down */
    }
    .header-left-bottom-rule {
      position: absolute; left: 0; bottom: 3mm; width: 130px; /* adjust bottom to move the line up/down */
    }

    /* Slight left nudge for header logo */
    .header-logo { margin-left: -9px; }

    /* --- Header typography --- */
    .header-title { font-family: Cambria, "Times New Roman", Times, serif; font-size: 18pt; font-style: italic; }
    .header-contacts { font-family: "Times New Roman", Times, serif; font-size: 8pt; line-height: 1.1; }
    .header-society { font-family: "Times New Roman", Times, serif; font-size: 9.5pt; }

    /* --- Footer rules (first page) --- */
    .footer-rules {
      position: absolute; top: -4mm; left: -6mm; right: 240px; /* screen: extend to left edge, shorten more on right to clear ISO */
    }

    /* --- Footer accreditation text size --- */
    .footer-acc {
      font-size: 8.67px; /* ~6.5pt at 96dpi */
      line-height: 1.25;
      font-family: Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 700; /* Tahoma Bold */
    }
    .footer-acc-block { max-width: 148mm; margin-left: auto; margin-right: auto; }

    /* --- Formatting Toolbar --- */
    .formatting-toolbar {
      position: sticky; top: 1rem; left: 50%; transform: translateX(-50%);
      background: white; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-radius: 0.75rem; padding: 0.5rem 0.75rem; display: flex; align-items: center;
      gap: 0.25rem; z-index: 50; width: fit-content; margin: 0 auto 1rem auto;
    }
    .formatting-toolbar .btn {
      padding: 0.35rem 0.65rem; font-size: 14px; border-radius: 0.375rem; border: none;
      background: transparent; cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .formatting-toolbar .btn:disabled { cursor: not-allowed; opacity: 0.5; }
    .formatting-toolbar .btn:hover:not(:disabled) { background-color: #f3f4f6; color: #ec4B99; }
    .formatting-toolbar .divider { width: 1px; background: #e5e7eb; margin: 0 0.5rem; height: 20px; }

    /* --- Signatories Section --- */
    .signatories-container {
      margin-top: auto; /* Pushes signatories to the bottom */
      padding-top: 2rem;
    }
    .signatory-item {
        break-inside: avoid;
    }
    .add-signatory-form {
      border: 1px dashed #d1d5db;
      border-radius: 0.5rem;
      background-color: #f9fafb;
    }
    .add-signatory-form input {
        width: 100%;
        font-size: 10pt;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        margin-bottom: 0.5rem;
    }

    /* --- Body content and signatories: uniform Times New Roman 11pt --- */
    .main-text,
    .main-text .editable-content,
    .main-text .static-content,
    .signatories-container {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    /* Ensure headings inside body use 11pt but keep their boldness where applied */
    .main-text h1,
    .main-text h2,
    .main-text h3,
    .main-text h4,
    .main-text h5,
    .main-text h6 {
      font-size: 11pt !important;
    }
    /* Neutralize Tailwind font-size utilities within body content/signatories to keep sizes equal */
    .main-text .text-xs,
    .main-text .text-sm,
    .main-text .text-base,
    .main-text .text-lg,
    .main-text .text-xl,
    .main-text .text-2xl,
    .signatories-container .text-xs,
    .signatories-container .text-sm,
    .signatories-container .text-base,
    .signatories-container .text-lg,
    .signatories-container .text-xl,
    .signatories-container .text-2xl {
      font-size: inherit !important;
    }

  /* --- Sidebar inner container to keep content centered and away from the vertical line --- */
  .sidebar-inner { width: 100%; max-width: 105px; margin-left: -8px; margin-right: auto; }

    /* --- Executive Board heading style (bold, uppercase, double underline) --- */
    .sidebar-heading {
      position: relative;
      display: inline-block;
      font-weight: 800;
      text-transform: uppercase;
      color: #111827; /* near-black for strong contrast */
      letter-spacing: 0.3px;
      
      white-space: nowrap;
    }
    .sidebar-heading::after {
      content: "";
      position: absolute; left: 0; right: 0; bottom: 0;
      height: 2px; background: #000;
    }
    /* Sidebar typography scale to avoid overlaps */
    .member-name { font-size: 10px; line-height: 1.1; letter-spacing: 0.2px; }
    .member-role { font-size: 9px; line-height: 1.1; }
    .sidebar-subheading { font-weight: 800; font-size: 10px; letter-spacing: 0.2px; }
    .sidebar-input { font-size: 10px; }
    .sidebar-btn { font-size: 11px; padding-top: 6px; padding-bottom: 6px; }

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
      .page {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        height: 100vh !important;
        max-height: none !important;
        overflow: hidden !important;
        padding: 0mm !important;
      }
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
  `}</style>
);

/* ---------- Toolbar Component ---------- */
const Toolbar: React.FC = () => {
  const exec = (command: string, value?: string) => document.execCommand(command, false, value ?? "");
  return (
    <div className="formatting-toolbar">
      <button onClick={() => exec("bold")} title="Bold" className="btn"><strong>B</strong></button>
      <button onClick={() => exec("italic")} title="Italic" className="btn"><em>I</em></button>
      <button onClick={() => exec("underline")} title="Underline" className="btn"><u>U</u></button>
      <div className="divider" />
      <button onClick={() => exec("justifyLeft")} title="Align Left" className="btn">⯇</button>
      <button onClick={() => exec("justifyCenter")} title="Align Center" className="btn">≡</button>
      <button onClick={() => exec("justifyRight")} title="Align Right" className="btn">⯈</button>
      <button onClick={() => exec("justifyFull")} title="Justify" className="btn">☰</button>
    </div>
  );
};

/*---------- Layout Components ----------*/
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
}

const Signatories: React.FC<SignatoriesProps> = ({ signatories, onAdd, onDelete, innerRef }) => {
  const [addingTo, setAddingTo] = useState<string | null>(null);

    return (
        <div ref={innerRef} className="signatories-container space-y-1">
      {(Object.entries(signatories) as Array<[string, Signatory[]]>).map(([category, people]) => (
                <div key={category}>
                    <p className="font-bold text-sm mb-1">
                        {category}
                    </p>
                    <div className="space-y-1">
            {people.map((person: Signatory, index: number) => (
                            <div key={index} className="w-full md:w-2/3 text-left text-sm signatory-item relative group">
                                <div className="h-8"></div>
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
                            <div className="pt-2">
                                <button 
                  onClick={() => setAddingTo(category)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full remove-btn transition-colors"
                                >
                                    + Add Signatory
                                </button>
                            </div>
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
            <div className="border-t-2 border-pink-500"></div>
            <div className="border-t-2 border-pink-500 mt-0.5"></div>
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
  render() {
    return <div id={this.props.id} className="editable-content" ref={this.elRef} onInput={this.handleInput} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: this.props.html }} />;
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
  const getInitialContent = () => `
    <div style="text-align: right;" class="text-sm font-semibold">SEPTEMBER 22, 2025</div><br>
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

  const debouncedPages = useDebounce(pages, 250);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorPositionRef = useRef<{ pageIndex: number; offset: number } | null>(null);
  const signatoriesRef = useRef<HTMLDivElement | null>(null);

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
        const isSplittable = !!(overflowingNode && (overflowingNode as any).nodeType === Node.ELEMENT_NODE && (overflowingNode as any).textContent && (overflowingNode as any).textContent.includes(' '));

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
    <>
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
        />
      </div>
      
      <div ref={pageContainerRef} className="App">
        <GlobalStyles />
        <Toolbar />

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
    </>
  );
};

export default App;