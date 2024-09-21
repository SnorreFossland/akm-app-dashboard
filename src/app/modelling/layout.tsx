import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <main style={{ marginLeft: '28px',flex: 1, padding: '0rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;