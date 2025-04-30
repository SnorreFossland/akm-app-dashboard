// Define the template interface
export interface PromptTemplate {
    title: string;
    category: string;
    usage: "Personal" | "Business" | string;
    content: string;
}

// Export the templates array
export const PROMPT_TEMPLATES: PromptTemplate[] = [
    { title: "Brainstorming Ideas", category: "Brainstorming", usage: "Personal", content: "Generate ideas for the topic described in the context below" },
    {title: "Task List", category: "Task Management", usage: "Personal",content: "Create a task list for the topic described in the context below." },
    { title: "Project Plan", category: "Planning",usage: "Business", content:
`Make a project plan for a project within the domain/topic described in the context below.
Include the following sections:
1. Project Overview
2. Scope Domain
3. Key Stakeholders
4. Objectives
5. Timeline (phases and milestones as Mermaid diagram)
6. Resources
7. Risks and Mitigation Strategies
8. Success Criteria
9. Budget
10. Communication Plan (text plus Mermaid diagram)
11. Evaluation and Reporting

`
    },
    {title: "Product Roadmap", category: "Planning", usage: "Business",
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

    {title: "Learning Plan",
        category: "Learning",
        usage: "Personal",
        content: "Create a learning plan for the topic described in the context below."
    },

    {title: "Meeting Agenda",
        category: "Meetings",
        usage: "Business",
        content: `Create an agenda for the meeting on the topic described in the context below.
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
    {title: "Meeting Summary",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting:\n\n**[Describe meeting here]**"
    },
    { title: "Meeting Notes",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting notes into key points:\n\n**[Paste meeting notes here]**"
    },
    {title: "Content Outline",
        category: "Content Creation",
        usage: "Business",
        content: "Create an outline for the following content:\n\n**[Describe content here]**"
    },
    { title: "Presentation Slides",
        category: "Content Creation",
        usage: "Business",
        content: "Create a slide deck for the following topic:\n\n**[Describe topic here]**"
    },
    {title: "Social Media Post",
        category: "Content Creation",
        usage: "Personal",
        content: "Create a social media post for the topic described below."
    },
    {title: "Blog Post",
        category: "Content Creation",
        usage: "Personal",
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
`
    },
    {title: "Marketing Strategy",
        category: "Marketing",
        usage: "Business",
        content: "Outline a marketing strategy for the following product:\n\n**[Describe product here]**"
    },
    {title: "Press Release",
        category: "Marketing",
        usage: "Business",
        content: "Draft a press release for the following event:\n\n**[Describe event here]** about the topic in the domain/topic described in the context below."
    },
    {title: "User Persona",
        category: "User Research",
        usage: "Business",
        content: "Create a user persona for the target audience described in the context below."
    },
    {title: "User Journey Map",
        category: "User Research",
        usage: "Business",
        content: "Create a user journey map for the user experience described in the context below."
    },
    {title: "SWOT Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a SWOT analysis for the business described in the context below."
    },
    {title: "Competitive Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a competitive analysis for the market described in the context below."
    },
    {title: "Customer Feedback",
        category: "Feedback",
        usage: "Business",
        content: "Summarize the following customer feedback:\n\n**[Paste customer feedback here]**"
    },
    {title: "Email Response",
        category: "Communication",
        usage: "Business",
        content: "Draft a response to the following email:\n\n**[Paste email here]**"
    },
    {title: "Email Draft",
        category: "Communication",
        usage: "Business",
        content: "Draft a professional email for the following purpose:\n\n**[Describe purpose here]**"
    },
    {title: "Research Summary",
        category: "Summarization",
        usage: "Business",
        content: "Summarize the following research findings:\n\n**[Paste research findings here]**"
    },
    {title: "Feedback Request",
        category: "Feedback",
        usage: "Business",
        content: "Request feedback on the topic described in the context below."
    },
    {title: "User Guide",
        category: "Documentation",
        usage: "Business",
        content: "Create a user guide for the following product:\n\n**[Describe product here]**"
    },
    {
        title: "FAQ Section",
        category: "Documentation",
        usage: "Business",
        content: "Create a FAQ section for the following product:\n\n**[Describe product here]**"
    },
    {
        title: "Case Study",
        category: "Case Studies",
        usage: "Business",
        content: "Create a case study for the following project:\n\n**[Describe project here]**"
    },
    {
        title: "Business Proposal",
        category: "Proposals",
        usage: "Business",
        content: "Draft a business proposal for the following project:\n\n**[Describe project here]**"
    },
    {
        title: "Grant Application",
        category: "Proposals",
        usage: "Business",
        content: "Draft a grant application for the following project:\n\n**[Describe project here]**"
    },
    {
        title: "Proposal Outline",
        category: "Proposals",
        usage: "Business",
        content: "Create an outline for a proposal on the following topic:\n\n**[Describe topic here]**"
    },
    {
        title: "Research Paper",
        category: "Research",
        usage: "Business",
        content: "Outline a research paper on the following topic:\n\n**[Describe topic here]**"
    },
    {
        title: "Code Review",
        category: "Code Review",
        usage: "Business",
        content: "Please review the following code and provide feedback:\n\n**[Paste code here]**"
    },
    {
        title: "Custom",
        category: "Custom",
        usage: "Personal",
        content: ""
    },
    {
        title: "Plan a walk",
        category: "Exercise",
        usage: "Personal",
        content:
`
Plan a walk for the with focus on the context below.
Include:
1.  Location: [Insert location]
2.  Distance: [Insert distance]
3.  Duration: [Insert duration]
4.  Time of day: [Insert time of day]
5. Landmarks: [Insert any specific landmarks or points of interest]
Include  map search links to locations, trails, or routes
Make sure the links are clickable and works
Make the walk fun and engaging but as choose the shortest continous route possible
    `
    },
    {
        title: "Domain",
        category: "Planning",
        usage: "Business",
        content:
            `
Help me define and scope the domain/topic described in the context below.
Domain name:** [Insert concise and specific name] **
Domain description:** [Provide a clear, concise summary (2-3 sentences) of the domain.] **
Domain definition:
Domain scope: [List elements, activities, or areas included within the domain]
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
        title: "Plan a run",
        category: "Exercise",
        usage: "Personal",
        content:
`
Plan a run for the with focus on the context below.
Include:
1.  Location: [Insert location]
2.  Distance: [Insert distance]
3.  Duration: [Insert duration]
Include search map search links to locations, trails, or routes.
`
    },
    {
        title: "Domain/Topic3",
        category: "Domain Definition",
        usage: "Test",
        content: `Help me define describe and scope the domain/topic described in the context below.:
`
    },
    {
        title: "Domain/Topic2",
        category: "Planning",
        usage: "Test",
        content:
            `
Help me define and scope the following domain/topic:
Domain Identification:
	•	Domain Name: **[Insert concise and specific name]**
	•	Domain Description: **[Provide a clear, concise summary (2-3 sentences) that captures the essence and significance of the domain.]**
Domain scope: 
	•	In-Scope: **[Explicitly list the elements, activities, or areas included within the domain.]**
	•	Out-of-Scope: **[Clearly specify what aspects are explicitly excluded from the domain.]**
Key Domain Concepts and Terms
	•	Core Concepts: **[List critical concepts fundamental to understanding the domain.]**
	•	Relevant Keywords: **[Provide key terminologies, acronyms, and types relevant to the domain.]**
Primary objectives: **[Clearly define the main goals or outcomes this domain aims to achieve]**
Key stakeholders:
Identify and categorize stakeholders by their roles or involvement:
	•	Primary Stakeholders: **[Directly involved individuals or groups]**
	•	Secondary Stakeholders: **[Indirectly impacted individuals or groups]**
Current limitations and Boundaries:
Outline existing constraints, limitations, and boundaries (technical, organizational, financial, regulatory, or operational)
    •	Constraint/Boundary 1
	•	Constraint/Boundary 2
Success criteria: 
Define clear, measurable, and achievable indicators of success:
	•	**[Success Criterion 1]** (Measurable)
	•	**[Success Criterion 2]** (Measurable)
`
    }
];