'use client';
import { useState, useEffect } from "react";
import { set, z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import the Textarea component
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { ObjectCard } from "@/components/object-card";
import { OntologyCard } from "@/components/ontology-card";
import { ObjectSchema } from "@/objectSchema";
import { SystemConceptPrompt } from './prompts/system-concept-prompt';
import { SystemIrtvPrompt } from './prompts/system-irtv-prompt';
import { MetamodelPrompt } from './prompts/metamodel-prompt-irtv';
import { OntologyPrompt } from './prompts/ontology-prompt';
import { ContextPrompt } from './prompts/context-prompt';

const SyncPage = () => {
  const [domainDescription, setDomainDescription] = useState("");
  const [suggestedConcepts, setSuggestedConcepts] = useState("");
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("");
  const [ontology, setOntology] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [terms, setTerms] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<{ objects: Term[]; relationships: [] }>({ objects: [], relationships: [] });
  const [ontologyString, setOntologyString] = useState(""); 
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<any>(undefined);

  const [metamodelPrompt, setMetamodelPrompt] = useState(MetamodelPrompt);
  const [systemConceptPrompt, setSystemConceptPrompt] = useState(SystemConceptPrompt);
  const [systemIrtvPrompt, setSystemIrtvPrompt] = useState(SystemIrtvPrompt); 
  const [ontologyPrompt, setOntologyPrompt] = useState(OntologyPrompt);
  const [contextPrompt, setContextPrompt] = useState(ContextPrompt);

  useEffect(() => {
    setSystemConceptPrompt(`${SystemConceptPrompt}`);
    setContextPrompt(`${ContextPrompt} \n ${existingContext}`);
    setOntologyPrompt(`${OntologyPrompt} \n ${terms}`);
    setMetamodelPrompt(`${MetamodelPrompt}`);
    setStep(1);

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SESSION_STORAGE_DATA') {
        sessionStorage.setItem('memorystate', event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [existingContext, terms]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setExistingContext(text);
    } catch (error) {
      console.error('Failed to read clipboard contents: ', error);
    }
  };

  const handleFetchOntology = async () => {
    try {
      const response = await fetch(`/proxy?url=${encodeURIComponent('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        setOntology(filteredOntology);
      } else if (typeof data === 'object' && data !== null) {
        const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
        const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
        const termNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name + ' ')));
        const termNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
        setOntologyString(`master-data:\n ${termNamesMaster}`);
        console.log(`81 master-data:\n ${termNamesMaster},\n\n ontologyString: ${ontologyString}`);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }
    } catch (error) {
      console.error('Failed to fetch ontology data: ', error);
    }
  };

  // 1111111111111111111111 -----------------------------------
   const handleFirstStep = async () => {
    setIsLoading(true);
    setDomain(undefined);
    setTerms("");
  
    const prompt = `Please analyze the following domain description and incorporate the user-suggested concepts/terms into your analysis:
  **Domain Description:**
  ${domainDescription}
  
  **User-Suggested Concepts/Terms:**
  ${suggestedConcepts}`;
  
    if (!prompt && !existingContext) {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }
  
    console.log('110 prompt', prompt, 'systemConceptPrompt', systemConceptPrompt, 'contextPrompt', contextPrompt, 'ontologyPrompt', ontologyString);
  
    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          prompt: prompt || "",
          systemPrompt: systemConceptPrompt || "",
          contextPrompt: contextPrompt || "",
          ontologyPrompt: ontologyString || "",
          metamodelPrompt:  ""
        })
      });
  
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");
  
      const decoder = new TextDecoder();
      let data = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        data += decoder.decode(value, { stream: true });
      }
  
      const parsed = JSON.parse(data);
      console.log('141 parsed', parsed);
      if (parsed.objects && Array.isArray(parsed.objects)) {
        const selectedTermsString = parsed.objects.map((item: { name: string }) => `- ${item.name}`).join('\n');
        const selectedRelationsString = parsed.relationships.map((rel: { name: string, nameFrom: string, nameTo: string }) => `- ${rel.name} (from: ${rel.nameFrom}, to: ${rel.nameTo})`).join('\n');
 
        setTerms(`**Terms:***\n ${selectedTermsString}\n**Relations:**\n${selectedRelationsString}`);
        setSelectedTerms({ objects: parsed.objects, relationships: parsed.relationships });
        console.log('148 terms', terms, 'selectedTermsString', selectedTermsString, 'selectedRelationsString', selectedRelationsString);
        setStep(2);
      } else {
        console.error("Parsed data does not contain object or objects is not an array");
      }
    } catch (e) {
      console.error("Validation failed:", e instanceof Error ? e.message : e);
    }
  
    setIsLoading(false);
    setStep(2);
  };
  
  // 2222222222222222222222 -------------------------------------------
  const handleSecondStep = async () => {
    setIsLoading(true);
    setDomain(undefined);
    setStep(2);

  
    const prompt = `
  You are a highly knowledgeable assistant and expert in Active knowledge modeling and Information modelling.
  You are tasked with exploring and enriching the knowledge concepts and terms within the user-specified domain.
  Your first and primary objective is to ensure a comprehensive and cohesive knowledge structure based on the terms defined in the ontology according to the 'metamodel'.
  `;
    const ontologyPrompt = `
## **Ontology**

 **List of Terms:**
  ${terms}
 `;
  
    // console.log('158 prompt', prompt, 'systemIrtvPrompt', systemIrtvPrompt, 'contextPrompt', contextPrompt, 'ontologyPrompt', ontologyString);
    console.log('174 step', step,   'ontologyPrompt', ontologyPrompt);
   
    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          prompt: prompt || "",
          systemPrompt: systemIrtvPrompt || "",
          contextPrompt: "" ,
          ontologyPrompt: ontologyPrompt || "",
          metamodelPrompt: metamodelPrompt || ""
        })
      });
  
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");
  
      const decoder = new TextDecoder();
      let data = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        data += decoder.decode(value, { stream: true });
      }
  
      const parsed = JSON.parse(data);
      const validatedData = ObjectSchema.parse(parsed);
      setDomain(validatedData);
      setStep(3);
    } catch (e) {
      console.error("Validation failed:", e instanceof Error ? e.message : e);
    }
  
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (domain) {
      const jsonOutput = JSON.stringify(domain, null, 2);
      navigator.clipboard.writeText(jsonOutput).then(() => {
        console.log('JSON copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
      });
    }
  };

  const toggleContextVisibility = () => setIsContextVisible(!isContextVisible);
  const toggleOntologyVisibility = () => setIsOntologyVisible(!isOntologyVisible);

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

      <div className="flex items-start bg-gray-500 py-2 mx-2">
        <div className="flex flex-col mx-2 flex-grow">
          <label htmlFor="domainDescription" className="text-white">Domain Description</label>
          <Textarea
        id="domainDescription"
        className="flex-grow bg-gray-100 text-black p-2 rounded"
        value={domainDescription}
        disabled={isLoading}
        onChange={(e) => setDomainDescription(e.target.value)}
        placeholder="Enter domain description"
        rows={4} // Adjust the number of rows as needed
          />
        </div>
        <div className="flex flex-col mx-2 flex-grow">
          <label htmlFor="suggestedConcepts" className="text-white">Concepts/Terms that must be included</label>
          <Input
        id="suggestedConcepts"
        className="flex-grow bg-gray-100 text-black p-2 rounded"
        value={suggestedConcepts}
        disabled={isLoading}
        onChange={(e) => setSuggestedConcepts(e.target.value)}
        placeholder="Enter your concepts/terms to include, separated by commas. Example: concept1, concept2"
          />
        </div>
        <Button onClick={handleFirstStep} className="m-auto bg-green-500 text-white px-4 py-2 rounded mx-2 flex items-center justify-center h-32">
          Ask<br />Chat<br />GPT
        </Button>
      </div>

      {step === 1 && selectedTerms.objects.length > 0 && (
        <>
          <div className="mx-1 bg-gray-600 p-2 rounded">
            <OntologyCard terms={selectedTerms} />
          </div>
          <Button onClick={handleSecondStep} className="m-auto bg-green-500 text-white px-4 py-2 rounded">
              Click to generate IRTV objects and relationships based on these terms?
          </Button>
        </>
      )}

      {isLoading && <Loading />}
      {domain && (
        <Button onClick={handleCopy} className="mx-2 bg-blue-500 text-white rounded">
          Copy JSON
        </Button>
      )}

      {step === 3  && (
        <div className="flex items-center mx-2">
          <div className="mx-2 bg-gray-700 p-4 rounded max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            <ObjectCard domain={domain} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncPage;