// src/pages/sync.tsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { set } from "zod";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave, faCheckCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading, LoadingBars, LoadingPulse, LoadingCircularProgress, LoadingDots } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { setOntologyData, clearStore } from "@/features/ontology/ontologySlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OntologyCard } from "@/components/ontology-card";
import { ImportedOntologyCard } from "@/components/imported-ontology-card";
import { ObjectSchema } from "@/objectSchema";
import { ObjectCard } from "@/components/object-card";
import { ModelviewSchema } from "@/modelviewSchema";
import { ModelviewCard } from "@/components/modelview-card";
import { SystemConceptPrompt } from './prompts/concept-system-prompt';
import { SystemIrtvPrompt } from './prompts/system-irtv-prompt';
import { MetamodelPrompt } from './prompts/metamodel-irtv-prompt'; // default metamodel prompt for IRTV
import ConceptBuilder from '@/components/aiBuilders/ConceptBuilder';

const debug = false;

const SyncPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const data = useSelector((state: RootState) => state.ontology.data);
  const status = useSelector((state: RootState) => state.ontology.status);
  const error = useSelector((state: RootState) => state.ontology.error);
  console.log('42 data', data, 'status', status, 'error', error);

  const [topicDescr, setTopicDescr] = useState("");
  const [domainDesc, setDomainDesc] = useState("");
  const [domain, setDomain] = useState({ concepts: [], relationships: [] });
  const [model, setModel] = useState<any>(null);
  const [suggestedConcepts, setSuggestedConcepts] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState("");
  const [suggestedViews, setSuggestedViews] = useState("");
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json");
  const [impOntology, setImpOntology] = useState([]);
  const [ontologyData, setOntologyData] = useState<any>(null);
  const [ontologyString, setOntologyString] = useState("");
  const [concepts, setConcepts] = useState("");
  const [selectedConcepts, setSelectedConcepts] = useState({ concepts: [], relationships: [] });
  const [isContextVisible, setIsContextVisible] = useState(false);
  const [isOntologyVisible, setIsOntologyVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dispatchDone, setDispatchDone] = useState(false);

  const [metis, setMetis] = useState<any>(null);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [newModelview, setNewModelview] = useState<any | null>(null);

  // const [systemPrompt, setSystemPrompt] = useState("");
  // const [userPrompt, setUserPrompt] = useState("");

  const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");

  const [conceptSystemPrompt, setConceptSystemPrompt] = useState(SystemConceptPrompt);
  const [conceptUserPrompt, setConceptUserPrompt] = useState("");
  const [conceptUserInput, setConceptUserInput] = useState("");
  const [conceptContextItems, setConceptContextItems] = useState("");
  const [conceptContextOntology, setConceptContextOntology] = useState("");
  const [conceptContextMetamodel, setConceptContextMetamodel] = useState("");
  const [suggestedConceptData, setSuggestedConceptData] = useState<any | null>(null);

  const [modelIrtvSystemPrompt, setModelIrtvSystemPrompt] = useState(SystemIrtvPrompt);
  const [modelUserPrompt, setModelUserPrompt] = useState("");
  const [modelUserInput, setModelUserInput] = useState("");
  const [modelContextItems, setModelContextItems] = useState("");
  const [modelContextOntology, setModelContextOntology] = useState("");
  const [modelContextMetamodel, setModelContextMetamodel] = useState(MetamodelPrompt);

  const [modelviewSystemPrompt, setModelviewSystemPrompt] = useState("");
  const [modelviewUserPrompt, setModelviewUserPrompt] = useState("");
  const [modelviewUserInput, setModelviewUserInput] = useState("");
  const [modelviewContextItems, setModelviewContextItems] = useState("");
  const [modelviewContextOntology, setModelviewContextOntology] = useState("");
  const [modelviewContextMetamodel, setModelviewContextMetamodel] = useState("");

  const [userModelviewPrompt, setUserModelviewPrompt] = useState("");

  const [existingConcepts, setExistingConcepts] = useState("");

  const [existingInfoObjects, setExistingInfoObjects] = useState<{ objects: [], relationships: [] }>({ objects: [], relationships: [] });
  const [isExistingContext, setIsExistingContext] = useState(false);
  const [showUserInput, setShowUserInput] = useState(true);
  const [activeTab, setActiveTab] = useState('current-knowledge');
  const [activeSubTab, setActiveSubTab] = useState('model-summary');
  const [showConcepts, setshowConcepts] = useState(true);
  const [showModel, setshowModel] = useState(true);

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
  // }, [existingContext, concepts]);

  // useEffect(() => {
  //   // type ExistingObject = { id: string; name: string; description: string; typeName: string };
  //   // type ExistingRelationship = { id: string; name: string; nameFrom: string; nameTo: string };

  //   if (data?.project) {

  //     let conceptString = '';
  //     if (existInfoConcepts.concepts.length > 0) {
  //       conceptString += `**Objects**\n\n${existInfoConcepts.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
  //       conceptString += `**Relationships**\n\n${existInfoConcepts.relationships.map((r: any) => `- ${r.name} - ${r.description} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
  //     }
  //     setExistingConcepts(conceptString);      // if (!debug) console.log('101 existingContext', existingContext);
  //     // if (!debug) console.log('102 currentModel', currentModel?.name, data, metis, focus, user);
  //   }
  // }, [data]);

  const handleFetchOntology = async () => {
    try {
      const response = await fetch(`/proxy?url=${encodeURIComponent(ontologyUrl)}`);
      // const response = await fetch(`/proxy?url=${encodeURIComponent('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
      }
      const data = await response.json();
      if (!debug) console.log('180 Fetched ontology data:', data);
      if (Array.isArray(data)) {
        const filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        setImpOntology(filteredOntology);
      } else if (typeof data === 'object' && data !== null) {
        const dataArr = Object.values(data);
        if (!debug) console.log('186 dataArr', dataArr);
        const filteredArr = dataArr.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        interface OntologyItem {
          entity_name: string;
          group: string;
        }

        const dataOntology = Array.from(new Map(filteredArr.map((item) => {
          const ontologyItem = item as OntologyItem;
          return [ontologyItem.entity_name, { name: ontologyItem.entity_name, description: ontologyItem.group }];
        })).values());

        if (!debug) console.log('189 dataOntology', dataOntology);
        const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
        const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
        const conceptsNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name + ' ')));
        const conceptsNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
        setOntologyString(`master-data:\n ${conceptsNamesMaster}, work-product-component:\n ${conceptsNamesWP}`);
        const ontologyData = { name: "OSDU-EntityTypes", concepts: dataOntology, relationships: [] };
        setOntologyData(ontologyData);
        if (!debug) console.log('81 Fetched ontology data:', data, dataArr, dataOntology, ontologyData);
      } else {
        console.error('Fetched data is neither an array nor an object:', data);
      }
    } catch (error) {
      console.error('Failed to fetch ontology data: ', error);
    }
  };

  // test step Concept builder

  // ------------------------- First Step is the concept step with concepts ---------------------------------------------------------------------------------------
  const handleFirstStep = async () => {
    setIsLoading(true);
    setDomainDesc("");
    setConcepts("");
    setActiveTab('suggested-concepts');

    if (!topicDescr || topicDescr === '') {
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

    if (!debug) console.log('263 1st.step \n topicDescr', topicDescr, '\n suggestedConcepts ', suggestedConcepts, '\n existingConcepts', existingConcepts, '\nontologyString', ontologyString);

    const userPrompt = (topicDescr) ? `
Identify and explain the key concepts and concepts related to the domain supplied in the user input:

## User Input : **${topicDescr}**
Elaborate around this input and provide a detailed explanation of the domain.

  `
      : "";

    const userInput = (suggestedConcepts && suggestedConcepts !== '')
      ? `
Include the following concepts in the Conceptual Apparatus:
**User Suggested Concepts:**
  ${suggestedConcepts}
`
      : "";

    const contextItems = (existingConcepts && existingConcepts !== '') ? `
You must include the following existing concepts in the Conceptual Apparatus:
## **Context:**
  - Do not create any concepts that already is in Existing Context.
  ${existingConcepts}
`
      : "";
    // console.log('335 contextItems', contextItems, 'existingConcepts', existingConcepts);

    const contextOntology = (ontologyString && ontologyString !== '') ? `
## **Ontology**
  Use the names of following concepts from the ontology where ever possible:
  **List of concepts:**
  ${ontologyString}

  Make sure to use these concepts in the Conceptual Apparatus.

    `: "";

    const contextMetamodel = `
## **Presentation**
Create a comprehensive presentation of **[${topicDescr}]** that includes the following components:

**Title:** ${topicDescr}

### **Instructions**

Please develop a detailed and engaging presentation on **[${topicDescr}]** that includes the following components:

1. **Introduction**
    - Provide a brief overview of the domain.
    - Explain its significance in the current context.

2. **Historical Background**
    - Outline the evolution of this domain.
    - Mention key milestones and breakthroughs.

3. **Core Concepts and Theories**
    - Explain fundamental principles.
    - Include important models or frameworks.

4. **Current Trends and Developments**
    - Discuss recent advancements.
    - Highlight emerging technologies or methodologies.

5. **Applications**
    - Describe real-world applications.
    - Include case studies or success stories.

6. **Challenges and Limitations**
    - Identify common obstacles.
    - Discuss any ethical, social, or technical issues.

7. **Future Outlook**
    - Predict future trends.
    - Explore potential opportunities and risks.

8. **Conclusion**
    - Summarize key points.
    - Emphasize the importance of the domain moving forward.

9. **References**
    - Cite all sources of information.
    - Include additional resources for further reading.

### **Additional Guidelines**

- Use clear and concise language suitable for your target audience.
- Incorporate visuals such as images, graphs, and charts to enhance understanding.
- Ensure each slide focuses on a single idea for clarity.
- Include speaker notes to elaborate on key points if necessary.
- Proofread and edit your presentation for accuracy and coherence.
- Ensure all sources are properly cited and referenced.
- Submit your presentation in a format that is easily accessible and shareable and put it in the presentation field within the ontologyData in structured output.
- Output of the presentation should be in markdown format with nice layout.

### Example Presentation:
{
  "ontologyData": {
      "name": "Bike rental",
      "description": "Brief description of the domain.",
      "presentation": " ..........",
      "concepts": [{ "name": "Bike", "description": "Description of the concept." }],
      "relationships": [{ "name": "Rental", "nameFrom": "Bike", "nameTo": "Customer" }],
    },
  ],
}
    `;

    if (!topicDescr || topicDescr === '') {
      alert("Please provide a domain description.");
      setIsLoading(false);
      return;
    }

    setConceptSystemPrompt(conceptSystemPrompt);
    setSystemBehaviorGuidelines("");
    setConceptUserPrompt(userPrompt);
    setConceptUserInput(userInput);
    setConceptContextItems(contextItems);
    setConceptContextOntology(contextOntology);
    setConceptContextMetamodel(contextMetamodel);
    // setUserPrompt(prompt+contextPrompt+ontologyPrompt);

    if (!debug) console.log('363 Concept step :',
      'conceptSystemPrompt:', conceptSystemPrompt,
      'userPrompt:', userPrompt,
      'userInput:', userInput,
      'contextItems:', contextItems,
      'contextOntology:', contextOntology,
      'contextMetamodel:', contextMetamodel);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaName: 'OntologySchema',
          systemPrompt: conceptSystemPrompt || "",
          systemBehaviorGuidelines: "",
          userPrompt: userPrompt || "",
          userInput: userInput || "",
          contextItems: contextItems || "",
          contextOntology: contextOntology || "",
          contextMetamodel: contextMetamodel || ""
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
      if (debug) console.log('361 parsed', parsed);
      if (parsed.ontologyData.concepts && Array.isArray(parsed.ontologyData.concepts)) {
        setSelectedConcepts({ concepts: parsed.ontologyData.concepts, relationships: parsed.ontologyData.relationships });
        setSuggestedConceptData(parsed.ontologyData);
        const selectedconceptsString = parsed.ontologyData.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n');
        const selectedRelationsString = parsed.ontologyData.relationships.map((rel: any) => `- ${rel.name} (from: ${rel.nameFrom} to: ${rel.nameTo})`).join('\n');
        setConcepts(`**Concepts**\n\n ${selectedconceptsString}\n\n **Relations:**\n\n${selectedRelationsString}\n\n`);
        if (debug) console.log('408 concepts', parsed.ontologyData.concepts, 'selectedconceptsString', selectedconceptsString, 'selectedRelationsString', selectedRelationsString);
        setStep(2);
      } else {
        console.error("Parsed data does not contain concepts or concepts is not an array");
      }
    } catch (e) {
      console.error("Validation failed:", e instanceof Error ? e.message : e);
    }
    setIsLoading(false);
  };

  // ------------------------- Second Step is converting from concepts to IRTV ---------------------------------
  const handleSecondStep = async () => {
    setIsLoading(true);
    setStep(2);
    setActiveTab('model');

    const modelUserPrompt = ` 
## **User Prompt**
Create Information, Roles, Tasks, and Views objects according to list of concepts and relations in the Context as types defined in the Metamodel.
Do not recreate objects that already exists in the 'Existing Context'.
Make sure all objects have relationships.
    `;

    let modelContextItems = (concepts && concepts !== '') ? `

**Information Objects**

Create Information objects and Relationships based on the following:

## List of concepts and relations:
  ${concepts}
`
      : '';

    modelContextItems += (existingContext && existingContext !== '') && `
# Context
## **Existing Context:**
    ${existingContext}
    Do not recreate objects from concepts that already is in Existing Context, but you may create relationship to/from existing context.
`;

    modelContextItems += (suggestedRoles && suggestedRoles !== '') && `
**Roles**
Create Roles including the following user suggested roles:
${suggestedRoles}
    `;

    modelContextItems += (suggestedTasks && suggestedTasks !== '') && `
Create Tasks including the following  user suggested tasks:
  **Tasks**
  ${suggestedTasks}
if no suggested tasks, create necessary tasks that performs or have responsibilities for the views.
    `;

    modelContextItems += (suggestedViews && suggestedViews !== '') && `
Create Views including the following user suggested views:
  **Views**
  ${suggestedViews}

  Views to access the Information objects.
  Tasks applies Views to manipulate the Information objects.
  Roles to perform or manage the Tasks.
    `;
    if (!debug) console.log('464 model', 'modelContextPrompt', modelContextItems);

    const ontologyPrompt = ``;


    setModelIrtvSystemPrompt(modelIrtvSystemPrompt);
    setModelUserPrompt(modelUserPrompt);
    setModelUserInput(modelUserInput);
    setModelContextItems(modelContextItems);
    setModelContextOntology(modelContextOntology);
    setModelContextMetamodel(modelContextMetamodel);
    // setModelContextMetamodel(metamodelContextPrompt);

    if (!debug) console.log('476 Model IRTV step two :',
      'modelIrtvSystemPrompt:', modelIrtvSystemPrompt,
      'modelUserPrompt:', modelUserPrompt,
      'modelUserInput:', modelUserInput,
      'contextItems:', modelContextItems,
      'contextOntology:', modelContextOntology,
      'contextMetamodel:', modelContextMetamodel);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaName: 'ObjectSchema',
          systemPrompt: modelIrtvSystemPrompt || "",
          systemBehaviorGuidelines: "",
          userPrompt: modelUserPrompt || "",
          userInput: modelUserInput || "",
          contextItems: modelContextItems || "",
          contextOntology: modelContextOntology || "",
          contextMetamodel: modelContextMetamodel || ""
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
      if (!debug) console.log('467 parsed', parsed);
      const validatedData = ObjectSchema.parse(parsed);
      // setDomain(validatedData);
      setModel(validatedData); //this is irtv data  setMetis({ ...metis, models: [validatedData] });
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
    setActiveTab('modelview');

    const modelviewSystemPrompt = `
You are a helpful assistand and a highly knowledgeable expert in schematic and diagramming presentation and layou.
You are tasked with presenting the objects and relationships generated from previous step in a modelview.

The modelview will include objectviews and relshipviews for each object and relationship.
Give the objectviews and relshipviews id as uuids.

You will place the objectviews in the modelview using the "loc" attribute with x and y coordinates as string with format "x y".
Make room between the objects to show the relationships clearly.
Align the objects horizontally and vertically to make the modelview look good.
Make space both horizontally (x distans more than 100) and vertically (y distance more than 20) between the objectviews to show the relationships clearly.

Position all Roles to the in a column to the left.
Next on the right put the Tasks.
Next to the right of the Tasks put the Views.
Finally, to the right of the Views put the Information objects.

Make sure to also give horizontal and vertical space between the objects to make the modelview look good.
    `;
    const modelviewUserPrompt = ` 
Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
Next, you will create objectviews and relshipviews for each object and relationship.
You will also create Roles, Tasks, and Views based on the concepts.
Position all objectviews with enough space between them to show the relationships clearly.
Make horizontal and vertical space between the objects to make the modelview look good.
    `;

    const modelviewContextItems = `
## Context:
  **Objects and Relationships:**
  ${model?.objects.map((obj: any) => `- ${obj.id} ${obj.name} ${obj.description}`).join('\n')} 
  ${model?.relationships.map((rel: any) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`).join('\n')}
    `;

    const modelviewContextOntology = ``;

    const metamodelPrompt = ``;

    setModelviewSystemPrompt(modelviewSystemPrompt)
    setModelviewUserPrompt(modelviewUserPrompt)
    setModelviewUserInput(modelviewUserInput)
    setModelviewContextItems(modelviewContextItems)
    setModelviewContextOntology(modelviewContextOntology)
    setModelviewContextMetamodel(metamodelPrompt)

    if (!debug) console.log('476 Modeview step three :',
      'modelviewSystemPrompt:', modelviewSystemPrompt,
      'modelviewUserPrompt:', modelviewUserPrompt,
      'modelviewUserInput:', modelviewUserInput,
      'modelviewContextItems:', modelviewContextItems,
      'modelviewContextOntology:', modelviewContextOntology,
      'modelviewContextMetamodel:', modelviewContextMetamodel);

    try {
      const res = await fetch("/streaming/api/genmodel", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaName: 'ModelviewSchema',
          systemPrompt: modelviewSystemPrompt || "",
          systemBehaviorGuidelines: "",
          userPrompt: modelviewUserPrompt || "",
          userInput: modelviewUserInput || "",
          contextItems: modelviewContextItems || "",
          contextOntology: modelviewContextOntology || "",
          contextMetamodel: modelviewContextMetamodel || ""
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

      // if (!debug) console.log('409 Raw data:', data);

      const parsed = JSON.parse(data);
      // if (!debug) console.log('412 modelviews', parsed, model);
      const validatedData = ModelviewSchema.parse(parsed);
      // const modelview = {modelviews: [validatedData]};
      // if (!debug) console.log('415 modelview', modelview, model);

      setNewModelview(validatedData);
      if (!debug) console.log('620 model', newModelview, validatedData);
      setStep(4);
    } catch (e) {
      console.error("Validation failed:", e instanceof Error ? e.message : e);
    }

    setIsLoading(false);
  }


  return (
    <div className="akm-canvas flex flex-col gap-1 m-1">
      <header className="ms-2 me-auto w-full bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
        <div className="flex justify-between items-center font-bold text-white className= text-green-500 mx-5">
          <div className="me-5 text-muted-foreground">AKM file :
            <span className="px-2 text-gray-300">{metis?.name}.json</span>
          </div>
          <div className="me-5 text-3xl rounded bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
            &nbsp;&nbsp; Active Knowledge Lab  &nbsp;&nbsp;
          </div>
          <div className="flex items-center mx-5">
            <div className="mx-4 text-orange-700">AI-Powered AKM Dashboard</div>
            <FontAwesomeIcon icon={faRobot} className="text-orange-700" />
          </div>
        </div>
      </header>
      {/* Innput fields  --------------------------------------------------------------------------------------*/}
      <div>
        <div className="flex justify-between mx-2 px-4 text-white rounded ">
          <div className="flex justify-between align-center bg-gray-800">
            {/* <h3 className="mx-2 font-bold text-gray-400 inline-block"> Current Project: </h3> <div className="inline-block"> {metis?.name}</div> */}
            <h3 className="mx-2 font-bold text-gray-400 inline-block"> Current Model: </h3> <span className="inline-block"> {currentModel?.name}</span>
            <h3 className="mx-2 font-bold text-gray-400 inline-block"> No. of Objects: </h3> <span className="inline-block"> {currentModel?.objects.length}</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleGetLocalFile(e, dispatch)}
          />
          <div className="flex ">
            <button
              className="bg-blue-500 text-white rounded m-1 py-0.5 px-2 text-xs"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              Load Local File
            </button>
            <button
              className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
              onClick={() => {
                dispatch(clearModel(model));
              }}
            >
              Clear Model
            </button>
            <button
              className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
              onClick={() => {
                dispatch(clearStore());
              }}
            >
              Clear Store
            </button>
            <button
              className="bg-blue-500 text-white rounded m-1 py-0 px-2 text-xs"
              onClick={() => {
                handleSaveToLocalFile(data);
              }}
            >
              Save to Local file
            </button>
          </div>
        </div>
        <div className="flex mx-2">

          {/* Steps from User input to generate Concepts  ----------------------------------------------------*/}
          {/* <div className="border-solid rounded border-4 border-green-700 "> */}
          {/* 1st Step: Establish a Conceptual Apparatus for a Domain */}
          <ConceptBuilder />
          {/* 1st Step: Establish a Conceptual Apparatus for a Domain */}
          {/* <Card className="mb-0.5"> 
              <CardHeader>
                <CardTitle
                  className="flex justify-between items-center flex-grow ps-1"
                >
                  Concept Builder:
                </CardTitle>
                <div className="mx-2">
                  <details>
                    <summary>Concept Ontology</summary>
                    <div className="bg-gray-600">
                      <p>Build an AKM Concept Model assisted by AI</p>
                      <p>This involves the following steps:</p>
                      <ul>
                        <li><strong>• Establish the Concept Ontology (Conceptual Apparatus) for the Domain:</strong></li>
                        <p style={{ marginLeft: '20px' }}>It refers to the set of concepts, theories, models, and frameworks that collectively provide the foundational understanding of a particular field or discipline.
                          It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                        <li><strong>• Create the Workspaces :</strong></li>
                        <p style={{ marginLeft: '20px' }}>Create IRTV objects and relationships. Create Information objects of the concepts identified in the first step (The What). Add Roles (Who), Tasks (How), and Views (What to see) working on the Information objects.</p>
                        <li><strong>• Dispatch the result to the current Model-project store:</strong></li>
                        <p style={{ marginLeft: '20px' }}>The final step is to dispatch the generated IRTV objects and relationships to the current Model-project.</p>
                      </ul>
                    </div>
                  </details>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-start">
                <label htmlFor="topicDescr" className="text-white">Topic</label>
                <Textarea
                  id="topicDescr"
                  className="flex-grow p-1 rounded bg-gray-800"
                  value={topicDescr}
                  disabled={isLoading}
                  onChange={(e) => setTopicDescr(e.target.value)}
                  placeholder="Enter domain description"
                  rows={3} // Adjust the number of rows as needed
                />
                <details className="flex-grow">
                  <summary className="text-white cursor-pointer">Add Domain name and Concepts you want to be included</summary>
                  <div className="flex flex-col flex-grow mt-2">
                    <label htmlFor="suggestedConcepts" className="text-white mt-2">Domain name </label>
                    <Input
                      id="suggestedConcepts"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={domainDesc}
                      disabled={isLoading}
                      onChange={(e) => setDomainDesc(e.target.value)}
                      placeholder="Enter your domain name i.e.: E-Scooter Rental Services"
                    />
                    <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts you want to include separated by comma</label>
                    <Input
                      id="suggestedConcepts"
                      className="flex-grow p-1 rounded bg-gray-800"
                      value={suggestedConcepts}
                      disabled={isLoading}
                      onChange={(e) => setSuggestedConcepts(e.target.value)}
                      placeholder="Enter your concepts i.e.: Scooter, User, booking"
                    />
                  </div>
                </details>
                <details className="flex-grow">
                  <summary className="cursor-pointer">Add Ontology (paste the URL in here)</summary>
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
                          setActiveTab('imported-ontology');
                        }}
                        className="bg-green-800 text-white rounded m-1"
                      >
                        Load Ontology
                      </Button>
                    </div>
                  </div>
                </details>
              </CardContent>
              <CardFooter>
                <CardTitle
                  className={`flex justify-between items-center flex-grow ps-1 ${(concepts.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                >
                  Ask GPT to suggest Concepts
                  <div className="flex items-center ml-auto">
                    {(isLoading && step === 1) ? (
                      <div style={{ marginLeft: 8, marginRight: 8 }}>
                        <LoadingCircularProgress />
                      </div>
                    ) : (
                      <div style={{ marginLeft: 8, marginRight: 8, color: concepts.length > 0 ? 'green' : 'gray' }}>
                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                      </div>
                    )}
                    <Button onClick={() => {
                      setStep(1);
                      handleFirstStep();
                      setActiveTab('suggested-concepts');
                    }}
                      className={`rounded text-xl p-4 ${(concepts.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                    >
                      <FontAwesomeIcon icon={faRobot} size="1x" />
                    </Button>
                  </div>
                </CardTitle>
              </CardFooter>
            </Card> */}


          {/* </div> */}

          {/* Model Canvas -----------------------------------------------------------------------------------------------------------------------------------------*/}

        </div>
      </div>
    </div>
  );
};

export default SyncPage;