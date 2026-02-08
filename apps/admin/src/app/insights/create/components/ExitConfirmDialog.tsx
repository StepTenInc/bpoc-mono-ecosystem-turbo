'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/shared/ui/alert-dialog';
import { Save, X } from 'lucide-react';

interface ExitConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaveDraft: () => Promise<void>;
    onExitWithoutSaving: () => void;
    hasPipeline: boolean;
}

export default function ExitConfirmDialog({
    open,
    onOpenChange,
    onSaveDraft,
    onExitWithoutSaving,
    hasPipeline,
}: ExitConfirmDialogProps) {
    const [saving, setSaving] = useState(false);

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await onSaveDraft();
        } finally {
            setSaving(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white flex items-center gap-2">
                        <X className="w-5 h-5 text-red-400" />
                        Exit Content Pipeline?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        {hasPipeline
                            ? 'You have unsaved progress. Would you like to save your work as a draft before exiting?'
                            : 'Are you sure you want to exit? Any unsaved progress will be lost.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600">
                        Cancel
                    </AlertDialogCancel>

                    {hasPipeline && (
                        <AlertDialogAction
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Draft & Exit
                                </>
                            )}
                        </AlertDialogAction>
                    )}

                    <AlertDialogAction
                        onClick={onExitWithoutSaving}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Exit Without Saving
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

import { useState } from 'react';
