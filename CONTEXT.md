# AgentForge

AgentForge provides reusable agent patterns and the concepts needed to configure and run them consistently.

## Multi-agent coordination

**Multi-Agent System**:
A coordinated agent pattern in which a Supervisor assigns work to one or more Workers and an Aggregator combines their results.

**Supervisor**:
The agent responsible for selecting which Workers receive work in a Multi-Agent System.

**Worker**:
A specialized agent that participates in a Multi-Agent System under a stable identity and declared capabilities.

**Worker capability**:
A skill or tool that a Worker declares it can use when work is assigned.

**Worker status**:
The invocation-specific availability and workload of a Worker. Status can change without changing the Worker topology or the Worker's declared capabilities.

**Aggregator**:
The agent responsible for combining Worker results into the Multi-Agent System's final result.

**Worker topology**:
The fixed set of Workers that a Multi-Agent System can dispatch work to during its lifetime.
_Avoid_: Dynamic worker registration

**Worker lifecycle**:
The period from admitting a Worker into a Worker topology through making its capabilities available during execution.
