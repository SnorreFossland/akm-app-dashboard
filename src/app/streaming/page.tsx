// src/pages/sync.tsx
'use client';
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { set } from "zod";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave } from '@fortawesome/free-solid-svg-icons';

import { getFeatureAData } from '@/features/featureA/featureASlice';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading, LoadingBars, LoadingPulse, LoadingCircularProgress, LoadingDots } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { setObjects, setRelationships } from "@/features/featureA/featureASlice";

import { ObjectCard } from "@/components/object-card";
import { OntologyCard } from "@/components/ontology-card";
import { ObjectSchema } from "@/objectSchema";
import { SystemConceptPrompt } from './prompts/system-concept-prompt';
import { SystemIrtvPrompt } from './prompts/system-irtv-prompt';
import { MetamodelPrompt } from './prompts/metamodel-prompt-irtv'; // default metamodel prompt for IRTV
import { OntologyPrompt } from './prompts/ontology-prompt';
import { ContextPrompt } from './prompts/context-prompt';
import { Caesar_Dressing } from "next/font/google";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const SyncPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const data = useSelector((state: RootState) => state.featureA.data);
  const status = useSelector((state: RootState) => state.featureA.status);
  const error = useSelector((state: RootState) => state.featureA.error);

  const [domainDescription, setDomainDescription] = useState("");
  const [suggestedConcepts, setSuggestedConcepts] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState("");
  const [suggestedViews, setSuggestedViews] = useState("");
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("");
  const [ontology, setOntology] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [ontologyString, setOntologyString] = useState("");
  const [terms, setTerms] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<{ objects: []; relationships: [] }>({ objects: [], relationships: [] });
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<any>(undefined);
  const [dispatchDone, setDispatchDone] = useState(false);

  const [metis, setMetis] = useState<any>(null);
  const [currentModel, setCurrentModel] = useState<any>(null);


  const [metamodelPrompt, setMetamodelPrompt] = useState(MetamodelPrompt);
  const [systemConceptPrompt, setSystemConceptPrompt] = useState(SystemConceptPrompt);
  const [systemIrtvPrompt, setSystemIrtvPrompt] = useState(SystemIrtvPrompt);
  const [existingTerms, setExistingTerms] = useState([]);
  const [isExistingContext, setIsExistingContext] = useState(false);
  const [showUserInput, setShowUserInput] = useState(true);
  const [activeTab, setActiveTab] = useState('terms');
  const [showTerms, setShowTerms] = useState(true);
  const [showIrtv, setShowIrtv] = useState(true);

  useEffect(() => {
    setStep(1);
    // const handleMessage = (event: MessageEvent) => {
    //   if (event.data.type === 'SESSION_STORAGE_DATA') {
    //     sessionStorage.setItem('memorystate', event.data.data);
    //   }
    // };
    // window.addEventListener('message', handleMessage);
    // return () => {
    //   window.removeEventListener('message', handleMessage);
    // };
  }, [existingContext, terms]);

  useEffect(() => {
    type ExistingObject = { id: string; name: string; description: string; typeName: string };
    type ExistingRelationship = { id: string; name: string; nameFrom: string; nameTo: string };

    if (data?.project) {
      console.log('89 data', data);
      const metis1 = data.project?.phData?.metis;
      const focus = data.project?.phFocus;
      const user = data.project?.phUser;
      if (!metis1) { console.error('Data does not contain metis:', data); return };
      setMetis(metis1);

      if (metis?.metamodels) {
        const metamodel = metis.metamodels.find((mmodel: { name: string }) => mmodel.name.includes('IRTV'));
        const mmObjecttypeStrings = metamodel?.objecttypes.map((ot: any) =>
          `${ot.id} ${ot.name}`).join(', ');
        const mmRelationtypeStrings = metamodel?.relshiptypes.map((rt: any) =>
          `${rt.id} ${rt.name}`).join(', ');

        const metamodelPrompt = `
        **Metamodel:**
        - **Object Types:** \n ${mmObjecttypeStrings} 
        - **Relation Types:** \n ${mmRelationtypeStrings}
      `;

        setMetamodelPrompt(metamodelPrompt);
      }
      setMetamodelPrompt(`${MetamodelPrompt}`);

      const models = metis1.models;
      const curmod = models?.find((model: any) => model.id === focus?.focusModel?.id);
      (curmod) ? setCurrentModel(curmod) : setCurrentModel(metis?.models[0]);
      console.log('95 currentModel', curmod, currentModel, metis?.models);


      const existingObjects = currentModel?.objects?.map((obj: ExistingObject) => ({ id: obj.id, name: obj.name, description: obj.description, typeName: obj.typeName }));
      const existingRelationships = currentModel?.relships?.map((rel: ExistingRelationship) => ({ id: rel.id, name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo }));

      setExistingTerms(existingObjects?.filter((obj: ExistingObject) => (obj.typeName === 'Information') && obj.name).map((obj: ExistingObject) => obj.name).join('\n'));

      console.log('99 context', existingTerms);

      setExistingContext('**Objects** \n ' + existingObjects?.map((obj: ExistingObject) => `- ${obj.id} ${obj.name} ${obj.description}` + '\n') + '\n **Relationships** \n ' +
        existingRelationships?.map((rel: ExistingRelationship) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`));

      console.log('101 existingContext', existingContext);
      console.log('102 currentModel', currentModel?.name, data, metis, focus, user);
    }
  }, [data]);

  // const handlePasteFromClipboard = async () => {
  //   try {
  //     const text = await navigator.clipboard.readText();
  //     setExistingContext(text);
  //   } catch (error) {
  //     console.error('Failed to read clipboard contents: ', error);
  //   }
  // };

  const handleDispatchIrtvData = () => {
    if (!domain) {
      alert('No IRTV data to dispatch');
      return;
    }
    console.log('133 dispatching IRTV data:', domain);
    dispatch(setObjects(domain.objects));
    dispatch(setRelationships(domain.relationships));
    setDispatchDone(true);
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
        setOntologyString(`master-data:\n ${termNamesMaster}, work-product-component:\n ${termNamesWP}`);
        console.log(`81 master-data:\n ${termNamesMaster},\n\n ontologyString: ${ontologyString}`);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }
    } catch (error) {
      console.error('Failed to fetch ontology data: ', error);
    }
  };

  // ------------------------- First Step is the concept step with Terms ----------------------------------
  const handleFirstStep = async () => {
    setIsLoading(true);
    setDomain(undefined);
    setTerms("");

    if (!domainDescription || domainDescription === '') {
      alert(`Please provide a domain description.\nExamples:
        - E-Scooter Rental Services\n
        - Car sale administration\n
        - Energy generation\n
        - Data management\n
        - Financial services for Car rental in Scandinavia\n
  `);

      setIsLoading(false);
      return;
    }

    const prompt = `
      Identify and explain the key concepts and terms related to 
        ${domainDescription}
      Provide a brief definition for each term, highlighting their importance and interrelations within the domain.
      You must include the following Concepts/Terms:

      **User Suggested Terms:**
        ${suggestedConcepts}

      Make sure you create at least 8 additional terms.
    `;

    const contextPrompt = `
      ## **Context:**
          - Do not create any terms that already is in Existing Context.
          ${existingTerms}
    `;

    const ontologyPrompt = `
      ## **Ontology**
        If possible, use the following terms from the ontology:
        **List of Terms:**
        ${ontologyString}
    `;

    if (!prompt || prompt === '') {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }

    console.log('110 step', step, 'prompt', prompt, 'systemConceptPrompt', systemConceptPrompt, 'contextPrompt', contextPrompt, 'ontologyPrompt', ontologyPrompt);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          prompt: prompt || "",
          systemPrompt: systemConceptPrompt || "",
          contextPrompt: contextPrompt || "",
          ontologyPrompt: ontologyPrompt || "",
          metamodelPrompt: ""
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
      // console.log('201 parsed', parsed);
      if (parsed.objects && Array.isArray(parsed.objects)) {
        const selectedTermsString = parsed.objects.map((item: { name: string }) => `- ${item.name}`).join('\n');
        const selectedRelationsString = parsed.relationships.map((rel: { name: string, nameFrom: string, nameTo: string }) => `- ${rel.name} (from: ${rel.nameFrom}, to: ${rel.nameTo})`).join('\n');

        setTerms(`**Information types***\n\n ${selectedTermsString}\n\n **Relations:**\n\n${selectedRelationsString}\n\n`);
        setSelectedTerms({ objects: parsed.objects, relationships: parsed.relationships });
        console.log('254 terms', terms) //, 'selectedTermsString', selectedTermsString, 'selectedRelationsString', selectedRelationsString);
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

  // ------------------------- Second Step is converting from Terms to IRTV ---------------------------------
  const handleSecondStep = async () => {
    setIsLoading(true);
    setDomain(undefined);
    setStep(2);

    const prompt = `
  You are a highly knowledgeable assistant and expert in Active knowledge modeling and Information modelling.
  You are tasked with exploring and enriching the knowledge concepts and terms within the user-specified domain.
  Your first and primary objective is to ensure a comprehensive and cohesive knowledge structure based on the terms defined in the ontology according to the 'metamodel'.
 
## List of proposed Information types and relations:
    **Information**
    ${terms}

    **Roles**
    ${suggestedRoles}

    **Tasks**
    ${suggestedTasks}

    **Views**
    ${suggestedViews}
  Create Views to access the Information objects.
  Create Tasks to manipulate the Information objects via the Views.
  Create Roles to perform or manage the Tasks.
  Make sure all objects have relationships.
    `;

    const contextPrompt = `
## **Context:**
  ${existingContext}
    `;

    const ontologyPrompt = ``;

    // console.log('174 IRTV step :', step,   'prompt:', prompt, 'systemIrtvPrompt:', systemIrtvPrompt, 'contextPrompt:', contextPrompt, 'ontologyPrompt:', ontologyPrompt, 'metamodelPrompt:', metamodelPrompt);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          prompt: prompt || "",
          systemPrompt: systemIrtvPrompt || "",
          contextPrompt: contextPrompt || "",
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
    <div className="flex flex-col gap-4 mx-1 bg-gray-800">
      <header className="mx-auto">
        <h1 className="text-2xl font-bold text-white">AI-Powered AKM Dashboard</h1>
      </header>
      <div className="bg-gray-600 mx-2 px-2 text-white rounded">
        <h3 className="font-bold text-gray-400 inline-block"> Current Project: </h3>  <span className="inline-block"> {metis?.name}</span> |
        <h3 className="ms-2 font-bold text-gray-400 inline-block"> Current Model: </h3>  <span className="inline-block"> {currentModel?.name}</span>
      </div>

      <div className="flex items-center mx-2 bg-gray-700">
        {/* <Button onClick={handlePasteFromClipboard} className="bg-green-500 text-white px-4 py-2 rounded">
          Paste Clip-board Context
        </Button>
        <Button onClick={toggleContextVisibility} className="bg-blue-500 text-white px-4 py-2 rounded ms-2">
          {isContextVisible ? "Hide Existing Context" : "Show Existing Context"}
        </Button> */}
        <div className="flex-grow">URL: </div>
        <Input
          id="ontologyUrl"
          className="ontology-input flex-grow bg-gray-600 text-white mx-auto mx-2"
          value={ontologyUrl}
          onChange={(e) => setOntologyUrl(e.target.value)}
          placeholder="Paste ontology URL"
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
      {/* Steps from User input to generate IRTV objects and relationships */}
      <div className="flex m-2">
        <div className="border-solid rounded border-4 border-green-700 w-1/3">
          <Card>
            <div className="mx-2">
                <details>
                <summary>Build an Active Knowledge Model assisted by AI:</summary>
                  <div className="bg-gray-600">
                    <p>The process involves the following steps:</p>
                    <ul>
                      <li><strong>• Establish a Conceptual Apparatus for a Domain:</strong></li>
                      <p style={{ marginLeft: '20px' }}>It refers to the set of concepts, theories, models, and frameworks that collectively provide the foundational understanding of a particular field or discipline. It encompasses the terminology, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                      <li><strong>• Generate IRTV objects and relationships:</strong></li>
                      <p style={{ marginLeft: '20px' }}>Generate Information objects of the concepts and terms identified in the first step. Add Roles, Tasks, and Views working on the Information objects.</p>
                      <li><strong>• Dispatch the result to the current Model-project:</strong></li>
                      <p style={{ marginLeft: '20px' }}>The final step is to dispatch the generated IRTV objects and relationships to the current Model-project.</p>
                    </ul>
                  </div>
                </details>
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-center flex-grow border text-white ps-1">First: Establish a Conceptual Apparatus for a Domain:
                {/* <button
                  onClick={() => setShowUserInput(!showUserInput)}
                  className="rounded bg-gray-500 text-white hover:text-white p-2 ml-2"
                >
                  {showUserInput ? '-' : '+'}
                </button> */}
              </CardTitle>
            </CardHeader>
            {showUserInput && (
              <CardContent className="flex flex-wrap items-start">
                <label htmlFor="domainDescription" className="text-white">Domain Description</label>
                <Textarea
                  id="domainDescription"
                  className="flex-grow p-1 rounded bg-gray-800"
                  value={domainDescription}
                  disabled={isLoading}
                  onChange={(e) => setDomainDescription(e.target.value)}
                  placeholder="Enter domain description"
                  rows={5} // Adjust the number of rows as needed
                />
                <details className="flex-grow">
                  <summary className="text-white cursor-pointer">Specify more to be included: Terms, Roles, Tasks, Views</summary>
                  <div className="flex flex-col flex-grow mt-2">
                    <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts/Terms you want to include</label>
                    <Input
                      id="suggestedConcepts"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={suggestedConcepts}
                      disabled={isLoading}
                      onChange={(e) => setSuggestedConcepts(e.target.value)}
                      placeholder="Enter your concepts/terms"
                    />
                    <label htmlFor="roles" className="text-white mt-1">Roles you want to include</label>
                    <Input
                      id="roles"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={suggestedRoles}
                      disabled={isLoading}
                      onChange={(e) => setSuggestedRoles(e.target.value)}
                      placeholder="Enter roles"
                    />
                    <label htmlFor="tasks" className="text-white mt-2">Tasks you want to include</label>
                    <Input
                      id="tasks"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={suggestedTasks}
                      disabled={isLoading}
                      onChange={(e) => setSuggestedTasks(e.target.value)}
                      placeholder="Enter tasks"
                    />
                    <label htmlFor="views" className="text-white mt-2">Views you want to include</label>
                    <Input
                      id="views"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={suggestedViews}
                      disabled={isLoading}
                      onChange={(e) => setSuggestedViews(e.target.value)}
                      placeholder="Enter views"
                    />
                  </div>
                </details>
              </CardContent>
            )}
            <CardFooter>
              <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 ${(terms.length > 0) ? 'text-green-600' : 'text-green-200'}`}
              >
                Ask GPT to suggest appropriate Concepts & Terms
                {/* <CardTitle className="text-white flex justify-between items-center flex-grow text-green-500 ps-1">Ask GPT to suggest appropriate Concepts & Terms */}
                <div className="flex items-center ml-auto">
                  <Button onClick={() => {
                    handleFirstStep();
                    setActiveTab('terms');
                  }}
                    className={`rounded text-xl p-4 ${(terms.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle 
                className={`flex justify-between items-center flex-grow ps-1 ${(terms.length > 0) ? 'text-green-600' : 'text-green-200'}`}
              >
                Next: Generate IRTV objects and relationships
                <div className="flex items-center ml-auto">
                  <Button onClick={async () => {
                    await handleSecondStep();
                    setActiveTab('irtv');
                  }}
                    className={`rounded text-xl p-4 ${(domain?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {/* <CardContent>
              <h5 className="text-white mx-2"> Evaluate the Domain and find Concepts and Terms to be used in AKM:</h5>
            </CardContent> */}
          </Card>
          <Card>
            <CardHeader>
                <CardTitle 
                className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                >
                  Finaly: Dispatch the result to the current Model-project 
                <div className="flex items-center ml-auto">
                    <Button
                      onClick={handleDispatchIrtvData}
                      className={`rounded text-xl ${dispatchDone ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                      <FontAwesomeIcon icon={faSave} width="26px" size="1x" />
                    </Button>
                </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center h-full">

            </CardContent>
          </Card>
        </div>
        <div className="flex-grow border-solid rounded border-4 bg-yellow-200 border-yellow-200 w-10" style={{ height: 'calc(100vh - 10rem)' }}>
          <Card className="h-full">
            {isLoading ? (
              <div className="flex flex-col items-center h-full">
                <div className="text-yellow-500">-&gt;</div><br />
                <div className="flex flex-col justify-between items-center bg-green-500 h-full">
                  <LoadingDots orientation="vertical" />
                  <LoadingCircularProgress />
                  <Loading />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  <LoadingDots orientation="vertical" />
                  {/* <LoadingPulse /> */}
                  {/* <LoadingBars /> */}
                </div>
              </div>
            ) : (
                <div className="flex flex-col justify-between items-center h-1/2">
                <div className="text-yellow-700 justify-center">-&gt;</div>
                <div className="text-yellow-700 mt-3 transform rotate-90 whitespace-nowrap">{(selectedTerms?.objects.length > 0) ? 'Terms Generated!' : 'No Terms generated yet'}</div>
                <div className="text-yellow-700 justify-center">-</div>
                <div className="text-yellow-700 mt-3 transform rotate-90 whitespace-nowrap">{(domain?.objects.length > 0) ? 'Irtv Generated!' : 'No IRTV generated yet'}</div>
                </div>
            )}
          </Card>
        </div>

        <div className="border-solid rounded border-4 border-blue-700 w-3/4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="irtv">IRTV Objects</TabsTrigger>
              {/* <TabsTrigger value="objects" className={activeTab === 'objects' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Objects & Relationships</TabsTrigger>
              <TabsTrigger value="diagram" className={activeTab === 'diagram' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Preview Diagram</TabsTrigger></TabsList> */}
            </TabsList>
            <TabsContent value="terms">
              {/* <Card> */}
              {/* <CardHeader>
                  <CardTitle className="text-white flex justify-between items-center flex-grow border ps-1">
                    Proposed Concepts and Terms
                    <button
                      onClick={() => {
                        setShowTerms(!showTerms)
                        setActiveTab('terms');
                      }}
                      className="rounded bg-gray-500 text-white hover:text-white p-2 ml-2"
                    >
                      {showTerms ? '-' : '+'}
                    </button>
                  </CardTitle>
                </CardHeader> */}
              {showTerms && (
                // <CardContent>
                <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                  <OntologyCard terms={selectedTerms} />
                </div>
                // </CardContent>
              )}
              {/* </Card> */}
            </TabsContent>
            <TabsContent value="irtv">
              {/* <Card> */}
              {/* <CardHeader>
                  <CardTitle className="text-white flex justify-between items-center flex-grow border ps-1">
                    Generated IRTV Objects and Relationships
                    <button
                      onClick={() => {
                      setShowIrtv(!showIrtv);
                      }}
                      className="rounded bg-gray-500 text-white hover:text-white p-2 ml-2"
                    >
                      {showIrtv ? '-' : '+'}
                    </button>
                  </CardTitle>
                </CardHeader> */}
              {showIrtv && domain && (
                // <CardContent>
                <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                  <ObjectCard domain={domain} />
                </div>
                // </CardContent> 
              )}
              {/* </Card> */}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {domain && (
        <Button onClick={handleCopy} className="mx-2 bg-blue-500 text-white rounded">
          Copy JSON
        </Button>
      )}
    </div>
  );
};

export default SyncPage;