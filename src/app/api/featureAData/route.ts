// src/app/api/featureAData/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('5 GET');
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = process.env.GITHUB_PATH;
    const baseBranch = process.env.GITHUB_BASE_BRANCH;

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${baseBranch}/${path}`;

    console.log('21 url', url);

    if (!GITHUB_TOKEN || !owner || !repo || !path || !baseBranch) {
        return NextResponse.json(
            { error: 'GitHub configuration not properly set' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw',
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });

        console.log('30 response status', response.status);
        console.log('31 response headers', response.headers);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file from GitHub' }, { status: response.status });
        }

        const fileContent = await response.text();
        console.log('36 fileContent', fileContent);

        return NextResponse.json({ content: fileContent });
    } catch (error) {
        console.error('40 Fetch error', error);
        return NextResponse.json({ error: 'Failed to fetch file from GitHub' }, { status: 500 });
    }
}