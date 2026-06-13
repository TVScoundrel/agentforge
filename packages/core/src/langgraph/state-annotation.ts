import { Annotation, type AnnotationRoot } from '@langchain/langgraph';
import type {
  ChannelUpdate,
  ChannelValue,
  StateAnnotationDefinition,
  StateChannelDefinition,
  StateChannelConfigLike,
  StateConfigMap,
  ValidStateConfig,
} from './state-types.js';
import { entriesOf, setStateDefinitionValue, useLatestValue } from './state-shared.js';

function createChannel<TChannel extends StateChannelConfigLike>(
  channelConfig: TChannel
): StateChannelDefinition<TChannel> {
  if (channelConfig.reducer) {
    return Annotation<ChannelValue<TChannel>, ChannelUpdate<TChannel>>({
      reducer: channelConfig.reducer as (
        left: ChannelValue<TChannel>,
        right: ChannelUpdate<TChannel>
      ) => ChannelValue<TChannel>,
      default: channelConfig.default as (() => ChannelValue<TChannel>) | undefined,
    }) as StateChannelDefinition<TChannel>;
  }

  if (channelConfig.default) {
    return Annotation<ChannelValue<TChannel>, ChannelValue<TChannel>>({
      reducer: useLatestValue,
      default: channelConfig.default as () => ChannelValue<TChannel>,
    }) as StateChannelDefinition<TChannel>;
  }

  return Annotation<ChannelValue<TChannel>>() as StateChannelDefinition<TChannel>;
}

/**
 * Create a type-safe state annotation with optional Zod validation
 *
 * This is a thin wrapper around LangGraph's Annotation.Root that adds:
 * - Zod schema validation support
 * - Better TypeScript inference
 * - Documentation/description support
 */
export function createStateAnnotation<TConfig extends StateConfigMap>(
  config: ValidStateConfig<TConfig>
): AnnotationRoot<StateAnnotationDefinition<TConfig>> {
  const stateDefinition = {} as StateAnnotationDefinition<TConfig>;

  for (const [key, channelConfig] of entriesOf(config)) {
    setStateDefinitionValue(
      stateDefinition,
      key,
      createChannel(channelConfig) as StateAnnotationDefinition<TConfig>[typeof key]
    );
  }

  return Annotation.Root(stateDefinition);
}
