# MCP Server Setup

Run these commands in your terminal to wire MCP servers for Claude Code. These enable Claude to interact with external tools during development.

## Essential — install all of these

### Playwright (browser automation for testing)

```bash
claude mcp add playwright --transport stdio -- npx -y @playwright/mcp@latest
```

Used by: playwright-tester subagent, debugging UI issues, verifying page loads

### GitHub (repo operations)

```bash
claude mcp add github --transport stdio -- npx -y @modelcontextprotocol/server-github
```

Set `GITHUB_PERSONAL_ACCESS_TOKEN` in your shell env. Generate one at github.com/settings/tokens with `repo`, `read:org`, and `workflow` scopes.

Used by: creating PRs, reading issues, reviewing diffs, checking Actions status

### Filesystem (already built in — no install needed)

Claude Code's built-in file tools handle this. Mentioning for completeness.

### shadcn (component registry)

```bash
claude mcp add shadcn --transport http https://www.shadcn.io/api/mcp
```

Used by: adding new shadcn components, looking up component APIs

## Recommended

### Figma (if you're referencing the Figma mock)

```bash
claude mcp add figma --transport http https://mcp.figma.com/mcp
```

Used by: pulling design tokens and component structure from Figma into code

### Supabase (database introspection)

Supabase does not yet have an official first-party MCP. For now, use the Supabase CLI directly via Bash:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-dev-project-ref>
```

Used by: running migrations, generating types, inspecting schema

### next-devtools (Next.js dev inspection)

```bash
claude mcp add next-devtools --transport stdio -- npx -y @next/mcp@latest
```

Used by: diagnosing Next.js dev server issues, understanding which routes are active

## Verify setup

```bash
claude mcp list
```

Should show every server you've added with a green connection status.

## Per-project vs global

All these can be added to a specific repo's `.claude/mcp.json` instead of globally. Pro: isolation. Con: re-install per project. For a single project at a time, global is fine.
