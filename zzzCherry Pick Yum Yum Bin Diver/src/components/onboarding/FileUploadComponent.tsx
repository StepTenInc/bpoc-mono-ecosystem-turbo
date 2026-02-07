'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { toast } from '@/components/shared/ui/toast';

interface FileUploadComponentProps {
    onFileUploaded: (url: string) => void;
    documentType: string;
    candidateId: string;
    accept?: string;
    maxSize?: number; // in MB
}

export default function FileUploadComponent({
    onFileUploaded,
    documentType,
    candidateId,
    accept = 'image/*,.pdf',
    maxSize = 5
}: FileUploadComponentProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`File size must be less than ${maxSize}MB`);
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, PNG, and PDF files are allowed');
            return;
        }

        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);
            formData.append('candidateId', candidateId);

            const res = await fetch('/api/onboarding/documents/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setPreview(data.documentUrl);
            onFileUploaded(data.documentUrl);
            toast.success('File uploaded successfully!');

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {!preview ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500/50 transition-colors bg-white/5"
                >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 mb-2">
                        {uploading ? 'Uploading...' : 'Click or drag file to upload'}
                    </p>
                    <p className="text-xs text-gray-500">
                        Max size: {maxSize}MB • Formats: JPG, PNG, PDF
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded flex items-center justify-center">
                            <Upload className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-400">File uploaded</p>
                            <p className="text-xs text-gray-400 truncate max-w-[300px]">{preview}</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemove}
                        className="text-red-400 hover:text-red-300"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
