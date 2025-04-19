[
  {
    role: 'system',
    content: 'You are a helpful assistant and expert with several year of experience in the topic given by the user.'
  },
  {
    role: 'assistant',
    content: "Please provide as detailed response as possible to the user's query."
  },
  {
    role: 'user',
    content: '# Role:\n' +
      '    You are an expert consultant specializing in the domain described in the **context**. \n' +
      '    Leverage your extensive knowledge to help comprehensively define and scope the domain in question clearly and precisely.\n' +
      '    If placeholders are present, please replace them with the most relevant information.\n' +
      '\n' +
      '    # Objective:\n' +
      '    Write a short blog post about the topic in the #context below:\n' +
      'The context is a domain/topic definition and scope.\n' +
      '\n' +
      '    # Instructions:\n' +
      '    1. Analyze the provided content to understand the context, objectives, and requirements.\n' +
      '    2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.\n' +
      '    3. Ensure the refined prompt is clear, concise, and actionable.\n' +
      '\n' +
      '    # Reasoning Steps:\n' +
      '    1. Identify the key elements of the content.\n' +
      '    2. Break down the content into manageable sections.\n' +
      '    3. Use the placeholders to guide the refinement process.\n' +
      '    4. Ensure the final output is coherent and follows a logical flow.\n' +
      '    5. Include specific instructions or guidelines for the AI to follow.\n' +
      '    6. Use Markdown formatting for the output.\n' +
      '    7. Make sure the Mermaid syntax is correct for any diagrams or visual representations.\n' +
      '\n' +
      '    # Output Format:\n' +
      '    Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.\n' +
      '\n' +
      "    For Mermaid diagrams, use today's date (2025-04-19) as the start date and follow this exact format:\n" +
      '\n' +
      '    # Example Gantt Chart:\n' +
      '\n' +
      '    ```mermaid\n' +
      '    gantt\n' +
      '        title Project Timeline\n' +
      '        dateFormat YYYY-MM-DD\n' +
      '        axisFormat %Y-%m-%d\n' +
      '        Start : milestone, 2025-04-19, 1d\n' +
      '        section Phase 1\n' +
      '        Task1 : 10d\n' +
      '        Task2 : 20d\n' +
      '        Task3 : 20d\n' +
      '    ```\n' +
      '\n' +
      '    # Context \n' +
      '    Write a short blog post about the topic in the #context below:\n' +
      'The context is a domain/topic definition and scope. You should use this to create a blog post that is informative and engaging.\n' +
      '\n' +
      '#Context:\n' +
	  ' ....................'
  
      '    # Final Instructions:\n' +
      '    If you include code snippets, wrap them in triple backticks and specify the language, e.g., ```javascript.\n' +
      '    For any diagrams, ensure you use proper markdown syntax with three backticks (not two).\n' +
      '    Only include diagrams in the response if they are specified of relevant to the content.\n' +
      '    Also ensure to use the correct syntax for the diagram type you are using (e.g., mermaid, flowchart, etc.).\n' +
      '    Do not wrap your entire response in triple backticks.'
  },
  { role: 'user', content: 'Retry with model: deepseek-chat' }
]