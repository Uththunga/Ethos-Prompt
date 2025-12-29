# Figma MCP Integration with Augment Code

This guide explains how to connect Figma's desktop app MCP server to Augment Code for seamless design-to-code workflows.

## Overview

The Figma Dev Mode MCP Server enables:
- **Generate code from selected frames**: Turn Figma designs into React, Vue, HTML, or other frameworks
- **Extract design context**: Pull variables, components, and layout data directly into your IDE
- **Code smarter with Code Connect**: Reuse your actual components for consistent generated code
- **Access design tokens**: Use Figma variables for colors, spacing, typography in your code

## Prerequisites

- Figma desktop app (latest version)
- Dev or Full seat on Professional, Organization, or Enterprise Figma plans
- VS Code with Augment Code extension
- The MCP server only works with Figma desktop app, not web version

## Setup Instructions

### Step 1: Enable Figma MCP Server

1. **Download and Update Figma Desktop App**
   - Install from [figma.com/downloads](https://www.figma.com/downloads/)
   - Update to the latest version

2. **Enable the MCP Server**
   - Open Figma desktop app
   - Create or open a Figma Design file
   - Click **Figma menu** (upper-left corner)
   - Under **Preferences**, select **"Enable Dev Mode MCP Server"**
   - Confirm the server is running at `http://127.0.0.1:3845/sse`

### Step 2: Configure in Augment Code

✅ **Already configured in this project!**

The Figma MCP server has been added to `.vscode/settings.json`:

```json
{
  "augment.advanced": {
    "mcpServers": [
      {
        "name": "figma-dev-mode",
        "transport": "sse",
        "url": "http://127.0.0.1:3845/sse"
      }
    ]
  }
}
```

### Step 3: Restart and Verify

1. **Restart VS Code** to load the new MCP configuration
2. **Keep Figma desktop app open** (server only runs while app is open)
3. **Verify connection** in Augment Agent conversations

## Usage Examples

### Generate Code from Figma Selection

1. **Select a frame or component in Figma**
2. **In Augment Agent, prompt:**
   ```
   Generate React code for my current Figma selection using Tailwind CSS
   ```

3. **Or copy a Figma link and prompt:**
   ```
   Generate Vue components for this Figma design: [paste Figma link]
   ```

### Extract Design Tokens

```
Get the color and spacing variables used in my Figma selection
```

```
List all design tokens from this Figma frame and create CSS custom properties
```

### Use with Code Connect

```
Generate code for my Figma selection using components from src/components/ui
```

```
Create React components that match this Figma design using our existing design system
```

## Available MCP Tools

- **`get_code`**: Generate code (default: React + Tailwind)
- **`get_variable_defs`**: Extract variables and styles
- **`get_code_connect_map`**: Map Figma nodes to code components
- **`get_image`**: Take screenshots for layout fidelity

## Best Practices

### Structure Your Figma Files

- **Use components** for reusable elements
- **Link components** via Code Connect
- **Use variables** for design tokens
- **Name layers semantically** (e.g., `CardContainer`, not `Group 5`)
- **Use Auto layout** for responsive behavior

### Write Effective Prompts

- Specify framework: "Generate iOS SwiftUI code"
- Reference your components: "Use src/components/ui components"
- Be specific about styling: "Use Chakra UI for this layout"
- Target specific files: "Add this to src/components/marketing/PricingCard.tsx"

### Break Down Large Selections

- Generate code for smaller sections or individual components
- If responses are slow or incomplete, reduce selection size
- Focus on logical chunks (Card, Header, Sidebar)

## Troubleshooting

### Connection Issues

- Ensure Figma desktop app is open and running
- Verify MCP server is enabled in Figma preferences
- Restart VS Code after configuration changes
- Check that server is running on `http://127.0.0.1:3845/sse`

### No Tools Available

- Restart both Figma desktop app and VS Code
- Verify the MCP server configuration in settings.json
- Check Augment Agent panel for MCP server status

### Poor Code Quality

- Structure Figma files with components and variables
- Use semantic layer names
- Set up Code Connect for component mapping
- Write more specific prompts with framework and styling preferences

## Advanced Configuration

### Custom Rules for Consistent Output

Add project-specific rules to guide code generation:

```markdown
# Figma MCP Rules
- Always use components from `/src/components/ui` when possible
- Prioritize Figma fidelity to match designs exactly
- Use design tokens from Figma variables
- Follow WCAG accessibility requirements
- Place UI components in design system folder
```

### Enable Image Extraction

In Figma preferences:
- Go to **Dev Mode MCP Server Settings**
- Enable **"Enable tool get_image"**
- Toggle **"Use placeholders"** based on preference

## Support

- [Figma MCP Documentation](https://help.figma.com/hc/en-us/articles/32132100833559)
- [Augment MCP Setup](https://docs.augmentcode.com/setup-augment/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Status**: ✅ Configured and ready to use
**Last Updated**: 2025-07-31
