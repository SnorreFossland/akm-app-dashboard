import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setOntologyData } from '@/features/ontology/ontologySlice';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';
import { ObjectSchema } from "@/objectSchema";
import { ObjectCard } from '@/components/object-card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';



import { SystemIrtvPrompt } from '@/app/concept-builder/prompts/system-irtv-prompt';
import { MetamodelPrompt } from '@/app/model-universe/prompts/metamodel-irtv-prompt';

const debug = false;

const ConceptBuilder = () => {
    const data = useSelector((state: RootState) => state.modelUniverse.data);
    const error = useSelector((state: RootState) => state.modelUniverse.error);
    const status = useSelector((state: RootState) => state.modelUniverse.status);
    const reduxData = data;

    if (!debug) console.log('22 ConceptBuilder data:', data);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [domainDesc, setDomainDesc] = useState("");
    const [ontologyUrl, setOntologyUrl] = useState("");
    const [systemPrompt, setSystemPrompt] = useState(SystemIrtvPrompt);
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [userPrompt, setUserPrompt] = useState("");
    const [userInput, setUserInput] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [contextMetamodel, setContextMetamodel] = useState(MetamodelPrompt);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suggestedConceptsData, setSuggestedConseptsData] = useState(null);
    const [suggestedModelData, setSuggestedModelData] = useState(null);
    const [suggestedRoles, setSuggestedRoles] = useState("");
    const [suggestedTasks, setSuggestedTasks] = useState("");
    const [suggestedViews, setSuggestedViews] = useState("");
    const [allOntology, setAllOntology] = useState<Ontology | null>(null);
    const [descrString, setDescrString] = useState("");
    const [existingContext, setExistingContext] = useState("");
    const [ontologyString, setOntologyString] = useState("");
    const [concepts, setConcepts] = useState("");
    const [conceptData, setConceptData] = useState(null)
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const [model, setModel] = useState(null);
    const [metis, setMetis] = useState(null);
    const [currentModel, setCurrentModel] = useState(null);
    const [newModelview, setNewModelview] = useState(null);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleAskGpt = () => (
        <div className="flex items-center ml-auto">
            {(isLoading && step === 1) ? (
                <div style={{ marginLeft: 8, marginRight: 8 }}>
                    <LoadingCircularProgress />
                </div>
            ) : (
                <div style={{ marginLeft: 8, marginRight: 8, color: (suggestedConceptData && suggestedConceptData.length > 0) ? 'green' : 'gray' }}>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                </div>
            )}
            <Button onClick={() => {
                setStep(1);
                handleModelBuilder();
                setActiveTab('objects');
            }}
                className={`rounded text-xl p-4 ${(suggestedConceptsData && suggestedConceptsData.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
            >
                <FontAwesomeIcon icon={faRobot} size="1x" />
            </Button>
        </div>
    )


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

  useEffect(() => {
    // type ExistingObject = { id: string; name: string; description: string; typeName: string };
    // type ExistingRelationship = { id: string; name: string; nameFrom: string; nameTo: string };

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

        setModelviewContextMetamodel("");
      }


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

  // ------------------------- this Step is converting from concepts to IRTV ---------------------------------
  const handleModelBuilder = async () => {
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

**IRTV Objects**

Create IRTV objects and Relationships based on the following:

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

        setSystemPrompt(SystemIrtvPrompt);
        setUserPrompt(modelUserPrompt);
        setUserInput(modelUserInput);
        setContextItems(modelContextItems);
        setContextOntology(modelContextOntology);
        setContextMetamodel(MetamodelPrompt);
    // setModelContextMetamodel(metamodelContextPrompt);

    if (!debug) console.log('476 Model IRTV step two :',
      'modelSystemPrompt:', systemPrompt,
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
          systemPrompt: systemPrompt || "",
          systemBehaviorGuidelines: "",
          userPrompt: modelUserPrompt || "",
          userInput: modelUserInput || "",
          contextItems: modelContextItems || "",
          contextOntology: modelContextOntology || "",
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
 
    return (
        <div className="flex  h-[calc(100vh-5rem)]">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" /> IRTV Model
                        </summary>
                        <div className="bg-gray-600 p-2">
                            <p>Build a Concept Model assisted by AI</p>
                            <p>This process involves several key steps, each contributing to the development of a structured and comprehensive model for a given domain.
                                The goal is to build a  Model that leverages AI to facilitate the creation and integration of concepts within the domain.
                            </p>
                            <p><strong>Establish the Concept Ontology (Conceptual Framework) for the Domain:</strong></p>
                            <p style={{ marginLeft: '20px' }}>The Concept Ontology refers to the foundational structure that defines the essential concepts, theories, models, and frameworks within a specific domain or field. It serves as a shared vocabulary that enables clear communication and collaboration among practitioners. This ontology includes:
                                It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                            <ul>
                                <li><strong>• Core Concepts: </strong>Fundamental ideas and categories that are central to the domain.</li>
                                <li><strong>• Principles and Theories: </strong>The underlying rules and logical structures that guide the domain’s knowledge and practices.</li>
                                <li><strong>• Relationships: </strong>The connections and interactions between concepts that help explain how they relate to one another.</li>
                            </ul>
                            <p style={{ marginLeft: '20px' }}>By establishing this ontology, you create a well-organized framework that supports knowledge sharing, problem-solving, and further advancement within the field.</p>
                        </div>
                    </details>
                </div>
                <CardTitle className="flex justify-between items-center flex-grow ps-1">
                    Model Explorer:
                </CardTitle>
                <div className="flex flex-wrap items-start m-1">
                    <details className="m-2 w-full">
                        <summary className="text-white cursor-pointer">More ...</summary>
                        <div className="mt-2">
                            <div className="flex flex-col flex-grow">
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Domain name </label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={domainDesc}
                                    disabled={isLoading}
                                    onChange={(e) => setDomainDesc(e.target.value)}
                                    placeholder="Enter your domain name i.e.: E-Scooter Rental Services"
                                />
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts</label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={suggestedConceptsData || ""}
                                    disabled={isLoading}
                                    onChange={(e) => setSuggestedConceptsData(e.target.value)}
                                    placeholder="Enter your concepts i.e.: Scooter, User, booking"
                                />
                            </div>
                            <div className="cursor-pointer">Import Ontology</div>
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
                                        className="bg-green-800 text-white text-sm rounded w-full"

                                    >
                                        Load Ontology
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </details>

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
                                    await handleModelBuilder();
                                    setActiveTab('model');
                                }}
                                    className={`rounded text-xl p-4 ${(model?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                                >
                                    <FontAwesomeIcon icon={faRobot} size="1x" />
                                </Button>
                            </div>
                        </CardTitle>


                    {/* <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(suggestedModelData && suggestedModelData.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Ask GPT to suggest Concepts
                        <div className="flex items-center ml-auto">
                            {(isLoading) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : (
                                <div style={{ marginLeft: 8, marginRight: 8, color: suggestedModelData && step === 1 ? 'green' : 'gray' }}>
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            )}
                            <Button onClick={() => {
                                setStep(1);
                                handleModelBuilder();
                                setActiveTab('objects');
                            }}
                                className={`rounded text-xl p-4 ${(suggestedModelData && step === 1) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                            >
                                <FontAwesomeIcon icon={faRobot} size="1x" />
                            </Button>
                        </div>
                    </CardTitle> */}


                </div>
                <div className="m-1 mt-auto">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        <div
                            className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                        >
                            Save to current Model Store
                            <div className="flex items-center ml-auto">
                                {!dispatchDone && step === 2 ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone && step === 2 ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button
                                    onClick={() => {
                                        setStep(2);
                                        handleDispatchIrtvData();
                                    }}
                                    className={`rounded text-xl ${dispatchDone && step === 4 || step === 5 ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                                    <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </div>
            </div>

            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                        <TabsTrigger value="suggested-concepts" className="bg-blue-800 text-white rounded px-1 py-0">Suggested Concepts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
                        <>
                            <div className="flex justify-end pb-1 pt-0 mx-2">
                                <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                    Show Prompt
                                </button>
                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                    <DialogContent className="max-w-5xl">
                                        <DialogHeader>
                                            <DialogDescription>
                                                <div>
                                                    <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        <DialogTitle>---- System Prompt</DialogTitle>
                                                        <ReactMarkdown>{systemPrompt}</ReactMarkdown>
                                                        <DialogTitle>---- System behavior Guidelines Prompt</DialogTitle>
                                                        <ReactMarkdown>{systemBehaviorGuidelines}</ReactMarkdown>
                                                        <DialogTitle>---- User Prompt</DialogTitle>
                                                        <ReactMarkdown>{userPrompt}</ReactMarkdown>
                                                        <DialogTitle>---- User Input</DialogTitle>
                                                        <ReactMarkdown>{userInput}</ReactMarkdown>
                                                        <DialogTitle>---- Context Prompt</DialogTitle>
                                                        <ReactMarkdown>{contextItems}</ReactMarkdown>
                                                        <DialogTitle>---- Ontology Prompt</DialogTitle>
                                                        <ReactMarkdown>{contextOntology}</ReactMarkdown>
                                                        <DialogTitle>---- Metamodel Prompt</DialogTitle>
                                                        <ReactMarkdown>{contextMetamodel}</ReactMarkdown>
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
                            </div>
                            <div className="mx-1 bg-gray-700 ">
                                <ObjectCard model={{ ...model, description: model?.description || '' }} />                           </div>
                       
                        </>
                    </TabsContent>
                </Tabs>
            </div>

        </div>
    );
}

export default ConceptBuilder;