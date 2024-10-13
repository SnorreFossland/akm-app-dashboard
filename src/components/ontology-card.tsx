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
    return (
        <>
            <div className="flex">
                <Card className="w-2/3">
                    <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">
                            Suggested Concepts/Terms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {terms.objects?.map((term, index) => (
                            <div key={term.name+index} className="grid gap-2">
                                <div className="bg-gray-700 p-1 rounded-md">
                                    <span className="text-lg font-bold">{term.name} </span>
                                    <span className="text-sm ps-4"> {term.description}</span>
                                    <span className="text-sm">{term.proposedType}  </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="w-1/3">
                    <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">
                            Suggested relationships between the concepts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {terms.relationships?.map((rel, index) => (
                            <div key={rel.name+index} className="grid gap-2">
                                <div className="bg-gray-700 p-1 rounded-md">
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