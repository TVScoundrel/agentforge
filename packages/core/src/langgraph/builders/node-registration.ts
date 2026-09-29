import { StateGraph } from '@langchain/langgraph';
import type { AnnotationRoot, StateDefinition, UpdateType } from '@langchain/langgraph';

interface WorkflowNode<State, Update> {
  name: string;
  node: (state: State) => Update | Promise<Update>;
}

type WorkflowState<SD extends StateDefinition> = AnnotationRoot<SD>['State'];
type WorkflowGraph<SD extends StateDefinition, Update> = StateGraph<
  AnnotationRoot<SD>,
  WorkflowState<SD>,
  Update,
  string
>;

interface NodeRegistrationOptions {
  onGraphConstructionError?: (error: unknown) => never;
}

export function createRegisteredWorkflowGraph<
  SD extends StateDefinition,
  Update extends UpdateType<SD>,
>(
  stateSchema: AnnotationRoot<SD>,
  nodes: readonly WorkflowNode<WorkflowState<SD>, Update>[],
  options: NodeRegistrationOptions = {}
): WorkflowGraph<SD, Update> {
  const nodeNames = new Set<string>();
  for (const node of nodes) {
    if (nodeNames.has(node.name)) {
      throw new Error(`Duplicate node name: ${node.name}`);
    }
    nodeNames.add(node.name);
  }

  let graph: WorkflowGraph<SD, Update>;
  try {
    graph = new StateGraph<AnnotationRoot<SD>, WorkflowState<SD>, Update, string>(stateSchema);
  } catch (error) {
    if (options.onGraphConstructionError) {
      options.onGraphConstructionError(error);
    }
    throw error;
  }

  type GraphNodeAction = Parameters<typeof graph.addNode>[1];
  for (const { name, node } of nodes) {
    // LangGraph's addNode() overloads widen update objects internally. Keep that
    // interop localized here rather than weakening the public workflow types.
    graph.addNode(name, node as unknown as GraphNodeAction);
  }

  return graph;
}
