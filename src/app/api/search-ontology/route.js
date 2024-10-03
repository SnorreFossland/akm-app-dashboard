import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const apiKey = process.env.BIOPORTAL_API_KEY;

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    try {
        const ontologyType = 'ONTOLOGY'; // Define ontologyType
        const ontologies = 'ICD10CM' //'HP,DOID,NCIT,SNOMEDCT,LOINC,ICD10,ICD9CM,ICD9,ICD10CM'; // Define ontologies

        // const response = await fetch(
        //     `http://data.bioontology.org/ontologies?display_context=false&display_links=false&include=acronym,name&include=aronym,description&apikey=${apiKey}`
        //     // `http://data.bioontology.org/ontologies?display_context=false&display_links=false&include=acronym,name&apikey=${apiKey}`
        // );
        
        const response = await fetch(`https://ontology.jax.org/api/hp/search?q=${encodeURIComponent(domain)}&page=0&limit=1000`); 

        // const response = await fetch(
        //     `https://data.bioontology.org/search/?q=${encodeURIComponent(
        //         domain
        //     )}&ontologyType=${encodeURIComponent('ONTOLOGY')}&collection.prefLabel=${encodeURIComponent(
        //         'dementia'
        //     )}&ontologyType=ONTOLOGY&display_context=true&display_links=true&require_exact_match=false&apikey=${apiKey}&${ontologyParam}=${ontologyValue}`
        // );
        // ontologies= HP,DOID,NCIT,SNOMEDCT,LOINC,ICD10,ICD9CM,ICD9,ICD10CM
        if (!response.ok) {
            throw new Error('Failed to fetch data from BioPortal API');
        }
        
        const data = await response.json();
        console.log('29 data:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}