'use client';

import { useState, useRef } from 'react';
import type { CompId } from '@/lib/content/types';

interface PDFViewerComponentProps {
  src?: string;
  title?: string;
  height?: string;
  displayTitle?: boolean;
  displayPdf?: boolean;
  downloadButton?: boolean;
  comp_id: CompId;
  isAuthorMode: boolean;
  onConfigUpdate?: (config: Record<string, unknown>) => void;
}

export function PDFViewerComponent({
  src,
  title,
  height = '600px',
  displayTitle = true,
  displayPdf = true,
  downloadButton = true,
  comp_id,
  isAuthorMode,
  onConfigUpdate,
}: PDFViewerComponentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.includes('pdf')) {
      setUploadError('Please select a valid PDF file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('http://localhost:3001/upload-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          filename: file.name,
          component_id: comp_id,
        }),
      });

      const data = await res.json();

      if (data.success && onConfigUpdate) {
        onConfigUpdate({
          src: data.path,
          title: title || file.name.replace(/\.pdf$/i, ''),
        });
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // No PDF configured - show upload UI in author mode or placeholder in publish mode
  if (!src) {
    if (isAuthorMode) {
      return (
        <div
          className="p-8 border-2 border-dashed border-[var(--border)] rounded-md bg-[var(--background-secondary)] mb-4 transition-colors hover:border-[var(--link)]"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="w-12 h-12 text-[var(--foreground-muted)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[var(--foreground)] font-medium mb-1">
              Upload a PDF
            </p>
            <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)] mb-4">
              Drag and drop or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Choose PDF'}
            </button>
            {uploadError && (
              <p className="text-red-500 text-[length:var(--text-sm)] mt-2">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Publish mode with no PDF - show nothing
    return null;
  }

  // PDF is configured
  return (
    <div className="mb-6">
      {/* Title */}
      {displayTitle && title && (
        <h3 className="text-[length:var(--text-xl)] font-semibold text-[var(--foreground)] mb-3">
          {title}
        </h3>
      )}

      {/* PDF Display */}
      {displayPdf && (
        <object
          data={src}
          type="application/pdf"
          className="w-full rounded-md border border-[var(--border)]"
          style={{ height }}
        >
          <div className="flex flex-col items-center justify-center p-8 bg-[var(--background-secondary)]">
            <p className="text-[var(--foreground-muted)] mb-4">
              Unable to display PDF. Your browser may not support embedded PDFs.
            </p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open PDF
            </a>
          </div>
        </object>
      )}

      {/* Download Button */}
      {downloadButton && (
        <div className={displayPdf ? 'mt-3 flex justify-end' : ''}>
          <a
            href={src}
            download={title ? `${title}.pdf` : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download {title || 'PDF'}
          </a>
        </div>
      )}

      {/* Author mode: Replace PDF button */}
      {isAuthorMode && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] hover:text-[var(--link)] transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Replace PDF'}
          </button>
          {uploadError && (
            <p className="text-red-500 text-[length:var(--text-sm)] mt-1">
              {uploadError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
