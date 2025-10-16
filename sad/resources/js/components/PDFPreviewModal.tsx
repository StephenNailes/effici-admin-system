import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  onClose: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
  title?: string;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  pdfUrl,
  onClose,
  onDownload,
  isLoading = false,
  title = 'Document Preview'
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIframeLoaded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-full h-full max-w-7xl max-h-screen mx-4 my-4 bg-white rounded-lg shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            {onDownload && pdfUrl && !isLoading && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="animate-spin text-red-600" />
              <p className="text-gray-600 font-medium">Generating PDF preview...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          ) : pdfUrl ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white">
                  <Loader2 size={48} className="animate-spin text-red-600" />
                  <p className="text-gray-600 font-medium">Loading preview...</p>
                </div>
              )}
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full border-0"
                title="PDF Preview"
                onLoad={() => setIframeLoaded(true)}
                style={{ display: iframeLoaded ? 'block' : 'none' }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">No preview available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Use the toolbar above to zoom, navigate, and interact with the document
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
