"use client";
import { useState, useEffect, useRef } from "react";
import { set, z } from "zod";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { ObjectCard } from "@/components/object-card";
import { ObjectSchema } from "@/objectSchema";
import { Button } from "@/components/ui/button"; // Assuming you have a custom Button component

export default function SyncPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [object, setObjType] = useState<z.infer<typeof ObjectSchema>>();
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("");
  const [ontology, setOntology] = useState<any[]>([]);
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-components');
        console.log('Filtered ontology data:', filteredOntology);
        setOntology(filteredOntology);
      } else if (typeof data === 'object' && data !== null) {
        // Handle the case where data is an object
        filteredOntology = Object.values(data).filter((item: any) => item.group === 'master-data' || item.group === 'work-product-components');
        console.log('Filtered ontology data:', filteredOntology.slice(0, 5));
        setOntology(filteredOntology);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }
      console.log('68 Filtered ontology data:', filteredOntology, data);

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

  async function handleSubmit() {
    setPrompt("");
    setIsLoading(true);
    setObjType(undefined);

    if (!prompt && !existingContext) {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }

    const res = await fetch("/streaming/api", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: prompt, existingContext: existingContext, ontology: ontology }),
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
              handleSubmit();
            }
          }}
          placeholder="Describe the domain you want explored?"
        />
        <Button onClick={handleSubmit} className="m-auto bg-green-500 text-white px-4 py-2 rounded">
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
    </div>
  );
}