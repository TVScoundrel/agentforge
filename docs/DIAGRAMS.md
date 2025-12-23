# AgentForge Diagrams

This document contains visual diagrams for the AgentForge framework architecture and roadmap.

---

## Monorepo Structure

```mermaid
graph TB
    subgraph "AgentForge Monorepo"
        Root[Root Package<br/>agentforge]
        
        subgraph "Packages"
            Core["@agentforge/core<br/>✅ Setup Complete"]
            Patterns["@agentforge/patterns<br/>📋 Planned"]
            Tools["@agentforge/tools<br/>📋 Planned"]
            Testing["@agentforge/testing<br/>📋 Planned"]
            CLI["@agentforge/cli<br/>📋 Planned"]
        end
        
        subgraph "Documentation"
            Design[FRAMEWORK_DESIGN.md]
            Roadmap[ROADMAP.md]
            Spec[TOOL_REGISTRY_SPEC.md]
            Setup[MONOREPO_SETUP.md]
        end
        
        subgraph "Tooling"
            TS[TypeScript 5.3]
            Build[tsup]
            Test[Vitest]
            Lint[ESLint + Prettier]
        end
        
        Root --> Core
        Root --> Patterns
        Root --> Tools
        Root --> Testing
        Root --> CLI
        
        Core -.-> TS
        Core -.-> Build
        Core -.-> Test
        Core -.-> Lint
    end
    
    style Core fill:#4ade80,stroke:#22c55e,color:#000
    style Patterns fill:#94a3b8,stroke:#64748b,color:#000
    style Tools fill:#94a3b8,stroke:#64748b,color:#000
    style Testing fill:#94a3b8,stroke:#64748b,color:#000
    style CLI fill:#94a3b8,stroke:#64748b,color:#000
    style Root fill:#60a5fa,stroke:#3b82f6,color:#000
```

---

## Development Roadmap

```mermaid
gantt
    title AgentForge Development Roadmap
    dateFormat YYYY-MM-DD
    section Phase 0
    Planning & Setup           :done, p0, 2025-12-23, 1d
    section Phase 1
    Tool Metadata Interface    :active, p1a, 2025-12-23, 2d
    Tool Builder API           :p1b, after p1a, 2d
    Tool Registry              :p1c, after p1b, 2d
    Prompt Generation          :p1d, after p1c, 1d
    LangChain Integration      :p1e, after p1d, 1d
    Testing & Docs             :p1f, after p1e, 2d
    section Phase 2
    Agent Core                 :p2, after p1f, 7d
    section Phase 3
    Patterns                   :p3, after p2, 7d
    section Phase 4
    Middleware                 :p4, after p3, 7d
    section Phase 5
    Production Features        :p5, after p4, 7d
    section Phase 6
    Developer Experience       :p6, after p5, 7d
```

---

## Tool Registry Architecture (Planned)

```mermaid
graph TB
    subgraph "Tool System"
        Builder[Tool Builder<br/>Fluent API]
        Tool[Tool Instance<br/>with Metadata]
        Registry[Tool Registry<br/>CRUD + Query]
        
        Builder -->|creates| Tool
        Tool -->|registers in| Registry
    end
    
    subgraph "Metadata"
        Meta[ToolMetadata]
        Schema[Zod Schema]
        Examples[Examples]
        
        Meta --> Schema
        Meta --> Examples
    end
    
    subgraph "Integration"
        LangChain[LangChain Tools]
        Prompts[Prompt Generation]
        
        Registry -->|converts to| LangChain
        Registry -->|generates| Prompts
    end
    
    Tool --> Meta
    
    style Builder fill:#60a5fa,stroke:#3b82f6,color:#000
    style Tool fill:#4ade80,stroke:#22c55e,color:#000
    style Registry fill:#f59e0b,stroke:#d97706,color:#000
    style Meta fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style LangChain fill:#ec4899,stroke:#db2777,color:#fff
    style Prompts fill:#ec4899,stroke:#db2777,color:#fff
```

---

## Package Dependencies (Future)

```mermaid
graph LR
    Core["@agentforge/core"]
    Patterns["@agentforge/patterns"]
    Tools["@agentforge/tools"]
    Testing["@agentforge/testing"]
    CLI["@agentforge/cli"]
    
    Patterns --> Core
    Tools --> Core
    Testing --> Core
    CLI --> Core
    CLI --> Patterns
    CLI --> Tools
    
    style Core fill:#4ade80,stroke:#22c55e,color:#000
    style Patterns fill:#60a5fa,stroke:#3b82f6,color:#000
    style Tools fill:#f59e0b,stroke:#d97706,color:#000
    style Testing fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style CLI fill:#ec4899,stroke:#db2777,color:#fff
```

---

## Notes

- **Green** = Complete/Active
- **Gray** = Planned
- **Blue** = Core/Foundation
- **Orange** = Tools/Utilities
- **Purple** = Metadata/Configuration
- **Pink** = Integration/CLI

To view these diagrams:
1. Use a Markdown viewer that supports Mermaid (GitHub, VS Code with extensions, etc.)
2. Copy the Mermaid code to [Mermaid Live Editor](https://mermaid.live/)
3. Use the Augment Agent's `render-mermaid` tool
