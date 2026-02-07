'use client';

import React from 'react';

interface ContractPreviewProps {
    contractHtml: string;
}

export default function ContractPreview({ contractHtml }: ContractPreviewProps) {
    return (
        <div className="border border-white/20 rounded-lg overflow-hidden bg-white">
            <div
                className="p-8 text-black"
                dangerouslySetInnerHTML={{ __html: contractHtml }}
            />
        </div>
    );
}
