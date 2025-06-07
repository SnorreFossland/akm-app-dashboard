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
        title: "Brainstorming Ideas",
        category: "Brainstorming",
        usage: "Business",
        content: "Generate ideas for the topic described in the context below"
    },
    {
        title: "Domain Definition",
        category: "Domain Definition",
        usage: "Business",
        content: `Help me define and scope the domain described in the context below.
Use the following format:
Domain name:** [Insert concise and specific name] **
Domain description:** [Provide a clear, concise summary (2-3 sentences) of the domain.] **
Domain definition:
In-scope: include this list: [List elements, activities, or areas included within the domain] but you can also add elements if you think they are relevant.
Out-of-scope: [Clearly specify what aspects are explicitly excluded from the domain.]
Key Domain Concepts and Terms
Primary objectives
Identify and categorize stakeholders by their roles or involvement
Current limitations and Boundaries
Outline existing constraints, limitations, and boundaries (technical, organizational, financial, regulatory, or operational)
Success criteria 
Define clear, measurable, and achievable indicators of success
`
    },
    { title: "Task List", category: "Task Management", usage: "Business", content: "Create a task list for the topic described in the context below." },
    {
        title: "Project Plan", category: "Planning", usage: "Business", content:
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
    {
        title: "Product Roadmap",
        category: "Planning",
        usage: "Business",
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
        title: "SWOT Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a SWOT analysis for the topic described in the context below."
    },
    {
        title: "Meeting Agenda",
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
    {
        title: "Meeting Summary",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting notes:\n"
    },
    {
        title: "Meeting Notes",
        category: "Meetings",
        usage: "Business",
        content: "Summarize the following meeting notes into key points:\n"
    },
    {
        title: "Content Outline",
        category: "Content Creation",
        usage: "Business",
        content: "Create an outline for the following text:\n"
    },
    {
        title: "Presentation Slides",
        category: "Content Creation",
        usage: "Business",
        content: "Create a slide deck for the following text:\n"
    },
    {
        title: "Blog Post",
        category: "Content Creation",
        usage: "Business",
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
        title: "Marketing Strategy",
        category: "Marketing",
        usage: "Business",
        content: "Outline a marketing strategy for the following product:\n"
    },
    {
        title: "Press Release",
        category: "Marketing",
        usage: "Business",
        content: "Draft a press release for the following event:\n"
    },
    {
        title: "User Persona",
        category: "User Research",
        usage: "Business",
        content: "Create a user persona for the user experience described in the context below."
    },
    {
        title: "User Journey Map",
        category: "User Research",
        usage: "Business",
        content: "Create a user journey map for the user experience described in the context below."
    },
    {
        title: "Competitive Analysis",
        category: "Analysis",
        usage: "Business",
        content: "Conduct a competitive analysis for the market described in the context below."
    },
    {
        title: "Customer Feedback",
        category: "Feedback",
        usage: "Business",
        content: "Summarize the following customer feedback:\n"
    },
    {
        title: "Email Response",
        category: "Communication",
        usage: "Business",
        content: "Draft a response to the following email:\n"
    },
    {
        title: "Email Draft",
        category: "Communication",
        usage: "Business",
        content: "Draft a professional email for the following purpose:\n"
    },
    {
        title: "Research Summary",
        category: "Summarization",
        usage: "Business",
        content: "Summarize the following research findings:\n"
    },
    {
        title: "Feedback Request",
        category: "Feedback",
        usage: "Business",
        content: "Request feedback on the topic described in the context below:\n"
    },
    {
        title: "User Guide",
        category: "Documentation",
        usage: "Business",
        content: "Create a user guide for the following product:\n"
    },
    {
        title: "FAQ Section",
        category: "Documentation",
        usage: "Business",
        content: "Create a FAQ section for the following product:\n"
    },
    {
        title: "Case Study",
        category: "Case Studies",
        usage: "Business",
        content: "Create a case study for the following project:\n"
    },
    {
        title: "Business Proposal",
        category: "Proposals",
        usage: "Business",
        content: "Draft a business proposal for the following project:\n"
    },
    {
        title: "Grant Application",
        category: "Proposals",
        usage: "Business",
        content: "Draft a grant application for the following project:\n"
    },
    {
        title: "Proposal Outline",
        category: "Proposals",
        usage: "Business",
        content: "Create an outline for a proposal on the following topic:\n"
    },
    {
        title: "Research Paper",
        category: "Research",
        usage: "Business",
        content: "Outline a research paper on the following topic:\n"
    },
    {
        title: "Code Review",
        category: "Code Review",
        usage: "Business",
        content: "Please review the following code and provide feedback:\n"
    },
    {
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
        title: "Social Media Post",
        category: "Content Creation",
        usage: "Personal",
        content: "Create a social media post for the topic described below:\n\n"
    },
    {
        title: "Learning Plan",
        category: "Learning",
        usage: "Personal",
        content: "Create a learning plan for the topic described in the context below."
    },
    { title: "Task List", category: "Task Management", usage: "Personal", content: "Create a task list for the topic described in the context below." },
    {
        title: "Email Draft",
        category: "Communication",
        usage: "Personal",
        content: "Draft a professional email for the following purpose:\n"
    },
    {
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
        title: "Travel Itinerary",
        category: "Travel",
        usage: "Personal",
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
        title: "Budget Plan",
        category: "Finance",
        usage: "Personal",
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