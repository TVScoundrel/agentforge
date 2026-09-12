# AgentForge

AgentForge provides reusable building blocks for constructing and operating agents consistently.

## Agent building

**Agent pattern**:
A reusable coordination model that defines how an agent reasons, acts, delegates, or improves work across multiple steps.

**Tool**:
A named operation with a declared input contract that an agent may invoke to act beyond model generation.

**Tool Registry**:
A catalog of Tools available for lookup, selection, and presentation to agents.

**Relational Tool Set**:
A configured collection of relational database Tools that targets one database and owns their shared connection lifecycle and transaction scope.

## Agent Skills

**Agent Skill**:
A named bundle of instructions and optional supporting resources that teaches an agent how to perform a kind of work.
_Avoid_: Routing skill, Worker skill

**Skill discovery**:
Making an Agent Skill's identity and description available for selection without loading its instructions.

**Agent Skill access**:
Making an Agent Skill's instructions or supporting resources available for active work, subject to its Skill trust level.

**Skill activation**:
Making a trusted Agent Skill's instructions available to an agent for the active work.

**Skill trust level**:
An operator-assigned classification of an Agent Skill's source that governs whether its instructions and executable resources may be made available.

## Multi-agent coordination

**Multi-Agent System**:
A coordinated agent pattern in which a Supervisor assigns work to one or more Workers and an Aggregator combines their results.

**Supervisor**:
The agent responsible for selecting which Workers receive Task Assignments in a Multi-Agent System.

**Worker**:
A specialized agent that participates in a Multi-Agent System under a stable identity and declared capabilities.

**Worker capability**:
A Routing skill or Tool associated with a Worker. Availability and workload are Worker status, not capabilities.

**Routing skill**:
A label for an area of expertise that a Supervisor may use to match work to a Worker. A Routing skill neither activates an Agent Skill nor grants access to a Tool.
_Avoid_: Skill, Agent Skill

**Worker status**:
The invocation-specific availability and workload of a Worker. Status can change without changing the Worker topology or the Worker's declared capabilities.

**Aggregator**:
The agent responsible for combining Task Results into the Multi-Agent System's final result.

**Task Assignment**:
A unit of work routed to a specific Worker, distinct from the original input to the Multi-Agent System.

**Task Result**:
The outcome a Worker returns for a Task Assignment, including whether the work succeeded and either its output or failure.

**Worker topology**:
The fixed set of Workers that a Multi-Agent System can dispatch work to during its lifetime.
_Avoid_: Dynamic worker registration

**Worker lifecycle**:
The rules governing a Worker's admission to a Worker topology and the publication of its capabilities for execution.

**Worker lifecycle snapshot**:
The invocation-specific view of the Worker topology, combining fixed Worker identity and capabilities with the availability and workload captured for that execution. A resumed execution retains its original snapshot.
