# AI Component Sandbox Documentation

## Overview

The AI Component Sandbox is a powerful feature integrated into Haristotle's BlockNote editor that allows users to generate custom React components using AI assistance. Users can describe components they want to create, iterate on prompts, preview generated components, and seamlessly integrate them into their blog posts.

## Features

### ✨ Core Capabilities
- **AI-Powered Generation**: Uses OpenAI's GPT-4o-mini to generate React components from natural language descriptions
- **Interactive Preview**: Real-time preview of generated components with error handling
- **Version History**: Maintains all iterations with the ability to rollback to previous versions
- **Safe Runtime Environment**: Components execute in a sandboxed environment with restricted imports
- **Editor Integration**: Seamlessly integrates with BlockNote editor as a custom block type

### 🔒 Safety Features
- **Restricted Imports**: Only allows pre-approved UI components and utilities
- **Error Boundaries**: Catches and handles component runtime errors gracefully  
- **Code Sanitization**: Validates and cleans generated code before execution
- **Editor Locking**: Prevents accidental content changes while AI sidebar is active

### 🎨 User Experience
- **Navigation Protection**: Warns users before leaving with unsaved AI work
- **Progress Tracking**: Shows generation status and version numbers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessible Interface**: Follows accessibility best practices

## How to Use

### 1. Adding an AI Component Sandbox

In the BlockNote editor:
1. Type `/sim` and press Enter to insert an AI Component Sandbox
2. Alternative commands: `/ai`, `/component`, `/generate`
3. An empty sandbox block will appear with a "Generate Component" button

### 2. Generating Components

1. Click the "Generate Component" button or the sandbox area
2. The AI sidebar opens on the right side
3. Enter a description of the component you want to create
4. Click "Generate Component" to start AI generation
5. The component will be generated and previewed in the sidebar

### 3. Iterating on Components

1. In the sidebar, switch to the "Prompt" tab
2. Enter a new description or refinement request
3. Click "Generate New Version" to create an iteration
4. All previous versions are preserved in the history

### 4. Managing Versions

1. Switch to the "History" tab to see all versions
2. Click on any version to preview it
3. Use the "Use" button to switch to a different version
4. The "Preview" tab shows the currently selected version

### 5. Applying Components

1. Once satisfied with a component, click "Apply to Editor"
2. The component will be rendered in the editor block
3. The AI sidebar closes and editor becomes editable again

## Available Components and APIs

### UI Components
- **Layout**: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Separator`
- **Form Elements**: `Button`, `Input`, `Textarea`, `Switch`, `Label`
- **Feedback**: `Badge`, `Alert`, `AlertDescription`
- **Icons**: Lucide React icons (Heart, Star, Plus, Minus, etc.)

### React Hooks
- `useState` - Component state management
- `useEffect` - Side effects and lifecycle
- `useCallback` - Memoized callbacks
- `useMemo` - Memoized values

### Utilities
- **Styling**: Full Tailwind CSS support
- **Console**: Sandboxed console methods for debugging

## Example Prompts

### Simple Counter Component
```
Create a counter component with plus and minus buttons and a display showing the current count
```

### User Profile Card
```
Build a user profile card with an avatar placeholder, name, email, and a "Follow" button
```

### Interactive Todo Item
```
Make a todo list item with a checkbox, text, and a delete button. The checkbox should toggle completion status
```

### Data Visualization
```
Create a simple progress bar component that shows completion percentage with a label
```

### Form Components
```
Build a contact form with name, email, message fields and a submit button with validation states
```

## Technical Implementation

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BlockNote     │    │   AI Sidebar    │    │   API Routes    │
│   Editor        │◄──►│   Component     │◄──►│   /api/ai/*     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Custom Block    │    │  React Runtime  │    │   Database      │
│ Renderer        │    │  Environment    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema

```sql
-- AI Component tracking
ai_components (
  id: string (primary key)
  block_id: string (unique) 
  post_id: string (foreign key)
  current_version_id: string (foreign key)
  created_at: timestamp
  updated_at: timestamp
)

-- Component versions and history
ai_component_versions (
  id: string (primary key)
  component_id: string (foreign key)
  prompt: text
  generated_code: text
  version_number: integer
  status: enum (GENERATING, COMPLETED, FAILED)
  error_message: text (nullable)
  created_at: timestamp
)
```

### Key Files

- **`/src/components/editor/ai-component-sidebar.tsx`** - Main AI interface
- **`/src/components/editor/blocks/ai-component-sandbox-block.tsx`** - Custom BlockNote block
- **`/src/components/editor/react-component-runtime.tsx`** - Safe execution environment
- **`/src/app/api/ai/generate-component/route.ts`** - AI generation endpoint
- **`/src/hooks/use-ai-sidebar.tsx`** - State management and navigation protection

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# OpenAI API for component generation
OPENAI_API_KEY="your-openai-api-key"

# Optional: Upstash QStash for workflow processing
QSTASH_URL="your-qstash-url"
QSTASH_TOKEN="your-qstash-token"
```

### Dependencies

The feature requires these packages (already included):
- `@ai-sdk/openai` - OpenAI integration
- `@upstash/workflow` - Reliable AI processing
- `react-live` - Safe component execution
- `zustand` - State management

## Security Considerations

### Input Sanitization
- All user prompts are validated and sanitized
- Generated code is parsed and validated before execution
- XSS protection through restricted execution scope

### Safe Execution
- Components run in isolated scope with limited imports
- No access to dangerous APIs or external resources
- Error boundaries prevent crashes from malformed components

### Access Control
- Users can only generate components for posts they own
- All database operations are user-scoped
- API endpoints validate session authentication

## Limitations

### Current Restrictions
- Components cannot make external API calls
- Limited to approved UI component library
- No access to Next.js-specific features (routing, etc.)
- Cannot install or import external packages

### Performance Considerations
- AI generation may take 5-15 seconds
- Component execution is client-side only
- Version history is stored indefinitely (consider cleanup)

## Troubleshooting

### Common Issues

**Component doesn't render**
- Check browser console for errors
- Verify component syntax is valid React
- Ensure all used components are in the approved list

**AI generation fails**
- Verify OpenAI API key is configured
- Check network connectivity
- Review prompt for clarity and specificity

**Sidebar doesn't open**
- Ensure post is saved first
- Check browser console for JavaScript errors
- Verify user authentication

**Editor becomes unresponsive**
- Refresh the page to reset editor state
- Check for any error dialogs or notifications
- Clear browser cache and cookies

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('ai-sandbox-debug', 'true')
```

## Future Enhancements

### Planned Features
- Support for Chart.js components
- Integration with external APIs
- Component sharing between users
- AI-powered component refactoring
- Advanced styling options
- Component library management

### API Improvements
- Streaming AI responses for faster feedback
- Component performance optimization
- Advanced error reporting
- Usage analytics and insights

This AI Component Sandbox feature represents a significant step forward in making content creation more dynamic and interactive, allowing users to create rich, custom components without needing to write code manually.