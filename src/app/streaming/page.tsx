// src/pages/sync.tsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { set } from "zod";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave, faCheckCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

import { getFeatureAData } from '@/features/featureA/featureASlice';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading, LoadingBars, LoadingPulse, LoadingCircularProgress, LoadingDots } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { setObjects, setRelationships, setModelview } from "@/features/featureA/featureASlice";

import { OntologyCard } from "@/components/ontology-card";
import { ObjectSchema } from "@/objectSchema";
import { ObjectCard } from "@/components/object-card";
import { ModelviewSchema } from "@/modelviewSchema";
import { ModelviewCard } from "@/components/modelview-card";
import { SystemConceptPrompt } from './prompts/system-concept-prompt';
import { SystemIrtvPrompt } from './prompts/system-irtv-prompt';
import { SystemIrtvModelviewPrompt } from './prompts/system-irtv-modelview-prompt';
import { MetamodelPrompt } from './prompts/metamodel-prompt-irtv'; // default metamodel prompt for IRTV
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { metamodel } from "@/metamodel/metamodel";
import { handleSaveToLocalFile } from '@/features/featureA/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/featureA/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/featureA/components/HandleGetLocalFileClick';
import { clearStore } from '@/features/featureA/featureASlice';

const SyncPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [ontologyUrl, setOntologyUrl] = useState("https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json");
  const [ontology, setOntology] = useState<{ name: string; description: string }[]>([]);
  const [ontologyString, setOntologyString] = useState("");
  const [terms, setTerms] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<{ objects: []; relationships: [] }>({ objects: [], relationships: [] });
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<any>(undefined);
  const [dispatchDone, setDispatchDone] = useState(true);

  const [metis, setMetis] = useState<any>(null);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [currentModelview, setCurrentModelview] = useState<any>(null);
  const [newModelview, setNewModelview] = useState<any>(null);

  const [userPrompt, setUserPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [metamodelPrompt, setMetamodelPrompt] = useState(MetamodelPrompt);
  const [systemConceptPrompt, setSystemConceptPrompt] = useState(SystemConceptPrompt);
  const [systemIrtvPrompt, setSystemIrtvPrompt] = useState(SystemIrtvPrompt);
  const [existingTerms, setExistingTerms] = useState<string>("");
  const [existingInfoObjects, setExistingInfoObjects] = useState<{ objects: ExistingObject[]; relationships: ExistingRelationship[] }>({ objects: [], relationships: [] });
  const [isExistingContext, setIsExistingContext] = useState(false);
  const [showUserInput, setShowUserInput] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [showTerms, setShowTerms] = useState(true);
  const [showIrtv, setShowIrtv] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // useEffect(() => {
  //   setStep(1);
  //   // const handleMessage = (event: MessageEvent) => {
  //   //   if (event.data.type === 'SESSION_STORAGE_DATA') {
  //   //     sessionStorage.setItem('memorystate', event.data.data);
  //   //   }
  //   // };
  //   // window.addEventListener('message', handleMessage);
  //   // return () => {
  //   //   window.removeEventListener('message', handleMessage);
  //   // };
  // }, [existingContext, terms]);

  useEffect(() => {
    // type ExistingObject = { id: string; name: string; description: string; typeName: string };
    // type ExistingRelationship = { id: string; name: string; nameFrom: string; nameTo: string };

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
        - **Relation Types:** \n ${mmRelationtypeStrings}`;
        // - **Object Typeviews:** \n ${metamodel?.objecttypeviews.map((otv: any) => `${otv.id} ${otv.name}`).join(', ')}
        // The objecttypeviews id is referenced in from the objectview as typeviewRef.
        // `;

        setMetamodelPrompt(metamodelPrompt);
      }
      setMetamodelPrompt(`${MetamodelPrompt}`);

      const models = metis1.models;
      const curmod = models?.find((model: any) => model.id === focus?.focusModel?.id) || models[0];
      // console.log('95 currentModel', curmod, currentModel, metis?.models);
      setCurrentModel(curmod);

      const filteredRelationships = curmod?.relships?.filter((rel: any) => {
        const fromObject = curmod?.objects?.find((obj: any) => obj.id === rel.fromobjectRef);
        const toObject = curmod?.objects?.find((obj: any) => obj.id === rel.toobjectRef);
        // console.log('127 fromObject', fromObject, 'toObject', toObject, 'rel', rel);
        return fromObject?.typeName === 'Information' && toObject?.typeName === 'Information' && rel;
      }) || [];

      console.log('130 filteredRelationships', filteredRelationships);

      const existingObjects = curmod?.objects?.map((obj: any) => ({ id: obj.id, name: obj.name, description: obj.description, typeName: obj.typeName }));
      const existingRelationships = filteredRelationships?.map((rel: any) => ({ id: rel.id, name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo }));

      setExistingInfoObjects({
        objects: existingObjects?.filter((obj: any) => obj && obj.typeName === 'Information') || [],
        relationships: existingRelationships
      });
      console.log('129 existingInfoObjects', existingInfoObjects, existingObjects, existingRelationships, filteredRelationships);
      setExistingTerms(existingInfoObjects?.objects?.map((obj: any) => obj.name).join('\n'));

      // console.log('99 context', existingTerms);

      setExistingContext('**Objects** \n ' + existingObjects?.map((obj: any) => `- ${obj.id} ${obj.name} ${obj.description}` + '\n') + '\n **Relationships** \n ' +
        existingRelationships?.map((rel: any) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`));

      // console.log('101 existingContext', existingContext);
      // console.log('102 currentModel', currentModel?.name, data, metis, focus, user);
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
    console.log('156 dispatching IRTV data:', domain, newModelview);
    dispatch(setObjects(domain.objects));
    dispatch(setRelationships(domain.relationships));
    dispatch(setModelview(newModelview));
    setDispatchDone(true);
  };

  const handleFetchOntology = async () => {
    try {
      const response = await fetch(`/proxy?url=${encodeURIComponent(ontologyUrl)}`);
      // const response = await fetch(`/proxy?url=${encodeURIComponent('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('180 Fetched ontology data:', data);
      if (Array.isArray(data)) {
        const filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        setOntology(filteredOntology);
      } else if (typeof data === 'object' && data !== null) {
        const dataArr = Object.values(data);
        console.log('186 dataArr', dataArr);
        const filteredArr = dataArr.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        interface OntologyItem {
          entity_name: string;
          group: string;
        }

        const dataOntology = Array.from(new Map(filteredArr.map((item) => {
          const ontologyItem = item as OntologyItem;
          return [ontologyItem.entity_name, { name: ontologyItem.entity_name, description: ontologyItem.group }];
        })).values());

        console.log('189 dataOntology', dataOntology);
        const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
        const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
        const termNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name + ' ')));
        const termNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
        setOntologyString(`master-data:\n ${termNamesMaster}, work-product-component:\n ${termNamesWP}`);
        setOntology(dataOntology);
        console.log('81 Fetched ontology data:', data, dataArr, dataOntology);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }
    } catch (error) {
      console.error('Failed to fetch ontology data: ', error);
    }
  };

  // ------------------------- First Step is the concept step with Terms ---------------------------------------------------------------------------------------
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
    console.log('246 domainDescription', domainDescription, 'suggestedConcepts', suggestedConcepts, 'existingTerms', existingTerms, 'ontologyString', ontologyString);
    const prompt =  (domainDescription && domainDescription !== '') 
      ? (domainDescription.split(' ').length === 1) 
        ? `
        Identify and explain the key concepts and terms related to the domain supplied in the user input:

        ## User Input : **${domainDescription} Domain**
        Elaborate around the term ${domainDescription} and add related terms.

        For each term:

          •	Provide a brief, clear definition highlighting its significance.
          •	Explain how it interrelates with other terms within the domain.
        `
        : `
          Identify and explain the key concepts and terms related to the domain supplied in the user input: 
          ## User Input : ${domainDescription}

          You can then infer the domain from the term(s) and provide a brief description of the domain.
          Do not use the generic term like "Entity" "Attribute" etc. as your suggested terms.

          For each term:

            •	Provide a brief, clear definition highlighting its significance.
            •	Explain how it interrelates with other terms within the domain.
          ` 
      : "";

    console.log('274 prompt', prompt);
          
    let contextPrompt = (suggestedConcepts && suggestedConcepts !== '') 
      ? `
            You must include the following terms in the Conceptual Apparatus:
            **User Suggested Terms:**
              ${suggestedConcepts}

            Make sure you create at least 20 additional terms.
        `
      : "";


    contextPrompt += (existingTerms && existingTerms !== '') ? `
      You must include the following existing terms in the Conceptual Apparatus:
      ## **Context:**
          - Do not create any terms that already is in Existing Context.
          ${existingTerms}
    `
    : "";

    const ontologyPrompt = (ontologyString && ontologyString !== '') ? `
      ## **Ontology**
        If possible, use the following terms from the ontology:
        **List of Terms:**
        ${ontologyString}
    `: "";

    if (!prompt || prompt === '') {
      alert("Please provide a prompt or paste existing context.");
      setIsLoading(false);
      return;
    }

    setSystemPrompt(systemConceptPrompt)
    setUserPrompt(prompt+contextPrompt+ontologyPrompt);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          prompt: userPrompt || "",
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
      console.log('323 parsed', parsed);
      if (parsed.objects && Array.isArray(parsed.objects)) {
        const selectedTermsString = parsed.objects.map((item: { name: string }) => `- ${item.name}`).join('\n');
        const selectedRelationsString = parsed.relationships.map((rel: { name: string, nameFrom: string, nameTo: string }) => `- ${rel.name} (from: ${rel.nameFrom}, to: ${rel.nameTo})`).join('\n');
        setTerms(`**Information types***\n\n ${selectedTermsString}\n\n **Relations:**\n\n${selectedRelationsString}\n\n`);
        setSelectedTerms({ objects: parsed.objects, relationships: parsed.relationships });
        console.log('339 terms', terms, 'selectedTermsString', selectedTermsString, 'selectedRelationsString', selectedRelationsString);
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
      Your first and primary objective is to ensure a comprehensive and cohesive knowledge structure based on the terms in the context and generated according to the metamodel.
    `;

    let contextPrompt = (terms && terms !== '') ? `
    Create Information objects and Relationships based on the following terms:
    ## List of terms:
        **Terms**
        ${terms}
      ` : '';

    contextPrompt += (suggestedRoles && suggestedRoles !== '') && `
    Create Roles including the following suggested roles:
    **Roles**
    ${suggestedRoles}
    if no suggested roles, create necessary roles that performs or have responsibilities for the tasks.
    `;
    contextPrompt += (suggestedTasks && suggestedTasks !== '') && `
      Create Tasks including the following suggested tasks:
      **Tasks**
      ${suggestedTasks}
    `;

    contextPrompt += (suggestedViews && suggestedViews !== '') && `
    Create Views including the following suggested views:
      **Views**
      ${suggestedViews}
      Create Views to access the Information objects.
      Create Tasks to manipulate the Information objects via the Views.
      Create Roles to perform or manage the Tasks.
      Make sure all objects have relationships.
    `;

    contextPrompt += `
    Do not create any terms that already is in Existing Context, but you may create relationship to/from existing context.
    ## **Context:**
      ${existingContext}
    `;

    const ontologyPrompt = ``;

    // console.log('174 IRTV step :', step,   'prompt:', prompt, 'systemIrtvPrompt:', systemIrtvPrompt, 'contextPrompt:', contextPrompt, 'ontologyPrompt:', ontologyPrompt, 'metamodelPrompt:', metamodelPrompt);

    setSystemPrompt(systemIrtvPrompt)
    setUserPrompt(prompt + contextPrompt + metamodelPrompt);


    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          prompt: userPrompt || "",
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
    setStep(3);
  };

  // ------------------------- Third Step is to generate a modelview with objectviews and relshipviews ---------------------------------

  const handleThirdStep = async () => {
    setIsLoading(true);

    const prompt = `
  You are a highly knowledgeable assistant and expert in Active knowledge modeling and Information modelling.
  You are tasked with presenting the objects and relationships generated from previous step in a modelview.

  The modelview will include objectviews and relshipviews for each object and relationship.
  Give the objectviews and relshipviews id as uuids.
  The typeviewRef is found in the metamodel for each objectview and relshipview. 

  You will also add location of each object in the modelview as "loc" attribute with x and y coordinates as string with format "x y".
  Make room between the objects to show the relationships clearly.
  Align the objects horizontally and vertically to make the modelview look good.

  Position all Roles to the in a column to the left.
  Next on the right put the Tasks.
  Next to the right of the Tasks put the Views.
  Finally, to the right of the Views put the Information objects.

  Make sure to also give horizontal and vertical space between the objects to make the modelview look good.
  `;

    const metamodelPrompt = `

  `;

    const contextPrompt = `
    ## Context:
      **Objects and Relationships:**
      ${domain?.objects.map((obj: any) => `- ${obj.id} ${obj.name} ${obj.description}`).join('\n')} 
      ${domain?.relationships.map((rel: any) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`).join('\n')}
    `;

    const ontologyPrompt = ``;


    // console.log('378 domain', domain, 'prompt', prompt, 'systemIrtvPrompt', systemIrtvPrompt, 'contextPrompt', contextPrompt, 'ontologyPrompt', ontologyPrompt, 'metamodelPrompt', metamodelPrompt);
    setSystemPrompt(SystemIrtvModelviewPrompt)
    setUserPrompt(prompt + contextPrompt + ontologyPrompt + metamodelPrompt);
    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          systemPrompt: SystemIrtvModelviewPrompt || "",
          prompt: userPrompt || "",
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

      // console.log('409 Raw data:', data);

      const parsed = JSON.parse(data);
      // console.log('412 modelviews', parsed, domain);
      const validatedData = ModelviewSchema.parse(parsed);
      // const modelview = {modelviews: [validatedData]};
      // console.log('415 modelview', modelview, domain);

      setNewModelview([validatedData]);
      // console.log('420 domain', domain);
      setStep(4);
    } catch (e) {
      console.error("Validation failed:", e instanceof Error ? e.message : e);
    }

    setIsLoading(false);
  }

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
    <div className="AKM-canvas flex flex-col gap-4 mx-1 bg-gray-800 min-h-screen max-h-screen"> 
      <header className="ms-5 me-auto w-full">
        <div className="flex justify-between items-center font-bold text-white className= text-green-500 mx-5">
          <div className="me-5">Model: {metis?.name}</div>
          <div className="me-5">AKM Concept modeling with IRTV</div>
          <div className="flex items-center mx-5">
            <div className="mx-4">AI-Powered AKM Dashboard</div>
            <FontAwesomeIcon icon={faRobot} className="text-green-500" />
          </div>
        </div>
      </header>
      <div className="flex justify-between bg-gray-600 mx-2 px-2 text-white rounded">
        <div>
          <h3 className="font-bold text-gray-400 inline-block"> Current Project: </h3>  <span className="inline-block"> {metis?.name}</span>
          <h3 className="ms-2 font-bold text-gray-400 inline-block"> Current Model: </h3>  <span className="inline-block"> {currentModel?.name}</span>
          <h3 className="ms-2 font-bold text-gray-400 inline-block"> No. of Objects: </h3>  <span className="inline-block"> {currentModel?.objects.length}</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleGetLocalFile(e, dispatch)}
        />
        <div className="flex">
          <Button
            className="bg-blue-500 text-white rounded m-1 py-0 text-sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            Load Local File
          </Button>
          <Button
            className="bg-red-500 text-white rounded m-1 p-1 text-sm"
            onClick={() => {
              dispatch(clearStore());
            }}
          >
            Clear Store
          </Button>
          <Button
            className="bg-blue-500 text-white rounded m-1 p-1 text-sm"
            onClick={() => {
              handleSaveToLocalFile(data);
            }}
          >
            Save to Local file
          </Button>
        </div>
      </div>
      {/* {isContextVisible && (
        <div className="mx-2 bg-gray-700 p-4 rounded">
          <h3 className="text-white font-bold">Existing Context:</h3>
          <pre className="text-white whitespace-pre-wrap">{existingContext}</pre>
        </div>
      )} */}
{/* 
      {isOntologyVisible && (
        <div className="mx-2 bg-gray-700 p-4 rounded">
          <h3 className="text-white font-bold">Ontology:</h3>
          {ontology.map((item, index) => (
            <pre key={index} className="text-white whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>
          ))}
        </div>
      )} */}
      {/* Steps from User input to generate IRTV objects and relationships */}
      <div className="flex m-2">
        <div className="border-solid rounded border-4 border-green-700 w-1/4">
          <Card>  {/* First Step: Establish a Conceptual Apparatus for a Domain */}
            <div className="mx-2">
              <details>
                <summary>Build an AKM Concept Model assisted by AI:</summary>
                <div className="bg-gray-600">
                  <p>This involves the following steps:</p>
                  <ul>
                    <li><strong>• Establish the Terminology (Conceptual Apparatus) for the Domain:</strong></li>
                    <p style={{ marginLeft: '20px' }}>It refers to the set of concepts, theories, models, and frameworks that collectively provide the foundational understanding of a particular field or discipline.
                      It encompasses the terminology, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                    <li><strong>• Generate IRTV objects and relationships:</strong></li>
                    <p style={{ marginLeft: '20px' }}>Generate Information objects of the concepts and terms identified in the first step (The What). Add Roles (Who), Tasks (How), and Views (What to see) working on the Information objects.</p>
                    <li><strong>• Dispatch the result to the current Model-project store:</strong></li>
                    <p style={{ marginLeft: '20px' }}>The final step is to dispatch the generated IRTV objects and relationships to the current Model-project.</p>
                  </ul>
                </div>
              </details>
            </div>
            <CardHeader>
              <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 ${domainDescription !== '' ? 'text-green-600' : 'text-green-200'}`}
              >
                First: Establish a Conceptual Apparatus for a Domain:
                {/* <button
                  onClick={() => setShowUserInput(!showUserInput)}
                  className="rounded bg-gray-500 text-white hover:text-white p-2 ml-2"
                >
                  {showUserInput ? '-' : '+'}
                </button> */}
              </CardTitle>
              <div className="flex-grow p-1">
                <details>
                  <summary className="cursor-pointer">Add Ontology terms</summary>
                  <div className="flex-grow bg-gray-700 text-gray-500">
                    <Textarea
                      id="ontologyUrl"
                      className="ontology-input flex-grow bg-gray-600 text-white"
                      value={ontologyUrl}
                      onChange={(e) => setOntologyUrl(e.target.value)}
                      placeholder="Paste ontology URL here"
                    />
                    <div className="flex justify-between">
                      <Button
                        onClick={() => {
                          handleFetchOntology();
                          setActiveTab('ontology-terms');
                        }}
                        className="bg-green-800 text-white rounded m-1"
                      >
                        Load Ontology
                      </Button>
                    </div>
                  </div>
                </details>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-start">
              <label htmlFor="domainDescription" className="text-white">Topic & Domain Description</label>
              <Textarea
                id="domainDescription"
                className="flex-grow p-1 rounded bg-gray-800"
                value={domainDescription}
                disabled={isLoading}
                onChange={(e) => setDomainDescription(e.target.value)}
                placeholder="Enter domain description"
                rows={4} // Adjust the number of rows as needed
              />
              <details className="flex-grow">
                <summary className="text-white cursor-pointer">Specify Terms you want to be included</summary>
                <div className="flex flex-col flex-grow mt-2">
                  <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts/Terms you want to include separated by comma</label>
                  <Input
                    id="suggestedConcepts"
                    className="flex-grow p-1 rounded bg-gray-800"
                    value={suggestedConcepts}
                    disabled={isLoading}
                    onChange={(e) => setSuggestedConcepts(e.target.value)}
                    placeholder="Enter your concepts/terms"
                  />
                </div>
              </details>
            </CardContent>
            <CardFooter>
              <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 ${(terms.length > 0) ? 'text-green-600' : 'text-green-200'}`}
              >
                Ask GPT to suggest appropriate Concepts & Terms
                <div className="flex items-center ml-auto">
                  {(isLoading && step === 1) ? (
                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                      <LoadingCircularProgress />
                    </div>
                  ) : (
                    <div style={{ marginLeft: 8, marginRight: 8, color: terms.length > 0 ? 'green' : 'gray' }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                  )}
                  <Button onClick={() => {
                    setStep(1);
                    handleFirstStep();
                    setActiveTab('terms');
                  }}
                    className={`rounded text-xl p-4 ${(terms.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                  >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardFooter>
          </Card>     
     
          <Card>  {/* Second Step: Generate IRTV objects and relationshipsGenerate IRTV objects and relationships */}
            <details className="flex-grow mx-5">
              <summary className="text-white cursor-pointer">Specify Roles, Tasks, Views you want to include</summary>
              <label htmlFor="roles" className="text-white mt-1">Roles</label>
              <Input
                id="roles"
                className="flex-grow p-1 rounded bg-gray-800"
                value={suggestedRoles}
                disabled={isLoading}
                onChange={(e) => setSuggestedRoles(e.target.value)}
                placeholder="Enter roles"
              />
              <label htmlFor="tasks" className="text-white mt-2">Tasks</label>
              <Input
                id="tasks"
                className="flex-grow p-1 rounded bg-gray-800"
                value={suggestedTasks}
                disabled={isLoading}
                onChange={(e) => setSuggestedTasks(e.target.value)}
                placeholder="Enter tasks"
              />
              <label htmlFor="views" className="text-white mt-2">Views</label>
              <Input
                id="views"
                className="flex-grow p-1 rounded bg-gray-800"
                value={suggestedViews}
                disabled={isLoading}
                onChange={(e) => setSuggestedViews(e.target.value)}
                placeholder="Enter views"
              />
            </details>
            <CardHeader>
              <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 ${(domain?.objects.length > 0) ? 'text-green-600' : 'text-green-200'}`}
              >
                Generate IRTV objects and relationships
                <div className="flex items-center ml-auto">
                  {(isLoading && step === 2) ? (
                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                      <LoadingCircularProgress />
                    </div>
                  ) : (
                    <div style={{ marginLeft: 8, marginRight: 8, color: domain?.objects?.length > 0 ? 'green' : 'gray' }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                  )}
                  <Button onClick={async () => {
                    await handleSecondStep();
                    setActiveTab('irtv');
                  }}
                    className={`rounded text-xl p-4 ${(domain?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                  >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>  { /* Third Step: Generate a Modelview with Objectviews and Relshipviews */} 
            <CardHeader>
              <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 ${(newModelview?.length > 0) ? 'text-green-600' : 'text-green-200'}`}
              >
                Generate a Modelview with Objectviews and Relshipviews
                <div className="flex items-center ml-auto">
                  {(isLoading && step === 3) ? (
                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                      <LoadingCircularProgress />
                    </div>
                  ) : (
                    <div style={{ marginLeft: 8, marginRight: 8, color: newModelview?.length > 0 ? 'green' : 'gray' }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                  )}
                  <Button onClick={async () => {
                    await handleThirdStep();
                    setActiveTab('irtv-objectviews');
                  }}
                    className={`rounded text-xl p-4 ${(newModelview?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                  >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {/* <CardContent>
              <h5 className="text-white mx-2"> Evaluate the Domain and find Concepts and Terms to be used in AKM:</h5>
            </CardContent> */}
          </Card>

          <Card>  { /* Third Step: Generate a Modelview with Objectviews and Relshipviews */}
            <CardHeader>
              <CardTitle
                className={`flex justify-between items-center flex-grow ${!dispatchDone ? 'text-green-600' : 'text-green-200'}`}
              >
                Dispatch the result to the current Model-project Store
                <div className="flex items-center ml-auto">
                  {!dispatchDone && step === 4 ? (
                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                      <LoadingCircularProgress />
                    </div>
                  ) : (
                    <div style={{ marginLeft: 8, marginRight: 8, color: !dispatchDone ? 'green' : 'gray' }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                  )}
                  <Button
                    onClick={handleDispatchIrtvData}
                    className={`rounded text-xl ${dispatchDone && step === 4 || step === 5 ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                    <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {/* <CardContent className="flex flex-col items-center h-full">
            </CardContent> */}
          </Card>

          <Card>  { /* Third Step: Save the Model-store to a project file */}
            <CardHeader>
              <CardTitle
                className={`flex justify-between items-center flex-grow ${step === 5 && dispatchDone ? 'text-green-600' : 'text-green-200'}`}
              >
                Save the Model-store to a project file
                <div className="flex items-center ml-auto">
                  {(step === 5 && dispatchDone) ? (
                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                      <LoadingCircularProgress />
                    </div>
                  ) : (
                    <div style={{ marginLeft: 8, marginRight: 8, color: (step === 5 && dispatchDone) ? 'green' : 'gray' }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                  )}
                  <Button
                    onClick={() => { setStep(0); handleSaveToLocalFile(data); }}
                    className={`rounded text-xl ${step === 5 && dispatchDone ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                    <FontAwesomeIcon icon={faSave} width="26px" size="1x" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {/* <CardContent className="flex flex-col items-center h-full">
            </CardContent> */}
          </Card>
        </div>
        {/* Model Canvas -----------------------------------------------------------------------------------------------------------------------------------------*/}
        <div className="border-solid rounded border-4 border-blue-800 w-3/4 max-h-[calc(100vh-1rem)] overflow-hidden">
          <Card> {/* Model Canvas */}
            <CardTitle className="flex justify-center text-white m-1">IRTV Modeling Canvas</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="model-store">Current Model Store</TabsTrigger>
              <TabsTrigger value="ontology-terms">Ontology terms</TabsTrigger>
              <TabsTrigger value="terms">GPT Suggested Terms</TabsTrigger>
              <TabsTrigger value="irtv">IRTV Objects</TabsTrigger>
              <TabsTrigger value="irtv-objectviews">Modelview (Objectviews)</TabsTrigger>
              {/* <TabsTrigger value="objects" className={activeTab === 'objects' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Objects & Relationships</TabsTrigger>
              <TabsTrigger value="diagram" className={activeTab === 'diagram' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Preview Diagram</TabsTrigger> */}
            </TabsList>
            <TabsContent value="model-store">
                <div className="flex justify-left my-0 items-center">
                  {(data?.project) &&
                    <div className="text-gray-400 mx-5">Current :</div>
                  }
                  <div className="text-gray-400">{data?.project?.phData?.metis?.name} | {data?.project?.phData?.metis?.models[0].name}</div>
                </div>
            <Tabs>
              <TabsList>
                <TabsTrigger value="model-terms">Terms</TabsTrigger>
                <TabsTrigger value="model-objects">Objects & Relationships</TabsTrigger>
                <TabsTrigger value="model-modelviews">Modelviews</TabsTrigger>
              </TabsList>
              <TabsContent value="model-terms">
                  <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <OntologyCard terms={existingInfoObjects} />
                  </div>
              </TabsContent>
              <TabsContent value="model-objects">
                <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                  </div>
                  {data && data.project && data.project.phData && data.project.phData.metis && data.project.phData.metis.models && (
                    <ObjectCard domain={{ name: data.project.phData.metis.models[0].name, objects: data.project.phData.metis.models[0].objects, relationships: data.project.phData.metis.models[0].relships }} />
                  )}
              </TabsContent>
              <TabsContent value="model-modelviews">
                <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                  {/* <OntologyCard terms={{ objects: [], relationships: existingInfoObjects.relationships }} /> */}
                </div>
              </TabsContent>
            </Tabs>
            </TabsContent>
            <TabsContent value="ontology-terms">    
                {(ontology.length > 0) && 
                  <div className="flex justify-center items-center">
                      <div className="text-gray-400 mx-5">The Ontology Terms is fetched from URL:</div>
                      <div className="text-gray-400">
                      <a href={ontologyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        {ontologyUrl}
                      </a>
                    </div>
                  </div>
                }
              <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                <OntologyCard terms={{ objects: ontology?.map(item => ({ ...item, description: item.description || "" })), relationships: [] }} />
              </div>
            </TabsContent>
            <TabsContent value="terms">
              {showTerms && (
                <>  
                  <Button onClick={handleOpenModal} className="bg-blue-500 text-white rounded m-1 p-1 text-sm">
                    Show Modal
                  </Button>
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                      <DialogHeader>
                      <DialogDescription>
                        <div>
                            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                              <DialogTitle>System Prompt</DialogTitle>
                              <ReactMarkdown>{systemPrompt}</ReactMarkdown>
                              <DialogTitle>User Prompt</DialogTitle>
                              <ReactMarkdown>{userPrompt}</ReactMarkdown>
                            </div>
                        </div>
                      </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                      <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                        Close
                      </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <OntologyCard terms={selectedTerms} />
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="irtv">
              {showIrtv && (
                <>
                  <Button onClick={handleOpenModal} className="bg-blue-500 text-white rounded m-1 p-1 text-sm">
                    Show Modal
                  </Button>
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                      <DialogHeader>
                        <DialogDescription>
                          <div>
                              <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                              <DialogTitle>System Prompt</DialogTitle>
                              <ReactMarkdown>{systemPrompt}</ReactMarkdown>
                              <DialogTitle>User Prompt</DialogTitle>
                              <ReactMarkdown>{userPrompt}</ReactMarkdown>
                            </div>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <ObjectCard domain={domain} />
                  </div>
                </> 
              )}
            </TabsContent>
            <TabsContent value="irtv-objectviews">
              <>
                <Button onClick={handleOpenModal} className="bg-blue-500 text-white rounded m-1 p-1 text-sm">
                  Show Modal
                </Button>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                    <DialogHeader>
                      <DialogDescription>
                        <div>
                            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                            <DialogTitle>System Prompt</DialogTitle>
                            <ReactMarkdown>{systemPrompt}</ReactMarkdown>
                            <DialogTitle>User Prompt</DialogTitle>
                            <ReactMarkdown>{userPrompt}</ReactMarkdown>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>
                <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                  <ModelviewCard modelviews={newModelview} />
                </div>
              </>
            </TabsContent>
          </Tabs>
          </Card>
        </div>
      </div>

      {/* {domain && (
        <Button onClick={handleCopy} className="mx-2 bg-blue-500 text-white rounded">
          Copy JSON
        </Button>
      )} */}
    </div>
  );
};

export default SyncPage;