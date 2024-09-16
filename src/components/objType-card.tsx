import { ObjTypeSchema } from "@/src/objTypeSchema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ObjTypeCard({ objType }: { objType?: z.infer<typeof ObjTypeSchema> }) {
  if (!objType) return null;
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{objType.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {objType.description && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p>{objType.description}</p>
          </div>
        )}
        {objType.attributes && objType.attributes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Attributes</h3>
            <ul className="list-disc list-inside space-y-1">
              {objType.attributes.map((attribute: { name: string; type: string }) => (
                <li key={attribute.name}>
                  <strong>{attribute.name}:</strong> {attribute.type}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}