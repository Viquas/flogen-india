# CONVENTIONS.md

## Language & Syntax

- All files use `.js` (no TypeScript)
- 4-space indentation
- Single quotes for strings
- Semicolons required
- No trailing commas (not enforced by config)

## Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `EditorCanvas`, `ToolbarPanel` |
| Event handlers | `handle`-prefixed | `handleClick`, `handleSubmit` |
| Boolean state | `is`/`show`-prefixed | `isLoading`, `showModal` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | kebab-case or PascalCase for components | `use-editor-state.js`, `EditorCanvas.js` |

## React Patterns

- `'use client'` / `'use server'` directives placed at top of file
- Import order: React → third-party → internal → CSS
- State centralized in `useEditorState` hook — no global state manager (no Redux/Zustand)

## Error Handling

- **Client side:** `try/catch` + `toast.error()` for user-facing errors
- **Server side:** `NextResponse.json({ success: false, error: ... })` pattern
- API route errors return structured JSON with `success` boolean

## Code Organization

- Components co-located with their logic
- Custom hooks in `hooks/` directory
- No barrel files (no `index.js` re-exports)
- Server actions and API routes kept separate from UI components
