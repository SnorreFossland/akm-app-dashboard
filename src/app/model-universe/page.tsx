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

import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/model-universe/components/HandleGetLocalFileClick';
import { relative } from "path";


import { OntologyCard } from "@/components/ontology-card";
import { ImportedOntologyCard } from "@/components/imported-ontology-card";
import { ObjectSchema } from "@/objectSchema";
import { ObjectCard } from "@/components/object-card";
import { ModelviewSchema } from "@/modelviewSchema";
import { ModelviewCard } from "@/components/modelview-card";
import { SystemConceptPrompt } from './prompts/concept-system-prompt';
import { SystemIrtvPrompt } from './prompts/system-irtv-prompt';
import { MetamodelPrompt } from './prompts/metamodel-irtv-prompt'; // default metamodel prompt for IRTV
import ModelBuilder from '@/components/model-universe/ModelBuilder';
import LocalFile from "@/components/model-universe/LocalFile";
import LocalFiles from "@/features/model-universe/components/LocalFiles";

const debug = false;

const SyncPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const data = useSelector((state: RootState) => state.model.data);
  const status = useSelector((state: RootState) => state.model.status);
  const error = useSelector((state: RootState) => state.model.error);
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


    useEffect(() => {
  
      if (data) {
        if (!debug) console.log('89 data', data);
        const metis1 = data.phData?.metis;
        const focus = data.phFocus;
        const user = data.phUser;
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
      } else {
        console.error('Data does not contain data:', data);
      }

    }, [data]);


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
          <div className="me-5 mb-0 mt-4 text-muted-foreground">AKM file :
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

      <div>
        <LocalFiles currentModel={currentModel} model={model} data={data} />
        <div className="flex mx-2">
          <ModelBuilder />
        </div>
      </div>
    </div>
  );
};

export default SyncPage;