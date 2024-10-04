"use client";
import { useState, useEffect, useRef } from "react";
import { set, z } from "zod";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button"; // Assuming you have a custom Button component

import { ObjectCard } from "@/components/object-card";
import { ObjectSchema } from "@/objectSchema";
import { metamodel } from '@/metamodel/metamodel';
import { on } from "events";

export default function SyncPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [object, setObjType] = useState<z.infer<typeof ObjectSchema>>();
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("");
 

  const [ontology, setOntology] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [ontologyString, setOntologyString] = useState(""); 
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [terms, setTerms] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [relations, setRelations] = useState<{ id: string; name: string; typeRef: string; fromobjectRef: string; toobjectRef: string }[]>([]);
  const [step, setStep] = useState(1);
  // const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SESSION_STORAGE_DATA') {
        sessionStorage.setItem('memorystate', event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      console.log('37 Pasted text:', text);
      setExistingContext(text);
    } catch (error) {
      console.error('Failed to read clipboard contents: ', error);
    }
  };

  const handleFetchOntology = async () => {
    let filteredOntology: any[] = [];
    try {
      const response = await fetch(`/proxy?url=${encodeURIComponent('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('53 Fetched ontology data:', data);
      // setOntology(data);
      // Check if data is an array before filtering
      if (Array.isArray(data)) {
        filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        console.log('Filtered ontology data:', filteredOntology);
        setOntology(filteredOntology);
      } else if (typeof data === 'object' && data !== null) {
        // Handle the case where data is an object
        const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
        const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
        // extract terms and relations from the filtered ontology 
        // const termMaster = filteredMaster.map((item: any) => item.entity_name);
        // const termWP = filteredWP.map((item: any) => item.entity_name);
        const termNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name+ ' ')));
        const termNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
        setOntologyString(`master-data:\n ${termNamesMaster}`); //\n\n  work-product-component:\n${termNamesWP}`);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }

    } catch (error) {
      console.error('Failed to fetch ontology data: ', error);
    }
  };

  const toggleContextVisibility = () => {
    setIsContextVisible(!isContextVisible);
  };

  const toggleOntologyVisibility = () => {
    setIsOntologyVisible(!isOntologyVisible);
  };
[];
  let contextPrompt: string = "";
  let ontologyPrompt: string = "";
  let metamodelPrompt: string = "";
  let systemPrompt: string = "";


  contextPrompt = `
**Context:**
- The user has provided a domain description.
- Analyze the domain and identify key concepts and terms and use the ontology list if possible.
- Create a description of the domain that gives an summary of the content, do not include/repeat the word "domain" in the description.

Existing objects:
  ${existingContext}
`;

  systemPrompt = `
  You are a helpful assistant and Active Knowledge modeling expert helping to explore the knowledge concepts/terms of the domain provided in the user prompt.
  
  **Your Role:**
  - Analyze the domain and identify key concepts and terms and the relationships between them.
  - Analyze the concepts and suggest new objects and relationships based on the metamodel.
  - Ensure all objects have at least one relationship.
  - Create relationships between new and existing objects.
  - Create relationships between objects based on the metamodel.
  - Always generate UUID as id for objects and relationships.
  Make sure to not create relationships that already exist or previously created.
  Make sure to create missing relationships between existing objects.
  Make sure to create relationships between new objects and existing objects.
  Don't create existing objects, but relationships can be created to or from existing objects and new objects.
  If existing objects description field is empty, add your best suggestion of a description.
  `;


  ontologyPrompt = `
**Ontology:**
Check the ontology for matching word to use as Term name and use the ontology name if it can be used as the term name.
Do not create already existing terms.
Terms:
  ${ontologyString}
  `;

  metamodelPrompt = `
  **Metamodel:**
  - Object Types:
  ${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}
  
  - Relationship Types:
  ${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}
  - Generate the Information objects based on the terms and relations.
  - Generate the rest of the IRTV based on the confirmed concepts and relationships.
    

 **Examples:**
  {
    "objects": [
      {
        "id": "id as uuidv4",
        "name": "Object Name",
        "description": "Detailed description without repeating the name.",
        "proposedType": "CamelCaseType and only for Information objects",
        "typeRef": "Object Type id",
        "typeName": "Object Type Name"
      }
    ],
    "relships": [
      {
        "id": "id as uuidv4",
        "name": "Relationship Name",
        "typeRef": "Relationship Type id"
        "fromobjectRef": "id of the from object",
        "toobjectRef": "id of the target object",
      }
    ]
  }
  `;

  
  // First step ----------- is to analyze the domain and identify key concepts and terms and the relationships between them.
  async function handleFirstStep() {
    setIsLoading(true);
    setObjType(undefined);

    console.log("Step 1: Prompt:", prompt, "Context:", contextPrompt, "Ontology:", ontologyPrompt, "Metamodel:", metamodelPrompt, "System:", systemPrompt);
    if (!prompt && !existingContext) {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }

    metamodelPrompt = ''; // Reset the metamodel prompt for first step which is just to identify concepts and terms
  
    const res = await fetch("/streaming/api/genmodel", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step: 1, prompt: prompt, contextPrompt: contextPrompt, ontologyPrompt: ontologyPrompt, systemPrompt: systemPrompt }),
    });
  
    if (!res.ok) {
      console.error("Failed to fetch:", res.statusText);
      setIsLoading(false);
      return;
    }
  
    const reader = res.body?.getReader();
    if (!reader) {
      console.error("No reader available");
      setIsLoading(false);
      return;
    }
  
    const decoder = new TextDecoder();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      data += decoder.decode(value, { stream: true });
    }
  
    try {
      const parsed = JSON.parse(data);
      console.log("127 Parsed data 1. step:", parsed);
      setTerms(parsed.terms);
      setRelations(parsed.relations);
      setStep(2); // Move to the second step
    } catch (e) {
      if (e instanceof Error) {
        console.error("Validation failed:", e.message);
      } else {
        console.error("Validation failed:", e);
      }
    }
  
    setIsLoading(false);
  }
  
  async function handleSecondStep() {
    setIsLoading(true);
    setObjType(undefined);

    console.log("Step 1: Prompt:", prompt, "Context:", contextPrompt, "Ontology:", ontologyPrompt, "Metamodel:", metamodelPrompt, "System:", systemPrompt);


    ontologyPrompt = `
**Ontology:**
Terms:
    ${JSON.stringify({ terms: terms}, null, 2)}
use the list of terms to generate Information objects.
Relations:
    ${JSON.stringify({ relations: relations }, null, 2)}
use the list of relations to generate relationships between Information objects.  
Do not create already existing objects.
    `; 

  

    const res = await fetch("/streaming/api/genmodel", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step: 2,  terms: terms, relations: relations, metamodelPrompt: metamodelPrompt, systemPrompt: systemPrompt }),

    });
  
    if (!res.ok) {
      console.error("Failed to fetch:", res.statusText);
      setIsLoading(false);
      return;
    }
  
    const reader = res.body?.getReader();
    if (!reader) {
      console.error("No reader available");
      setIsLoading(false);
      return;
    }
  
    const decoder = new TextDecoder();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      data += decoder.decode(value, { stream: true });
    }
  
    try {
      const parsed = JSON.parse(data);
      console.log("127 Parsed data:", parsed);
      const validatedData = ObjectSchema.parse(parsed);
      setObjType(validatedData);
    } catch (e) {
      if (e instanceof Error) {
        console.error("Validation failed:", e.message);
      } else {
        console.error("Validation failed:", e);
      }
    }
  
    setIsLoading(false);
  }

  const handleCopy = () => {
    if (object) {
      const jsonOutput = JSON.stringify(object, null, 2);
      navigator.clipboard.writeText(jsonOutput).then(() => {
        console.log('JSON copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 mx-2 bg-gray-800">
      <div className="mx-auto">Explore a Domain:</div>

      <div className="flex items-center mx-2 bg-gray-700">
        <Button onClick={handlePasteFromClipboard} className="bg-green-500 text-white px-4 py-2 rounded">
          Paste Existing Context
        </Button>
        <Button onClick={toggleContextVisibility} className="bg-blue-500 text-white px-4 py-2 rounded ms-2">
          {isContextVisible ? "Hide Existing Context" : "Show Existing Context"}
        </Button>
        <div className="flex-grow"></div>
        <Input
          className="flex-grow bg-gray-100 text-black mx-auto mx-2"
          value={ontologyUrl}
          onChange={(e) => setOntologyUrl(e.target.value)}
          placeholder="Enter ontology URL"
        />
        <Button onClick={handleFetchOntology} className="bg-green-500 text-white px-4 py-2 rounded ml-2">
          Fetch Ontology
        </Button>
        <Button onClick={toggleOntologyVisibility} className="bg-blue-500 text-white px-4 py-2 rounded ml-2">
          {isOntologyVisible ? "Hide Ontology" : "Show Ontology"}
        </Button>
      </div>

      {isContextVisible && (
        <div className="mx-2 bg-gray-700 p-4 rounded">
          <h3 className="text-white font-bold">Existing Context:</h3>
          <pre className="text-white whitespace-pre-wrap">{existingContext}</pre>
        </div>
      )}

      {isOntologyVisible && (
        <div className="mx-2 bg-gray-700 p-4 rounded">
          <h3 className="text-white font-bold">Ontology:</h3>
          {ontology.map((item, index) => (
            <pre key={index} className="text-white whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>
          ))}
        </div>
      )}

      <div className="flex items-center mx-2">
        <Input
          className="flex-grow bg-gray-100 text-black mx-auto mx-2"
          value={prompt}
          disabled={isLoading}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              handleFirstStep();
            }
          }}
          placeholder="Describe the domain you want explored?"
        />
        <Button onClick={handleFirstStep} className="m-auto bg-green-500 text-white px-4 py-2 rounded">
          Send
        </Button>
      </div>

      {isLoading && <Loading />}
      <div className="mx-2 bg-gray-700 p-4 rounded max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
        <ObjectCard domain={object} />
      </div>
      {object && (
        <Button onClick={handleCopy} className="mx-2 bg-blue-500 text-white rounded">
          Copy JSON
        </Button>
      )}

      {step === 2 && (
        <div className="flex items-center mx-2">
          <Button onClick={handleSecondStep} className="m-auto bg-green-500 text-white px-4 py-2 rounded">
            Generate IRTV
          </Button>
        </div>
      )}
    </div>
  );
}