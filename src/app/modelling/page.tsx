'use client';
import React, { useEffect, useRef } from 'react';

const ParentPage: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // useEffect(() => {
    //     const iframe = iframeRef.current;
    //     if (iframe) {
    //         iframe.onload = () => {
    //             try {
    //                 const iframeWindow = iframe.contentWindow;
    //                 if (iframeWindow) {
    //                     const sessionStorageData = iframeWindow.sessionStorage;
    //                     console.log('Session Storage from iFrame:', sessionStorageData);
    //                 }
    //             } catch (error) {
    //                 console.error('Error accessing session storage:', error);
    //             }
    //         };
    //     }
    // }, []);
    // console.log('24Parent Page Rendered', iframeRef.current, iframeRef.current?.contentWindow, iframeRef.current?.contentWindow?.sessionStorage, iframeRef);

    return (
        <div className="w-full h-screen m-0 p-0">
            <iframe 
                ref={iframeRef}
                // src="https://akmmclient-alfa.vercel.app/modelling" 
                src="http://localhost:3001/modelling"
                className="w-full h-full border-none"
                title="Embedded Page"
                allow="clipboard-read; clipboard-write"
            ></iframe>
        </div>
    );
};

export default ParentPage;