'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OntologySearch() {
    const [domain, setDomain] = useState('');
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!domain.trim()) {
            setError('Please enter a domain to search for.');
            return;
        }
        setLoading(true);
        setError(null);
        setTerms([]);

        try {
            const response = await fetch(
                `/api/search-ontology?domain=${encodeURIComponent(domain)}&ontologyType=ONTOLOGY&ontologies=ICD10CM`
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Fetched data:', data.terms, data);
            
            const filteredData = data.terms.map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                    description: item.definition
                };
            });
            console.log('Filtered data:', filteredData);
            setTerms(filteredData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch ontology terms.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAllToClipboard = () => {
        const allDescriptions = 'Objects: ' + terms.map(t => t.name +' - '+ t.description).join('\n');
        navigator.clipboard.writeText(allDescriptions).then(() => {
            alert('All descriptions copied to clipboard');
        }).catch((err) => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Ontology Search</h1>
            <form onSubmit={handleSearch} className="space-y-4 mb-4">
                <div>
                    <Label htmlFor="domain">Enter a domain (e.g., dementia)</Label>
                    <Input
                        id="domain"
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter a domain"
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </form>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {loading && <p className="mb-4">Loading...</p>}
            {terms.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Ontologies related to "{domain}":
                    </h2>
                    <Button onClick={handleCopyAllToClipboard} className="mb-4">
                        Copy All to Clipboard
                    </Button>
                    <ul className="list-disc pl-5 space-y-2">
                        {terms.map((term) => (
                            <li key={term.id}>
                                <strong>{term.name}</strong>: {term.description}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}