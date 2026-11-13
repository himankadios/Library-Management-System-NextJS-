'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Download, FileText, ExternalLink, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function FilePreviewModal({ isOpen, onClose, file }) {
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (file && file.fileType === 'txt' && isOpen) {
      setLoadingText(true);
      fetch(`/api/files/${file.id}/preview`)
        .then((r) => r.text())
        .then((text) => setTextContent(text))
        .catch(console.error)
        .finally(() => setLoadingText(false));
    }
  }, [file, isOpen]);

  if (!file) return null;

  const isPdf = file.fileType === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(file.fileType);
  const isText = file.fileType === 'txt';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${file.name}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Preview Content Area */}
        <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[400px] max-h-[650px] flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={`/api/files/${file.id}/preview`}
              title={file.name}
              className="w-full h-[550px] border-0"
            />
          ) : isImage ? (
            <div className="p-4 flex items-center justify-center max-h-[550px] overflow-auto">
              <img
                src={`/api/files/${file.id}/preview`}
                alt={file.name}
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : isText ? (
            <div className="p-6 w-full h-[500px] overflow-auto font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-slate-900">
              {loadingText ? 'Loading text contents...' : textContent}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-royal-100 dark:bg-royal-950/60 flex items-center justify-center text-royal-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Direct Preview Unavailable
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                .{file.fileType.toUpperCase()} documents are binary packages. Download the file to view it locally in Microsoft Office, LibreOffice or an archive extractor.
              </p>
              <a
                href={`/api/files/${file.id}/download`}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
              >
                <Download className="w-4 h-4" /> Download Document ({(file.fileSize / 1024).toFixed(1)} KB)
              </a>
            </div>
          )}
        </div>

        {/* File Metadata footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Category: <strong className="text-slate-700 dark:text-slate-200">{file.category}</strong> · Size:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {(file.fileSize / 1024).toFixed(1)} KB
            </strong> · Downloads: <strong className="text-royal-600 dark:text-royal-400">{file.downloadCount}</strong>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/files/${file.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Tab
            </a>
            <a
              href={`/api/files/${file.id}/download`}
              download
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
