# Tutorial: Creating Your First Prompt

This step-by-step tutorial will guide you through creating, customizing, and executing your first prompt in the RAG Prompt Library.

## What You'll Learn

- How to create a new prompt from scratch
- How to use variables for dynamic content
- How to organize prompts with categories and tags
- How to execute prompts and interpret results
- Best practices for prompt writing

## Prerequisites

- Active RAG Prompt Library account
- Basic understanding of AI prompts
- 10-15 minutes of time

## Step 1: Access the Prompt Creator

1. **Login** to your RAG Prompt Library account
2. **Navigate** to the main dashboard
3. **Click** on "Prompts" in the left sidebar
4. **Click** the "New Prompt" button (+ icon)

You should now see the Prompt Editor interface.

## Step 2: Basic Prompt Information

Let's create a prompt for generating social media posts:

### Title and Description
```
Title: Social Media Post Generator
Description: Creates engaging social media posts for various platforms and topics
```

### Category and Tags
```
Category: Marketing
Tags: social-media, content-creation, marketing, engagement
```

**Why this matters**: Good organization helps you find and reuse prompts later.

## Step 3: Writing the Prompt Content

### Basic Prompt Structure

In the content area, enter:

```
Create an engaging social media post about {{topic}} for {{platform}}.

Requirements:
- Target audience: {{audience}}
- Tone: {{tone}}
- Include relevant hashtags
- Keep within character limits for the platform
- Make it shareable and engaging

Additional context: {{context}}
```

### Understanding Variables

Variables use the `{{variable_name}}` syntax and allow you to:
- Reuse the same prompt with different inputs
- Create flexible, adaptable prompts
- Save time by not rewriting similar prompts

## Step 4: Configure Prompt Settings

### Variables Configuration

Define your variables in the Variables section:

```
Variable Name: topic
Type: Text
Required: Yes
Description: The main topic or subject of the post
Example: "sustainable fashion"

Variable Name: platform
Type: Select
Options: Twitter, LinkedIn, Instagram, Facebook, TikTok
Required: Yes
Description: Target social media platform

Variable Name: audience
Type: Text
Required: Yes
Description: Target audience description
Example: "young professionals interested in sustainability"

Variable Name: tone
Type: Select
Options: Professional, Casual, Humorous, Inspirational, Educational
Required: Yes
Description: Desired tone of voice

Variable Name: context
Type: Textarea
Required: No
Description: Additional context or specific requirements
```

### Advanced Settings

```
Model: GPT-4 (recommended for creative content)
Max Tokens: 500
Temperature: 0.7 (for creative but controlled output)
Visibility: Private (change to Public to share with community)
```

## Step 5: Save and Test Your Prompt

1. **Click** "Save Prompt" to store your creation
2. **Click** "Test Prompt" to try it out

### Test Execution

Fill in the test values:
```
Topic: "remote work productivity"
Platform: "LinkedIn"
Audience: "working professionals and managers"
Tone: "Professional"
Context: "Focus on practical tips that can be implemented immediately"
```

**Click** "Execute" and wait for the AI response.

## Step 6: Review and Refine

### Expected Output Example

```
🚀 Boost Your Remote Work Productivity Today!

Working from home doesn't have to mean working less efficiently. Here are 3 game-changing tips that successful remote professionals swear by:

✅ Time-block your calendar - Dedicate specific hours to deep work
✅ Create a dedicated workspace - Even if it's just a corner of your room
✅ Use the 2-minute rule - If it takes less than 2 minutes, do it now

The key is consistency, not perfection. Start with one tip and build from there.

What's your #1 remote work productivity hack? Share below! 👇

#RemoteWork #Productivity #WorkFromHome #ProfessionalDevelopment #TimeManagement
```

### Refinement Tips

If the output isn't quite right:

1. **Adjust the prompt**: Add more specific instructions
2. **Modify variables**: Provide better examples or constraints
3. **Change model settings**: Adjust temperature for more/less creativity
4. **Add context**: Include more background information

## Step 7: Advanced Features

### Adding Document Context

1. **Upload a document** with relevant information
2. **Reference it in your prompt**:
   ```
   Based on the information in the uploaded document about {{topic}}, 
   create a social media post for {{platform}}...
   ```

### Using Conditional Logic

```
Create a social media post about {{topic}} for {{platform}}.

{{#if platform == "Twitter"}}
Keep it under 280 characters and use 2-3 hashtags.
{{/if}}

{{#if platform == "LinkedIn"}}
Write a professional post with 3-5 paragraphs and include a call-to-action.
{{/if}}

{{#if platform == "Instagram"}}
Focus on visual storytelling and use 5-10 relevant hashtags.
{{/if}}
```

### Version Control

- **Save versions** as you refine your prompt
- **Compare versions** to see what works best
- **Revert** to previous versions if needed

## Step 8: Organize and Share

### Creating Collections

1. **Group related prompts** into collections
2. **Create themed collections** (e.g., "Marketing Prompts", "Content Creation")
3. **Share collections** with team members

### Making Prompts Public

1. **Change visibility** to "Public" in prompt settings
2. **Add detailed description** for community users
3. **Include usage examples** and tips

## Best Practices Learned

### ✅ Do's

- **Be specific** in your instructions
- **Use clear variable names** that explain their purpose
- **Provide examples** in variable descriptions
- **Test thoroughly** with different inputs
- **Iterate and improve** based on results
- **Document your prompts** with good descriptions

### ❌ Don'ts

- **Don't make prompts too complex** - break them into smaller parts
- **Don't use vague variables** - be specific about what you want
- **Don't forget to test** - always verify your prompts work
- **Don't ignore model limitations** - understand token limits
- **Don't share sensitive information** in public prompts

## Next Steps

Now that you've created your first prompt:

1. **Create more prompts** for different use cases
2. **Explore templates** for inspiration
3. **Join the community** to share and discover prompts
4. **Learn about automation** and API integration
5. **Set up team collaboration** if working with others

## Troubleshooting

### Common Issues

**Variables not working**
- Check syntax: `{{variable_name}}`
- Ensure variables are defined in settings
- Verify variable names match exactly

**Poor output quality**
- Add more specific instructions
- Provide better context
- Adjust model temperature
- Try different models

**Prompt too long**
- Break into smaller prompts
- Use document context instead
- Simplify instructions
- Remove unnecessary details

**Execution errors**
- Check API key configuration
- Verify model availability
- Ensure sufficient credits
- Check internet connection

## Additional Resources

- [Advanced Prompt Techniques](advanced-prompting.md)
- [Working with Documents](document-integration.md)
- [Team Collaboration Guide](team-collaboration.md)
- [API Integration Tutorial](api-integration.md)
- [Community Best Practices](community-guidelines.md)

## Feedback and Support

- **Rate this tutorial** to help us improve
- **Share your prompts** with the community
- **Contact support** if you need help
- **Join our Discord** for real-time assistance

---

**Congratulations!** 🎉 You've successfully created your first prompt. Ready to explore more advanced features? [Check out our advanced tutorials →](advanced-prompting.md)
