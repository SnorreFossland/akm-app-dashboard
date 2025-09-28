import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        // Include additional debugging info that might help with API troubleshooting
        apiVersion: '1.0',
        endpoints: {
            generate: '/api/vercel-ai/generate',
            genmodel: '/api/genmodel',
        }
    });
}

export async function HEAD(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'content-type': 'application/json',
            'x-api-status': 'available',
        },
    });
}

// Add an OPTIONS method to support CORS preflight requests
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
