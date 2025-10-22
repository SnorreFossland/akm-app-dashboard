// New: structured template type (add fields; keep legacy 'usage' for compatibility)
export interface PromptTemplate {
    id: string;
    title: string;
    usage?: string; // legacy category / usage string
    content: string;
    applicableDocumentTypes?: string[];         // e.g. ['markdown','project-plan']
    applicableDomainCategories?: (DomainCategory | 'any')[]; // e.g. ['Business','Technical'] or ['any']
    priority?: number;   // higher => show earlier
    weight?: number;     // scoring multiplier
    tags?: string[];     // free-form tags for heuristics
    createdAt?: string;
}

// Define the template interface
export interface PromptTemplate {
    title: string;
    category: string;
    usage: "Personal" | "Business" | string;
    content: string;
}

// New: normalize template content to reduce excessive blank lines and collapse many empty rows before table headers
function normalizeTemplateContent(content: string): string {
    if (!content) return content;
    // Normalize line endings
    let s = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Collapse runs of 3+ newlines into two (preserve paragraph breaks)
    s = s.replace(/\n{3,}/g, '\n\n');
    // Specifically collapse 2+ newlines immediately before a markdown table header line (starting with '|') to a single newline
    s = s.replace(/\n{2,}(?=\s*\|)/g, '\n');
    // Remove leading blank lines
    s = s.replace(/^\s*\n+/, '');
    // Trim trailing whitespace/newlines
    s = s.replace(/\s+$/g, '');
    return s;
}

// Replace direct export with raw + sanitized export.
// Keep the original template objects untouched; export the sanitized versions instead.

const RAW_PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: 'brainstorming-ideas',
        title: "Brainstorming Ideas",
        category: "Brainstorming",
        usage: "Business",
        content: "Generate ideas for the [ topic ]."
    },
    {
        id: 'refine-text',
        title: "Refine text",
        category: "Document Refinement",
        usage: "Communication",
        content: "Refine the text below or in the #Context section below to make it more concise and clear."
    },
    {
        id: 'expand-text',
        title: "Expand text",
        category: "Document Refinement",
        usage: "Communication",
        content: "Expand the text below or in the #Context section below to add more detail and depth."
    },
    {
        id: 'domain-definition',
        title: "Domain Definition",
        category: "Domain Definition / Business / Analysis / Plan",
        usage: "Domain Definition",
        content: `Help me make a comprehensive definition and scope of the domain:
Name: [ Insert concise and specific name ] 
Description: [ Description of the domain. ]
Include context if available in the #Context section below.

Include the following sections:
    Domain name: concise and specific name 
    Domain description: brief overview of the domain's purpose and scope.
    Domain definition:
    In-scope include elements if you think they are relevant.
    Out-of-scope elements if you think they are relevant.
    Key Processes and Workflows
    Describe the main processes and workflows within the domain.
    Key Entities and Relationships
    Identify the primary entities (e.g., customers, products, services) and their relationships.
    Key Domain Concepts and Terms
    Primary objectives
    Identify and categorize stakeholders by their roles or involvement
    Current limitations and Boundaries
    Outline existing constraints, limitations, and boundaries (technical, organizational, financial, regulatory, or operational)
    Success criteria 
    Define clear, measurable, and achievable indicators of success
`
    },
    {
        id: 'task-list',
        title: "Task List",
        category: "Task Management / Plan",
        usage: "Planning",
        content: "Create a task list for the topic described below or in the context."
    },
    {
        id: 'project-plan',
        title: "Project Plan",
        category: "Planning / Project Management / Business",
        usage: "Planning",
        content: `
Create a comprehensive project plan for the project described in the context below.
Follow this detailed template:

---
title: "Generic Project Plan Template"
author: "Project Owner"
version: "1.0"
date: "YYYY-MM-DD"
---

# **Project Plan Template**

---

## **1. Summary of the Domain/Topic**

Provide a concise overview of the domain or topic area.
Describe the purpose, context, and importance of the project within this domain.
Identify the challenges, current gaps, and opportunities for improvement or innovation.

---

## **2. Project Overview and Scope**

### **2.1 Project Objectives (SMART)**

| Objective | Specific | Measurable | Achievable | Relevant | Time-bound |
|------------|-----------|-------------|-------------|------------|-------------|
| **O1** | Clearly define the objective and its scope | Define measurable indicators or metrics | Verify that it is realistically achievable | Explain how it supports the domain or organization’s goals | Assign a completion timeline |
| **O2** |  |  |  |  |  |
| **O3** |  |  |  |  |  |

---

### **2.2 Project Scope**

**In Scope:**
- Define what is included in the project focus.
- Identify systems, processes, or components to be developed or modeled.
- Specify outputs and deliverables.

**Out of Scope:**
- List items explicitly excluded from the project.
- Clarify dependencies, limitations, and assumptions.

---

### **2.3 Overall Processes and Methodologies**

| Category | Methodology |
|-----------|--------------|
| **Process Modeling** | POPS (Process-Organization-Product-Service) |
| **Workspace Modeling** | IRTV (Information-Roles-Tasks-Views) |
| **Metamodeling** | TYPE (EntityTypes-Properties-RelationshipTypes) |
| **Instance Modeling** | ORIM (Objects-Relationships-Instances-States) |
| **Specification** | Spec-Kit or structured requirement templates |
| **Implementation planning** | Architectural design and technology stack selection |
| **Implementation** | Code Generation** | AI-assisted or rule-based generation |
| **Quality Assurance** | Verification, validation, and model consistency checks |

---

### **2.4 Project Phases**

#### **Initiation**
Based on the Domain Definition, define the project scope and objectives (SMART).
create the Project Charter and identify stakeholders.
- [ ] Define the problem statement and expected outcomes
- [ ] Identify key stakeholders and domain experts
- [ ] Approve project charter and funding

#### **Planning**
1. Define Processes and Workspaces
- [ ] Define Process and Sub-process Modeling (POPS)
- [ ] Define Workspace Modeling (IRTV) for each process
2. Develop Metamodels and Instance Models
- [ ] Conduct Detailed Metamodeling (TYPE)
- [ ] Develop Object Relationship Instance Models (ORIM)
3. Prepare Specifications and Implementation Plans
- [ ] Generate Specification Kit (Spec-Kit)
- [ ] Plan Implementation Architecture

#### **Implementation**
- [ ] Implement AI-assisted Code Generation
- [ ] Prepare Testing and QA procedures
- [ ] Deploy initial working prototype or final product

#### **Testing**
- [ ] Conduct Verification and Validation
- [ ] Perform User Acceptance Testing (UAT)
- [ ] Finalize QA reports and documentation

#### **Evaluation**
- [ ] Validate project outcomes against SMART objectives
- [ ] Conduct performance and quality review
- [ ] Gather stakeholder feedback
- [ ] Document lessons learned and improvement opportunities

---

### **Deliverables for Each Phase**

| Phase | Deliverables |
|--------|---------------|
| **Initiation** | Project Charter, Stakeholder Register, Success Criteria |
| **Planning** | POPS, IRTV, TYPE, ORIM models; Specification documents |
| **Implementation** | Deployed system, generated scripts, functional components |
| **Testing** | QA Reports, Verification Logs |
| **Evaluation** | Final Report, Improvement Recommendations |

---

### **Milestones and Timelines**

| Milestone | Target Date | Deliverable |
|------------|--------------|--------------|
| Project Charter Approved | YYYY-MM-DD | Charter Document |
| Metamodel Completed | YYYY-MM-DD | TYPE and ORIM models |
| Implementation Complete | YYYY-MM-DD | Functional Prototype |
| Testing & QA Complete | YYYY-MM-DD | QA Reports |
| Project Evaluation Complete | YYYY-MM-DD | Final Report |

---

## **4. Timeline (Phases and Milestones as Mermaid Diagram)**

## Example
\`\`\`mermaid
gantt
    title Generic Project Timeline
    dateFormat  YYYY-MM-DD
    section Initiation
    Project Charter Approval      : done, a1, 2025-01-01, 2025-01-15
    Stakeholder Identification    : active, a2, 2025-01-16, 2025-01-30
    section Planning
    Process & Workspace Modeling  : a3, 2025-02-01, 2025-03-15
    Metamodel Development         : a4, 2025-03-16, 2025-04-10
    Specification Preparation     : a5, 2025-04-11, 2025-05-15
    section Implementation
    Code Generation & Testing     : a6, 2025-05-16, 2025-06-15
    Deployment & Training         : a7, 2025-06-16, 2025-07-01
    section Evaluation
    Final Review & Reporting      : a8, 2025-07-02, 2025-07-15
\`\`\`

---

## **3. Key Stakeholders**

| Role | Name / Group | Responsibility |
|------|----------------|----------------|
| Project Sponsor |  | Strategic oversight and funding |
| Project Manager |  | Coordination, scheduling, reporting |
| Domain Expert |  | Subject matter knowledge |
| Model Architect |  | POPS-IRTV-TYPE-ORIM design |
| Developer |  | AI Code implementation and automation |
| QA Lead |  | Verification and validation |
| End Users |  | Acceptance testing and feedback |

---
`
    },
    {
        id: 'product-roadmap',
        title: "Product Roadmap",
        category: "Planning",
        usage: "Planning",
        content:
            `Create a product roadmap for the product described in the context below.:
[Insert start date]
Include the following sections:
1. Header
2. Time Horizon [Insert time horizon]
3. Product Vision [Insert product vision]
3. Strategic Themes & Objectives
4. Initiatives & Epics
    For each Theme, list major initiatives or epics that span multiple months.
5. Features & Milestones (Monthly View)
    Detail each feature per month, with milestone dates.
6. Dependencies & Risks
7. Stakeholders & Owners
`
    },
    {
        id: 'swot-analysis',
        title: "SWOT Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a SWOT analysis for the topic described in the context below."
    },
    {
        id: 'meeting-agenda',
        title: "Meeting Agenda",
        category: "Meetings",
        usage: "Meetings",
        content: `Create an agenda for the meeting on the topic described below.
Include the following sections:
    1. Meeting Title [Insert title]
    2. Date and Time [Insert date and time]
    3. Location [Insert location]
    4. Attendees [Insert list of attendees]
    5. Agenda Items [Insert list of agenda items]
    6. Discussion Points [Insert list of discussion points]
    7. Action Items [Insert list of action items]
    8. Notes [Insert any additional notes]
    9. Conclusion [Insert conclusion]
    10. Follow-up [Insert follow-up items]
    11. Additional Notes 
        - Resources [Insert any resources or materials needed for the meeting]
        - Contact Information [Insert contact information for the meeting organizer]
`
    },
    {
        id: 'meeting-summary',
        title: "Meeting Summary",
        category: "Meetings",
        usage: "Meetings",
        content: "Summarize the following meeting notes:\n"
    },
    {
        id: 'meeting-notes',
        title: "Meeting Notes",
        category: "Meetings",
        usage: "Meetings",
        content: "Create meeting notes for the following meeting:\n"
    },
    {
        id: 'content-outline',
        title: "Content Outline",
        category: "Content Creation",
        usage: "Business",
        content: "Create an outline for the following text:\n"
    },
    {
        id: 'presentation-slides',
        title: "Presentation Slides",
        category: "Content Creation",
        usage: "Communication",
        content: "Create a slide deck for the following text:\n"
    },
    {
        id: 'blog-post',
        title: "Blog Post",
        category: "Content Creation",
        usage: "Communication",
        content:
            `Write a short blog post about the topic in the domain/topic described below.
Include the following sections:
1. Introduction
2. Key Concepts
3. Applications
4. Challenges
5. Future Trends
6. Conclusion
7. References
8. Glossary of Terms
9. Acknowledgments
10. Additional Notes
11. Call to Action
12. Author Bio
# Topic:
[Insert topic]
`
    },
    {
        id: 'marketing-strategy',
        title: "Marketing Strategy",
        category: "Marketing",
        usage: "Marketing",
        content: "Outline a marketing strategy for the following product:\n"
    },
    {
        id: 'press-release',
        title: "Press Release",
        category: "Marketing",
        usage: "Marketing",
        content: "Draft a press release for the following event:\n"
    },
    {
        id: 'user-persona',
        title: "User Persona",
        category: "User Research",
        usage: "Business",
        content: "Create a user persona for the user experience described in the context below."
    },
    {
        id: 'user-journey-map',
        title: "User Journey Map",
        category: "User Research",
        usage: "Business",
        content: "Create a user journey map for the user experience described in the context below."
    },
    {
        id: 'competitive-analysis',
        title: "Competitive Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a competitive analysis for the market described in the context below."
    },
    {
        id: 'customer-feedback',
        title: "Customer Feedback",
        category: "Feedback",
        usage: "Communication",
        content: "Summarize the following customer feedback:\n"
    },
    {
        id: 'email-response',
        title: "Email Response",
        category: "Communication",
        usage: "Communication",
        content: "Draft a response to the following email:\n"
    },
    {
        id: 'email-draft',
        title: "Email Draft",
        category: "Communication",
        usage: "Communication",
        content: "Draft a professional email for the following purpose:\n"
    },
    {
        id: 'research-summary',
        title: "Research Summary",
        category: "Summarization",
        usage: "Business",
        content: "Summarize the following research findings:\n"
    },
    {
        id: 'research-paper',
        title: "Research Paper",
        category: "Research",
        usage: "Business",
        content: "Suggesta research paper on the following topic:\n"
    },
    {
        id: 'feedback-request',
        title: "Feedback Request",
        category: "Feedback",
        usage: "Business",
        content: "Request feedback on the topic described in the context below:\n"
    },
    {
        id: 'user-guide',
        title: "User Guide",
        category: "Documentation",
        usage: "Business",
        content: "Create a user guide for the following product:\n"
    },
    {
        id: 'faq-section',
        title: "FAQ Section",
        category: "Documentation",
        usage: "Business",
        content: "Create a FAQ section for the following product:\n"
    },
    {
        id: 'case-study',
        title: "Case Study",
        category: "Case Studies",
        usage: "Business",
        content: "Create a case study for the following project:\n"
    },
    {
        id: 'business-proposal',
        title: "Business Proposal",
        category: "Proposals",
        usage: "Business",
        content: "Draft a business proposal for the following project:\n"
    },
    {
        id: 'grant-application',
        title: "Grant Application",
        category: "Proposals",
        usage: "Business",
        content: "Draft a grant application for the following project:\n"
    },
    {
        id: 'proposal-outline',
        title: "Proposal Outline",
        category: "Proposals",
        usage: "Business",
        content: "Create an outline for a proposal on the following topic:\n"
    },

    {
        id: 'code-review',
        title: "Code Review",
        category: "Code Review",
        usage: "Business",
        content: "Please review the following code and provide feedback:\n"
    },
    {
        id: 'plan-a-walk',
        title: "Plan a walk",
        category: "Exercise",
        usage: "Personal",
        content: `Plan a walk with the following context:
1. Location: [Insert location]
2. Distance: [Insert distance]
3. Duration: [Insert duration]
4. Time of day: [Insert time of day]
5. Landmarks: [Insert landmarks]
6. Include a list of interesting places to visit along the way.
Make the walk fun and engaging, choosing the shortest continuous route possible.
Include a map link to nearby locations, and complete route.
Make sure its only local routes, not long-distance travel or car and public transport.
Output all map links as raw HTML anchor tags, for example:
<a className="text-blue-500" href="https://maps.google.com/?q=Oslo" target="_blank" rel="noopener noreferrer">View on Google Maps</a>
Ensure every link uses target="_blank".
Do not include long-distance travel by car or public transport.
Make sure Only walking routes are shown in the map.
`
    },
    {
        id: 'social-media-post',
        title: "Social Media Post",
        category: "Content Creation",
        usage: "Communication",
        content: "Create a social media post for the topic described below:\n\n"
    },
    {
        id: 'learning-plan',
        title: "Learning Plan",
        category: "Learning",
        usage: "Business / Personal",
        content: "Create a learning plan for the topic described in the context below."
    },
    {
        id: 'task-list-personal',
        title: "Task List",
        category: "Task Management",
        usage: "Personal",
        content: "Create a task list for the topic described in the context below."
    },
    {
        id: 'email-draft-personal',
        title: "Email Draft",
        category: "Communication",
        usage: "Personal",
        content: "Draft a professional email for the following purpose:\n"
    },
    {
        id: 'meal-planning',
        title: "Meal Planning",
        category: "Health & Wellness",
        usage: "Personal",
        content: `Create a meal plan based on the following information:
1. Number of days: [Insert number of days]
2. Dietary preferences/restrictions: [Insert preferences/restrictions]
3. Calories per day (optional): [Insert calorie target]
4. Cooking skill level: [Insert skill level]
5. Available time for meal prep: [Insert available time]

Include:
- Breakfast, lunch, dinner for each day
- A shopping list organized by grocery department
- Brief preparation instructions for each meal
- Nutritional highlights where relevant
`
    },
    {
        id: 'travel-itinerary',
        title: "Travel Itinerary",
        category: "Travel",
        usage: "Business / Personal",
        content: `Create a detailed travel itinerary based on:
1. Destination: [Insert destination]
2. Duration: [Insert number of days]
3. Travel dates: [Insert dates]
4. Interests: [Insert interests/preferences]
5. Budget level: [Insert budget level]

Include:
- Day-by-day schedule with activities and sightseeing
- Recommended accommodations
- Transportation options between locations
- Estimated costs for major expenses
- Local customs or tips to be aware of
- Weather considerations
- Must-see attractions and hidden gems
`
    },
    {
        id: 'workout-routine',
        title: "Workout Routine",
        category: "Health & Wellness",
        usage: "Personal",
        content: `Design a workout routine based on:
1. Fitness goal: [Insert goal]
2. Available equipment: [Insert available equipment]
3. Fitness level: [Insert beginner/intermediate/advanced]
4. Time per session: [Insert minutes]
5. Days per week: [Insert number of days]
6. Any injuries/limitations: [Insert limitations if any]

Include:
- Specific exercises with sets and reps
- Rest periods
- Warm-up and cool-down recommendations
- Progression plan for 4 weeks
- Tips for proper form
`
    },
    {
        id: 'budget-plan',
        title: "Budget Plan",
        category: "Finance",
        usage: "Planning / Personal",
        content: `Create a personal budget plan based on:
1. Monthly income: [Insert income]
2. Fixed expenses: [Insert major fixed expenses]
3. Financial goals: [Insert short and long-term goals]
4. Debt obligations: [Insert any debt payments]
5. Savings targets: [Insert savings goals]

Include:
- Expense categories with recommended allocations
- Savings strategy
- Debt repayment plan (if applicable)
- Discretionary spending guidelines
- Tips for tracking expenses
- Potential areas for cost reduction
`
    },
    {
        id: 'habit-tracker',
        title: "Habit Tracker",
        category: "Personal Development",
        usage: "Personal",
        content: `Create a habit tracking system for:
1. Habits to develop: [Insert habits]
2. Current consistency: [Insert current status]
3. Timeline for achievement: [Insert timeline]
4. Motivation factors: [Insert motivations]
5. Potential obstacles: [Insert challenges]

Include:
- Daily/weekly tracking template
- Milestone rewards system
- Strategies to overcome common obstacles
- Scientific background on habit formation
- Accountability methods
- Visual progress tracking suggestions
`
    },
    {
        id: 'book-recommendations',
        title: "Book Recommendations",
        category: "Learning",
        usage: "Personal",
        content: `Recommend books based on:
1. Interests/Topics: [Insert interests]
2. Favorite genres: [Insert genres]
3. Previously enjoyed books: [Insert books]
4. Reading level preference: [Insert preference]
5. Purpose (entertainment, learning, etc.): [Insert purpose]

Include:
- 5-8 book recommendations with brief descriptions
- Why each book matches the preferences
- Reading order suggestion if applicable
- Estimated time investment
- Key themes or takeaways
`
    },
    {
        id: 'gift-ideas',
        title: "Gift Ideas",
        category: "Shopping",
        usage: "Personal",
        content: `Suggest gift ideas based on:
1. Recipient's relationship to you: [Insert relationship]
2. Recipient's interests/hobbies: [Insert interests]
3. Occasion: [Insert occasion]
4. Budget range: [Insert budget]
5. Gift-giving history: [Insert previous gifts]

Include:
- 8-10 specific gift suggestions across different categories
- Price estimates for each item
- Where to purchase each item
- Personalization ideas
- Presentation/wrapping suggestions
`
    }
];

// Export a sanitized copy so any consumer (MarkdownPreview or other renderers) gets compacted spacing
export const PROMPT_TEMPLATES: PromptTemplate[] = RAW_PROMPT_TEMPLATES.map(t => ({
    ...t,
    content: normalizeTemplateContent(t.content)
}));