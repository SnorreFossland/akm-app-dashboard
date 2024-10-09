// src/features/featureA/featureAAPI.ts

// Define or import the DataType interface or type
interface DataType {
    // Define the properties of DataType here
    id: number;
    name: string;
    // Add other properties as needed
}

export async function fetchFeatureADataFromGitHub(): Promise<DataType[]> {
    const response = await fetch('/api/featureAData');

    if (!response.ok) {
        throw new Error('Failed to fetch data from GitHub');
    }
    const model = await response.json();
    console.log('18fetchFeatureADataFromGitHub model', model);
    return model
}

export async function saveFeatureADataToGitHub(data: DataType[]): Promise<string> {
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