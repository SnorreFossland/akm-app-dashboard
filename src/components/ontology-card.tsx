import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
//make a card for presenting ontology data (concepts/terms and relationships) in the system
interface Term {
    name: string;
    description: string;
    proposedType: string;
}
interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
}

interface OntologyCardProps {
    terms: {
        objects: Term[];
        relationships: Relationship[];
    };
}

export const OntologyCard = ({ terms }: OntologyCardProps ) => {
    console.log('22 terms:', terms);
    return (
        <>
            <div className="flex flex-wrap flex-grow p-2 m-auto">
                <Card className="flex-col w-2/3">
                    <div className="text-white">Terms</div>
                    <CardContent className="grid gap-2">
                        {terms.objects?.map((term, index) => (
                            <div key={term.name+index} className="grid gap-2">
                                <div className="bg-gray-400 p-1 rounded-md">
                                    <span className="text-lg font-bold">{term.name} </span>
                                    <span className="text-sm ps-4"> {term.description}</span>
                                    <span className="text-sm">{term.proposedType}  </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="flex-col w-1/3 h-full" style={{ height: 'calc(100vh - 48rem)' }}>
                    <div className="text-white">Relations</div>
                    <CardContent className="grid gap-2">
                        {terms.relationships?.map((rel, index) => (
                            <div key={rel.name+index} className="grid gap-2">
                                <div className="bg-gray-400 p-1 rounded-md">
                                    <p className="text-sm">{rel.nameFrom} -> {rel.name}  -> {rel.nameTo}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );

};