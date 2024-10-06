"use client";
import { useState, useEffect } from "react";
import { set, z } from "zod";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button"; // Assuming you have a custom Button component

import { ObjectCard } from "@/components/object-card";
import { ObjectSchema } from "@/objectSchema";
import { metamodel } from '@/metamodel/metamodel';

export default function SyncPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [object, setObjType] = useState<z.infer<typeof ObjectSchema>>();
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("");
 

  const [ontology, setOntology] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [terms, setTerms] = useState("");
  const [ontologyString, setOntologyString] = useState(""); 
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [step, setStep] = useState(1);

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

  let contextPrompt: string = "";
  let ontologyPrompt: string = "";
  let metamodelPrompt: string = "";
  let systemPrompt: string = "";

  ontologyPrompt = `
## **Ontology**

 **List of Ontology Terms:**
  ${ontologyString}
  `;

  metamodelPrompt = `
  # **Metamodel:**
  - Object Types:
  ${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}
  
  - Relationship Types:
  ${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}

## **Instructions**

You are tasked with first creating **Information objects** from the list of Ontology Terms and establishing relationships among them, adhering to the provided metamodel and ontology.

After creating Information objects with relationships, **create the related Tasks, Views, and Roles** based on domain analysis and logical associations with the Information objects and their relationships.

Your goal is to expand the knowledge base with at least **10 new Information objects and some Views, Tasks and Roles** with corresponding set of relationships, ensuring all objects are interconnected.

### **Object Creation**

- First **Create Information Objects:**
  - Create based on ontology terms.
  - Include an attribute 'proposedType' derived from the ontology.
  - Provide detailed descriptions without repeating the object's name.
  - Use ontology terms for 'name' and 'proposedType'.
  - Then Establish 'refersTo' relationships among Information objects.

- Next add **Tasks, Views, and Roles objects** based on the metamodel:
  - Create based on the actions, processes, and responsibilities identified during domain analysis of the Prompt: ${prompt}.
  - Do **not** add the 'proposedType' attribute.
  - Ensure names are appropriate (e.g., Views should not include the word "view" in the name).
  - Establish relationships between Tasks, Views, and Roles with Information objects.
  1. **Define Tasks:**
    - Identify actions or processes interacting with Information objects.
    - Create Tasks with descriptive names including a verb.
    - Provide detailed descriptions without using the word "task."
    - Establish 'worksOn' relationships between Tasks and Information objects.
    - Sequence tasks using 'triggers' relationships.

  2. **Develop Views:**
    - Create Views representing the presentation of Information objects for Tasks.
    - Names should not include the word "view."
    - Make sure that you create Views that cover all Information objects.
    - Establish 'applies' relationships from Tasks to Views.
    - Establish 'refersTo' relationships from Views to the created Information objects.
    - Ensure Views are connected to at least one Task and an Information object.

  3. **Assign Roles:**
    - Define Roles that perform or manage Tasks.
    - Provide detailed descriptions without repeating the role's name.
    - Establish 'performs' or 'manages' relationships from Roles to Tasks.

  4. **Finalization:**
    - Ensure all objects are interconnected, forming a cohesive knowledge structure.
    - Makd sure that Tasks are connected to at least one Role and one View.
    - Confirm that View are connected to Information objects.
    - Verify that all specified relationships are established according to the metamodel.

### **Constraints**

- **Language Usage:**
  - Do **not** use the word "domain" in descriptions.
  - Avoid using the type name ('typeName') in descriptions.
  - Do **not** repeat the object's name in its description.

- **Attributes and Types:**
  - Do **not** add the 'proposedType' attribute to Views, Tasks, or Roles.
  - Ensure the 'proposedType' for Information objects is accurately derived from ontology terms.

- **Object and Relationship Creation:**
  - Do **not** create duplicate objects.
  - Avoid creating relationships that already exist.
  - Establish relationships supported by the metamodel.

### **Additional Guidelines**

- Use domain analysis to in the creation of Tasks, Views, and Roles for the created Information objects.
- Generate relationships flowing from Roles ➔ Tasks ➔ Views ➔ Information objects.
- Maintain formal, precise language throughout.
- Ensure all objects have at least one relationship.
- Make sure to also create Roles, Tasks and Views that are connected to Information objects.

### **Examples**

  {
    "objects": [
      {
        "id": "UUIDv4",
        "name": "Approve Request",
        "description": "Reviews and approves incoming requests based on predefined criteria.",
        "typeRef": "Task Type id",
        "typeName": "Task"
      },
      {
        "id": "UUIDv4",
        "name": "Manager",
        "description": "Oversees task execution and ensures objectives are met.",
        "typeRef": "Role Type id",
        "typeName": "Role"
      }
    ],
      "relships": [
        {
          "id": "UUIDv4",
          "name": "performs",
          "typeRef": "performs Relationship Type id",
          "fromobjectRef": "Manager Object id",
          "toobjectRef": "Approve Request Task id"
        }
      ]
  }
  `;

  // 1 First step ----------- is to analyze the domain and identify key concepts and terms and the relationships between them.
  async function handleFirstStep() {
    setIsLoading(true);
    setObjType(undefined);

    contextPrompt = `
## **Context:**
    - The user has provided a domain description.
    - Analyze the domain and identify key concepts and terms and use term name from the ontology list if possible.
    - Create a description of the domain that gives an summary of the content, do not include/repeat the word "domain" in the description.
    - Do not create any terms that already is Information objects in Existing Context.

  **Existing Context:**

  ${existingContext}

  `;

      systemPrompt = `
  You are a helpful assistant and Active Knowledge modeling expert helping to explore the knowledge concepts / terms of the domain provided in the user prompt: "${prompt}".

  ** Your Role:**
    - Analyze the domain and identify key concepts and terms and the relationships between them.
    - Analyze the concepts and suggest new objects and relationships based on the metamodel.
    - Create a list of terms and relationships based on the domain description.

`;

    metamodelPrompt = ''; // Reset the metamodel prompt for first step which is just to identify concepts and terms

    console.log("Step 1:", step, "SystemPrompt:", systemPrompt, "Prompt:", prompt, "ContextPrompt:", contextPrompt, "OntologyPrompt:", ontologyPrompt);
    if (!prompt && !existingContext) {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }
  
    const res = await fetch("/streaming/api/genmodel", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step: step, prompt: prompt, contextPrompt: contextPrompt, ontologyPrompt: ontologyPrompt, metamodelPrompt: metamodelPrompt, systemPrompt: systemPrompt })
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
      console.log("269 Step 1: Parsed data ", parsed);

      if (parsed.objects && Array.isArray(parsed.objects)) {
        const selectedTerms = parsed.objects.map((item: { name: string }) => '- '+ item.name + '\n ').join(' ');
        setTerms(selectedTerms);
        console.log("274 Selected terms:", selectedTerms, parsed.objects);
      } else {
        console.error("Parsed data does not contain object or objects is not an array");
      }
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
  // 2 Second step ----------- is to generate Information, Relationship, Task, and View objects based on the terms and relations identified in the first step.  

  async function handleSecondStep() {
    setIsLoading(true);
    setObjType(undefined);

    systemPrompt = `
## Active Knowledge Modeling Assistant Prompt

You are a highly knowledgeable assistant and expert in Active Knowledge Modeling, tasked with exploring and enriching the knowledge concepts and terms within a specified domain. 
Your primary objective is to ensure a comprehensive and cohesive knowledge structure based on the user's input.
you will be creating objects defined in the metamodel and based on the terms and relations identified in the first step.


### **Your Role:**
1. **Analyze the Terms:**
- Analyze the terms extracted from the ontology and presented in the Ontology List of Terms.
- Analyze the relations between the terms and create relationships between the objects according to the metamodel.

2. **Object and Relationship Management:**
   - Suggest new objects and relationships based on the metamodel, where applicable.
   - Ensure that every object in the domain has at least one relationship.
   - Create and establish connections between new objects and existing ones, adhering strictly to the rules of the metamodel.
   - Generate universally unique identifiers (UUIDs) for all objects and relationships.
   - Avoid duplicating relationships or objects that have been previously created.
   - Ensure that missing or incomplete relationships between existing objects are identified and addressed.
   - Do not create new objects if they already exist, but you may establish new relationships involving them.

3. **Description Enhancement:**
   - For any existing objects that lack a description, provide a suitable and informative one, ensuring it captures the objects essence without repeating the objects name.
   - Ensure that descriptions are clear, precise, and aligned with the domain, reflecting the object's role within the system.

### **Styling Guidelines:**
- Use formal, precise, and unambiguous language.
- Avoid colloquial expressions to maintain professionalism and clarity.

### **Key Objectives:**
- Guarantee that every object has at least one relationship.
- Establish and validate relationships between both new and existing objects according to the metamodels logic.
- Provide or enhance object descriptions to ensure every entity is fully defined without redundancy.
`;

    ontologyPrompt = `
## **Ontology**

 **List of Terms:**
  ${terms}
  `;
    console.log("336 Step 2:", step, terms);
    console.log("337 Step 2:", step, "SystemPrompt:", systemPrompt, "Prompt:", prompt, "ContextPrompt:", contextPrompt, "OntologyPrompt:", ontologyPrompt, "Metamodel:", metamodelPrompt);

    const res = await fetch("/streaming/api/genmodel", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step: step, prompt: prompt, contextPrompt: contextPrompt,  ontologyPrompt: ontologyPrompt,  metamodelPrompt: metamodelPrompt, systemPrompt: systemPrompt }),
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
      console.log("381 Step 2: Parsed data:", parsed);
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