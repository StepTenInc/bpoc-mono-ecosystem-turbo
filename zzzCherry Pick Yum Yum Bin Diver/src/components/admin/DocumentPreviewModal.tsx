'use client';

import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
  documentType?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  documentType = 'Document',
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  const isPDF = documentUrl?.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentUrl || '');

  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-6xl h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{documentType}</h3>
                  <p className="text-gray-400 text-sm">{documentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls (for images) */}
                {isImage && (
                  <div className="flex items-center gap-1 mr-2 bg-white/5 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-gray-400 text-sm w-12 text-center">{zoom}%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                {/* Open in New Tab */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(documentUrl, '_blank')}
                  className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>

                {/* Close Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-[#0a0a0f] p-6">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading document...</p>
                  </div>
                </div>
              )}

              {isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-full rounded-lg border border-white/10"
                  onLoad={() => setLoading(false)}
                  title={documentName}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={documentUrl}
                    alt={documentName}
                    className="max-w-full max-h-full rounded-lg shadow-lg border border-white/10"
                    style={{ transform: `scale(${zoom / 100})` }}
                    onLoad={() => setLoading(false)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Preview not available for this file type</p>
                    <Button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
