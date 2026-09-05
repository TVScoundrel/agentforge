---
status: accepted
---

# Fix Worker topology at Multi-Agent System compilation

A Multi-Agent System's Worker topology is fixed before LangGraph compilation. Compiled LangGraph workflows cannot add Worker nodes, so treating post-compilation registration as dynamic admission creates capability records without executable Workers. The factory and builder therefore share one Worker lifecycle, while the deprecated registration adapter may update routing skills only for known Workers and must verify that supplied tool names match the tools compiled into each Worker.

## Consequences

- Adding or removing a Worker requires compiling a new Multi-Agent System.
- Worker identity, executable tools, and declared capabilities belong to the Worker topology; availability and workload belong to invocation state.
- An interrupted execution resumes with its original Worker lifecycle snapshot. Later routing-skill updates apply only to new executions.
- The deprecated registration adapter cannot add Worker identities or change executable tools.
