// src/features/featureA/components/HandleGetLocalFileClick.ts
import React from 'react';

export const handleGetLocalFileClick = (fileInputRef: React.RefObject<HTMLInputElement>) => {
  fileInputRef.current?.click();
};