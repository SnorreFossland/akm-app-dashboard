// src/features/featureA/featureAAPI.ts

interface DataType {
    project: {
        phData: { metis: any }
        phFocus: any
        phUser: any
        phSource: any
    }
}

export async function fetchFeatureADataFromGitHub(): Promise<DataType> {
    const response = await fetch('/api/featureAData');

    if (!response.ok) {
        throw new Error('Failed to fetch data from GitHub');
    }
    const data = await response.json();
    console.log('18 fetchFeatureADataFromGitHub model', data);
    return data
}

export async function saveFeatureADataToGitHub(data: any): Promise<DataType> {
    const response = await fetch('/api/saveFeatureAData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data to GitHub');
    }

    const result = await response.json();
    return result.pullRequestUrl;
}