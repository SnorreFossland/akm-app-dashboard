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

import { setObjects, setRelationships, setModelview, clearStore, clearModel } from "@/features/featureA/featureASlice";
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

import { handleSaveToLocalFile } from '@/features/featureA/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/featureA/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/featureA/components/HandleGetLocalFileClick';
import { relative } from "path";

const debug = false;

const SyncPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const data = useSelector((state: RootState) => state.featureA.data);
  const error = useSelector((state: RootState) => state.featureA.error);
  const status = useSelector((state: RootState) => state.featureA.status);

  const [topicDescr, settopicDescr] = useState("");
  const [domainDesc, setDomainDesc] = useState("");
  const [domain, setDomain] = useState({ concepts: [], relationships: [] });
  const [model, setModel] = useState<any>(null);
  const [suggestedConcepts, setSuggestedConcepts] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState("");
  const [suggestedViews, setSuggestedViews] = useState("");
  const [existingContext, setExistingContext] = useState("");
  const [ontologyUrl, setOntologyUrl] = useState("https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json");
  const [ontology, setOntology] = useState([]);
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

  useEffect(() => {
    // type ExistingObject = { id: string; name: string; description: string; typeName: string };
    // type ExistingRelationship = { id: string; name: string; nameFrom: string; nameTo: string };

    if (data?.project) {
      if (!debug) console.log('89 data', data);
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
        const mmObjecttypeviewStrings = metamodel?.objecttypeviews.map((otv: any) =>
          `${otv.id} ${otv.name}`).join(', ');
        //         const metamodelPrompt = `
        // **Metamodel:**
        //   - **Object Types:** \n ${mmObjecttypeStrings} 
        //   - **Relation Types:** \n ${mmRelationtypeStrings}
        //   - **Object Typeviews:** \n ${mmObjecttypeviewStrings}
        // `;
        //         setModelContextMetamodel(metamodelPrompt);
        setModelviewContextMetamodel("");
      }
      // setMetamodelPrompt(`${MetamodelPrompt}`);

      const models = metis1.models;
      const curmod = models?.find((model: any) => model.id === focus?.focusModel?.id) || models[0];
      // if (!debug) console.log('95 currentModel', curmod, currentModel, metis?.models);
      setCurrentModel(curmod);

      const filteredRelationships = curmod?.relships?.filter((rel: any) => {
        const fromObject = curmod?.objects?.find((obj: any) => obj.id === rel.fromobjectRef);
        const toObject = curmod?.objects?.find((obj: any) => obj.id === rel.toobjectRef);
        // if (!debug) console.log('127 fromObject', fromObject, 'toObject', toObject, 'rel', rel);
        return fromObject?.typeName === 'Information' && toObject?.typeName === 'Information' && rel;
      }) || [];

      if (!debug) console.log('130 filteredRelationships', filteredRelationships);

      const existingObjects = curmod?.objects?.map((obj: any) => ({ id: obj.id, name: obj.name, description: obj.description, typeName: obj.typeName })) || [];
      const existingRelationships = filteredRelationships?.map((rel: any) => ({ id: rel.id, name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo })) || [];

      setExistingInfoObjects({
        objects: existingObjects?.filter((obj: any) => obj && obj.typeName === 'Information') || [],
        relationships: existingRelationships
      });

      const existInfoConcepts = ({
        concepts: existingInfoObjects.objects.map((obj: any) => ({ name: obj.name, description: obj.description })),
        relationships: existingInfoObjects.relationships.map((rel: any) => ({ name: rel.name, description: rel.nameFrom + ' ' + rel.nameTo }))
      });

      let conceptString = '';
      if (existInfoConcepts.concepts.length > 0) {
        conceptString += `**Objects**\n\n${existInfoConcepts.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
        conceptString += `**Relationships**\n\n${existInfoConcepts.relationships.map((r: any) => `- ${r.name} - ${r.description} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
      }
      setExistingConcepts(conceptString);      // if (!debug) console.log('101 existingContext', existingContext);
      // if (!debug) console.log('102 currentModel', currentModel?.name, data, metis, focus, user);
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
    if (!model) {
      alert('No IRTV data to dispatch');
      return;
    }
    if (!debug) console.log('156 dispatching IRTV data:', model, newModelview);
    dispatch(setObjects(model.objects));
    dispatch(setRelationships(model.relationships));
    dispatch(setModelview([newModelview]));
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
      if (!debug) console.log('180 Fetched ontology data:', data);
      if (Array.isArray(data)) {
        const filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
        setOntology(filteredOntology);
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

    if (!debug) console.log('363 Concept step one :',
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

  // const handleCopy = () => {
  //   if (model) {
  //     const jsonOutput = JSON.stringify(model, null, 2);
  //     navigator.clipboard.writeText(jsonOutput).then(() => {
  //       if (!debug) console.log('JSON copied to clipboard');
  //     }).catch(err => {
  //       console.error('Failed to copy JSON:', err);
  //     });
  //   }
  // };

  return (
    <div className="akm-canvas flex flex-col gap-1 m-1 h-screen ">
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
        <div className="flex justify-between mx-2 px-4 text-white rounded">
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
          {/* Steps from User input to generate IRTV objects and relationships  ----------------------------------------------------*/}
          <div className="border-solid rounded border-4 border-green-700 w-1/4">
            <Card className="mb-0.5">  {/* 1st Step: Establish a Conceptual Apparatus for a Domain */}
              <CardHeader>
                <CardTitle
                  className="flex justify-between items-center flex-grow ps-1"
                // className={`flex justify-between items-center flex-grow ps-1 ${topicDescr !== '' ? 'text-green-600' : 'text-green-200'}`}
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
                  onChange={(e) => settopicDescr(e.target.value)}
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
            </Card>

            <Card className="mb-0.5">   {/* 2nd Step: Generate IRTV objects and relationshipsGenerate IRTV objects and relationships */}
              <CardHeader>
                <CardTitle
                  className={`flex justify-between items-center flex-grow ps-1 ${(model?.objects?.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                >
                  Model Builder (Create IRTV-Model):
                  <div className="flex items-center ml-auto">
                    {(isLoading && step === 2) ? (
                      <div style={{ marginLeft: 8, marginRight: 8 }}>
                        <LoadingCircularProgress />
                      </div>
                    ) : (
                      <div style={{ marginLeft: 8, marginRight: 8, color: model?.objects?.length > 0 ? 'green' : 'gray' }}>
                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                      </div>
                    )}
                    <Button onClick={async () => {
                      await handleSecondStep();
                      setActiveTab('model');
                    }}
                      className={`rounded text-xl p-4 ${(model?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                    >
                      <FontAwesomeIcon icon={faRobot} size="1x" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
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
            </Card>

            <Card className="mb-0.5">  { /* 3rd Step: Generate a Modelview with Objectviews and Relshipviews */}
              <CardHeader>
                <CardTitle
                  className={`flex justify-between items-center flex-grow ps-1 ${(newModelview?.objectviews.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                >
                  Workspace Builder (Create IRTV-Modelview):
                  <div className="flex items-center ml-auto">
                    {(isLoading && step === 3) ? (
                      <div style={{ marginLeft: 8, marginRight: 8 }}>
                        <LoadingCircularProgress />
                      </div>
                    ) : (
                      <div style={{ marginLeft: 8, marginRight: 8, color: newModelview?.objectviews.length > 0 ? 'green' : 'gray' }}>
                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                      </div>
                    )}
                    <Button onClick={async () => {
                      await handleThirdStep();
                      setActiveTab('modelview');
                    }}
                      className={`rounded text-xl p-4 ${(newModelview?.objectviews.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                    >
                      <FontAwesomeIcon icon={faRobot} size="1x" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {/* <CardContent>
                  <h5 className="text-white mx-2"> Evaluate the Domain and find Concepts and concepts to be used in AKM:</h5>
                </CardContent> */}
            </Card>

            <Card className="mb-0.5">  { /* 4th Step: Generate a Modelview with Objectviews and Relshipviews */}
              <CardHeader>
                <CardTitle
                  className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                >
                  Save to current Model
                  <div className="flex items-center ml-auto">
                    {!dispatchDone && step === 4 ? (
                      <div style={{ marginLeft: 8, marginRight: 8 }}>
                        <LoadingCircularProgress />
                      </div>
                    ) : (
                      <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
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

            <Card className="mb-0.5">   { /* 5th Step: Save the current-knowledge to a project file */}
              <CardHeader>
                <CardTitle
                  className={`flex justify-between items-center flex-grow ${step === 5 && dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                >
                  Save the Model to project file
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

          {/* Model Canvas -----------------------------------------------------------------------------------------------------------------------------------------*/}

          {/* Model Canvas -----------------------------------------------------------------------------------------------------------------------------------------*/}
          <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-screen">
            <Card className="h-full p-1"> {/* Model Canvas */}
              <CardTitle className="flex justify-center text-white m-1">Active Knowledge Canvas (IRTV)</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="m-1 mb-0 bg-transparent">
                  <TabsTrigger value="current-knowledge" className='pb-2 mt-3'>Current Knowledge</TabsTrigger>
                  <TabsTrigger value="imported-ontology" className='pb-2 mt-3'>Imported Ontology</TabsTrigger>
                  <TabsTrigger value="suggested-concepts" className='pb-2 mt-3'>GPT Suggested Concepts</TabsTrigger>
                  <TabsTrigger value="model" className='pb-2 mt-3'>GPT Suggested Model</TabsTrigger>
                  <TabsTrigger value="modelview" className='pb-2 mt-3'>GPT Suggested Modelview</TabsTrigger>
                  {/* <TabsTrigger value="objects" className={activeTab === 'objects' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Objects & Relationships</TabsTrigger>
                  <TabsTrigger value="diagram" className={activeTab === 'diagram' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Preview Diagram</TabsTrigger> */}
                </TabsList>
                <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background">
                  <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="bg-gray-700 mx-1 px-1 mt-0">
                    <TabsList className=" mb-0 bg-gray-700 mt-0">
                      <TabsTrigger value="model-summary" className='pb-2 mt-3'>Current Model Summary</TabsTrigger>
                      <TabsTrigger value="model-objects" className='pb-2 mt-3'>Currrent Model</TabsTrigger>
                      <TabsTrigger value="model-modelviews" className='pb-2 mt-3'>Current Modelview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200">
                      <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        <div className="">
                          {data && data.project && data.project.phData && data.project.phData.metis && data.project.phData.metis.models && (
                            <>
                              <div className="flex justify-left items-center py-2 text-left">
                                <h4 className="px-2 text-gray-400 font-bold">AKM File</h4>
                                <h4 className="px-2 mb-1 font-bold whitespace-nowrap bg-gray-700">{data.project.phSource}.json</h4>
                              </div>
                              <div className="flex flex-wrap">
                                <div className="px-2 col text-left mb-4 w-1/3">
                                  <h4 className="text-gray-400 font-bold">Model Suite:</h4>
                                  <div className="border border-gray-600 p-2">
                                    <h5 className="text-gray-400 font-bold">Name</h5>
                                    <h4 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phData.metis.name}</h4>
                                    <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                    <h4 className=" bg-gray-800 p-1">{data.project.phData.metis.description}</h4>
                                  </div>
                                  <div className="col text-left">
                                    <h4 className="text-gray-400 font-bold">Project:</h4>
                                    <div className="border border-gray-600 p-2">
                                      <h5 className="text-gray-400 font-bold px-1">id</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.id}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">proj.no.</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.projectNumber}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">name</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.name}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.org}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.repo}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">path</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.path}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">file</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.file}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">branch</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.branch}</h5>
                                      <h5 className="text-gray-400 font-bold px-1">username</h5>
                                      <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.project.phFocus.focusProj.username}</h5>
                                    </div>
                                  </div>
                                </div>
                                <div className="px-4 col text-left w-2/3">
                                  <h4 className="px-1 text-gray-400 font-bold">Models:</h4>
                                  <div className="border border-gray-600 p-2">
                                    {data.project.phData.metis.models.map((model: any, index) => (
                                      <div key={model.id} className="flex flex-col">
                                        <h5 className="text-gray-400 font-bold">Name</h5>
                                        <h4 className="bg-gray-800 p-2"> <span className="text-gray-400">{index}: </span>{model.name}</h4>
                                        <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                        <h4 className="bg-gray-800 p-2">{model.description}</h4>
                                        <hr className="my-1" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="model-objects" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                      <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                      </div>
                      {data && data.project && data.project.phData && data.project.phData.metis && data.project.phData.metis.models && (
                        <ObjectCard model={{ name: data.project.phData.metis.models[0].name, objects: data.project.phData.metis.models[0].objects, relationships: data.project.phData.metis.models[0].relships }} />
                      )}
                    </TabsContent>
                    <TabsContent value="model-modelviews" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                      <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        <ModelviewCard modelviews={data?.project.phData.metis.models[0].modelviews} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                <TabsContent value="imported-ontology" className="bg-background m-0 py-2 rounded ">
                  {(ontologyData?.concepts.length > 0) &&
                    <div className="flex justify-center items-center">
                      <div className="text-gray-400 mx-5">The Ontology concepts is fetched from URL:</div>
                      <div className="text-gray-400">
                        <a href={ontologyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                          {ontologyUrl}
                        </a>
                      </div>
                    </div>
                  }
                  <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <ImportedOntologyCard ontologyData={ontologyData} />
                  </div>
                </TabsContent>
                <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
                  <>
                    <div className="flex justify-end pb-1 pt-0 mx-2">
                      <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                        Show Prompt
                      </button>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                        <DialogHeader>
                          <DialogDescription>
                            <div>
                              <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                <DialogTitle>---- System Prompt</DialogTitle>
                                <ReactMarkdown>{conceptSystemPrompt}</ReactMarkdown>
                                <DialogTitle>---- System behavior Guidelines Prompt</DialogTitle>
                                <ReactMarkdown>{systemBehaviorGuidelines}</ReactMarkdown>
                                <DialogTitle>---- User Prompt</DialogTitle>
                                <ReactMarkdown>{conceptUserPrompt}</ReactMarkdown>
                                <DialogTitle>---- User Input</DialogTitle>
                                <ReactMarkdown>{conceptUserInput}</ReactMarkdown>
                                <DialogTitle>---- Context Prompt</DialogTitle>
                                <ReactMarkdown>{conceptContextItems}</ReactMarkdown>
                                <DialogTitle>---- Ontology Prompt</DialogTitle>
                                <ReactMarkdown>{conceptContextOntology}</ReactMarkdown>
                                <DialogTitle>---- Metamodel Prompt</DialogTitle>
                                <ReactMarkdown>{conceptContextMetamodel}</ReactMarkdown>
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
                    <div className="mx-1 bg-gray-700 ">
                      <OntologyCard ontologyData={suggestedConceptData} />
                    </div>
                  </>
                </TabsContent>
                <TabsContent value="model" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                  {showModel && (
                    <>
                      <div className="flex justify-end pb-1 pt-0 mx-2">
                        <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                          Show Prompt
                        </button>
                      </div>
                      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                          <DialogHeader>
                            <DialogDescription>
                              <div>
                                <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                  <DialogTitle>modelIrtvSystemPrompt : </DialogTitle>
                                  <ReactMarkdown>{modelIrtvSystemPrompt}</ReactMarkdown>
                                  <DialogTitle>User Prompt</DialogTitle>
                                  <ReactMarkdown>{modelUserPrompt}</ReactMarkdown>
                                  <DialogTitle>User Input Prompt</DialogTitle>
                                  <ReactMarkdown>{modelUserInput}</ReactMarkdown>
                                  <DialogTitle>Context items</DialogTitle>
                                  <ReactMarkdown>{modelContextItems}</ReactMarkdown>
                                  <DialogTitle>Context ontology</DialogTitle>
                                  <ReactMarkdown>{modelContextOntology}</ReactMarkdown>
                                  <DialogTitle>Metamodel Irtv Prompt</DialogTitle>
                                  <ReactMarkdown>{modelContextMetamodel}</ReactMarkdown>
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
                      <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        <ObjectCard model={{ ...model, description: model.description || '' }} />
                      </div>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                  <>
                    <div className="flex justify-end pb-1 pt-0 mx-2">
                      <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                        Show Prompt
                      </button>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogContent className="max-w-5xl"> {/* Added max-w-4xl for wider dialog */}
                        <DialogHeader>
                          <DialogDescription>
                            <div>
                              <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                <DialogTitle>System Prompt</DialogTitle>
                                <ReactMarkdown>{modelviewSystemPrompt}</ReactMarkdown>
                                <DialogTitle>User Prompt</DialogTitle>
                                <ReactMarkdown>{modelviewUserPrompt}</ReactMarkdown>
                                <DialogTitle>User Input</DialogTitle>
                                <ReactMarkdown>{modelviewUserInput}</ReactMarkdown>
                                <DialogTitle>Context items</DialogTitle>
                                <ReactMarkdown>{modelviewContextItems}</ReactMarkdown>
                                <DialogTitle>Context ontology</DialogTitle>
                                <ReactMarkdown>{modelviewContextOntology}</ReactMarkdown>
                                <DialogTitle>Context Metamodel</DialogTitle>
                                <ReactMarkdown>{modelviewContextMetamodel}</ReactMarkdown>
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
                    <div className="mx-1 ">
                      <ModelviewCard modelviews={[newModelview]} />
                    </div>
                  </>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* {model && (
            <Button onClick={handleCopy} className="mx-2 bg-blue-500 text-white rounded">
              Copy JSON
            </Button>
          )} */}
    </div>
  );
};

export default SyncPage;