// Define the template interface
export interface PromptTemplate {
    title: string;
    category: string;
    usage: "Personal" | "Business" | string;
    content: string;
}

// Export the templates array
export const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        title: "Domain",
        category: "Planning",
        usage: "Business",
        content:
            `**[Insert your definition of the domain/topic here]**
Help me define and scope the following domain/topic above.
Domain Identification:**[Insert concise and specific name, Provide a clear, concise summary (2-3 sentences) that captures the essence and significance of the domain.]**
Domain scope:**[Explicitly list the elements, activities, or areas included within the domain and Clearly specify what aspects are explicitly excluded from the domain.]**
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
        title: "Domain/Topic",
        category: "Domain Definition",
        usage: "Business / Personal",
        content: `Help me define describe and scope the following domain/topic:
**[Insert your definition of the domain/topic here]**
`
    },
    { category: "Brainstorming", title: "Brainstorming Ideas", usage: "Personal", content: "Generate ideas for the following topic:\n\n**[Describe topic here]**" },
    {
        title: "Project Plan",
        category: "Planning",
        usage: "Business",
        content:
            `Make a project plan for the following project:
**[Describe project here]**
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
10. Communication Plan
11. Evaluation and Reporting
12. Conclusion
13. Appendix
14. References
15. Glossary of Terms
16. Acknowledgments
17. Additional Notes
`
    },
    {
        title: "Product Roadmap",
        category: "Planning",
        usage: "Business",
        content:
            `Create a product roadmap for the following product:
**[Describe product here]**
Include the following sections:
1. Product Vision
2. Goals and Objectives
3. Target Audience
4. Key Features
5. Timeline (phases and milestones as Mermaid diagram)
6. Milestones
7. Dependencies
8. Risks and Mitigation Strategies
9. Success Metrics
10. Communication Plan
11. Evaluation and Reporting
12. Conclusion
13. Appendix
14. References
15. Glossary of Terms
16. Acknowledgments
17. Additional Notes
            ` },
    {
        title: "Learning Plan",
        category: "Learning",
        usage: "Personal",
        content: "Create a learning plan for the following topic:\n\n**[Describe topic here]**\n\n Add a mermaid gantt diagram."
    },
    {
        title: "Feedback Request",
        category: "Feedback",
        usage: "Business",
        content: "Request feedback on the following topic:\n\n**[Describe topic here]**"
    },
    {
        title: "Task List",
        category: "Task Management",
        usage: "Personal",
        content: "Create a task list for the following project:\n\n**[Describe project here]**"
    },
    {
        title: "Meeting Agenda",
        category: "Meetings",
        usage: "Business",
        content: "Create an agenda for the following meeting:\n\n**[Describe meeting here]**"
    },
    {
        title: "Meeting Summary",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting:\n\n**[Describe meeting here]**"
    },
    {
        title: "Meeting Notes",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting notes into key points:\n\n**[Paste meeting notes here]**"
    },
    {
        title: "Content Outline",
        category: "Content Creation",
        usage: "Business",
        content: "Create an outline for the following content:\n\n**[Describe content here]**"
    },
    {
        title: "Presentation Slides",
        category: "Content Creation",
        usage: "Business",
        content: "Create a slide deck for the following topic:\n\n**[Describe topic here]**"
    },
    {
        title: "Social Media Post",
        category: "Content Creation",
        usage: "Personal",
        content: "Create a social media post for the following topic:\n\n**[Describe topic here]**"
    },
    {
        title: "Blog Post",
        category: "Content Creation",
        usage: "Personal",
        content: "Write a blog post about the topic in the #context: \n\n Include a title, introduction, body, and conclusion.\n\n"
    },
    {
        title: "Marketing Strategy",
        category: "Marketing",
        usage: "Business",
        content: "Outline a marketing strategy for the following product:\n\n**[Describe product here]**"
    },
    {
        title: "Press Release",
        category: "Marketing",
        usage: "Business",
        content: "Draft a press release for the following event:\n\n**[Describe event here]**"
    },
    {
        title: "User Persona",
        category: "User Research",
        usage: "Business",
        content: "Create a user persona for the following target audience:\n\n**[Describe target audience here]**"
    },
    {
        title: "User Journey Map",
        category: "User Research",
        usage: "Business",
        content: "Create a user journey map for the following user experience:\n\n**[Describe user experience here]**"
    },
    {
        title: "SWOT Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a SWOT analysis for the following business:\n\n**[Describe business here]**"
    },
    {
        title: "Competitive Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a competitive analysis for the following market:\n\n**[Describe market here]**"
    },
    {
        title: "Customer Feedback",
        category: "Feedback",
        usage: "Business",
        content: "Summarize the following customer feedback:\n\n**[Paste customer feedback here]**"
    },
    {
        title: "Email Response",
        category: "Communication",
        usage: "Business",
        content: "Draft a response to the following email:\n\n**[Paste email here]**"
    },
    {
        title: "Email Draft",
        category: "Communication",
        usage: "Business",
        content: "Draft a professional email for the following purpose:\n\n**[Describe purpose here]**"
    },
    {
        title: "Research Summary",
        category: "Summarization",
        usage: "Business",
        content: "Summarize the following research findings:\n\n**[Paste research findings here]**"
    },
    {
        title: "Report Summary",
        category: "Summarization",
        usage: "Business",
        content: "Summarize the following report into a concise overview:\n\n**[Paste report content here]**"
    },
    {
        title: "Technical Documentation",
        category: "Documentation",
        usage: "Business",
        content: "Create technical documentation for the following software:\n\n**[Describe software here]**"
    },
    {
        title: "User Guide",
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
        title: "Domain/Topic",
        category: "Planning",
        usage: "Business",
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