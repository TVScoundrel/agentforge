/* eslint-disable @typescript-eslint/no-unused-vars */

import type { JsonObject } from '@agentforge/core';
import type { AgentMessage, HandoffRequest, TaskResult } from '../../src/multi-agent/index.js';

type Equal<Left, Right> =
  (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2) ? true : false;
type AssertTrue<T extends true> = T;

type _agentMessageMetadataIsJsonObject = AssertTrue<
  Equal<AgentMessage['metadata'], JsonObject | undefined>
>;
type _taskResultMetadataIsJsonObject = AssertTrue<
  Equal<TaskResult['metadata'], JsonObject | undefined>
>;
type _handoffContextIsUnknownFirst = AssertTrue<
  Equal<HandoffRequest['context'], unknown>
>;
