import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";

const PromptDialog = ({ open, onOpenChange, prompts }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
            <DialogHeader>
                <DialogDescription>
                    <div>
                        <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                            {Object.entries(prompts).map(([title, content]) => (
                                <React.Fragment key={title}>
                                    <DialogTitle>{title}</DialogTitle>
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => onOpenChange(false)} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export default PromptDialog;