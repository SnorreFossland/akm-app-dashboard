'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { closeCurrentDomainDialog } from '@/store/uiSlice';

export default function GlobalCurrentDomainDialog() {
    const open = useAppSelector((s) => s.ui.currentDomainDialogOpen);
    const domain = useAppSelector((s) => s.modelUniverse?.phData?.domain);
    const dispatch = useAppDispatch();

    // If there's no domain at all, don't render the dialog structure
    if (!domain) return null;

    return (
        <Dialog open={closed} onOpenChange={(v) => (v ? null : dispatch(closeCurrentDomainDialog()))}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Current Domain</DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-3">
                            <div>
                                <span className="font-semibold">Name:</span> {domain?.name || '-'}
                            </div>

                            {domain?.description && (
                                <div>
                                    <div className="font-semibold mb-1">Description</div>
                                    <p className="whitespace-pre-wrap">{domain.description}</p>
                                </div>
                            )}

                            {domain?.presentation && (
                                <div>
                                    <div className="font-semibold mb-1">Presentation</div>
                                    <pre className="max-h-64 max-w-[95vw] overflow-auto rounded bg-muted p-2 text-sm">
                                        {domain.presentation}
                                    </pre>
                                </div>
                            )}

                            {domain?.additionalContext && (
                                <div>
                                    <div className="font-semibold mb-1">Additional Context</div>
                                    <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-sm">
                                        {domain.additionalContext}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => dispatch(closeCurrentDomainDialog())}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}