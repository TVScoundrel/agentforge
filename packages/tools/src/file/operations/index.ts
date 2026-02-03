/**
 * File Operations Tools
 * 
 * Tools for reading, writing, and manipulating files.
 */

export * from './types.js';
export * from './tools/file-reader.js';
export * from './tools/file-writer.js';
export * from './tools/file-append.js';
export * from './tools/file-delete.js';
export * from './tools/file-exists.js';

import { createFileReaderTool } from './tools/file-reader.js';
import { createFileWriterTool } from './tools/file-writer.js';
import { createFileAppendTool } from './tools/file-append.js';
import { createFileDeleteTool } from './tools/file-delete.js';
import { createFileExistsTool } from './tools/file-exists.js';
import type { FileOperationsConfig } from './types.js';

/**
 * Default file operation tool instances
 */
export const fileReader = createFileReaderTool();
export const fileWriter = createFileWriterTool();
export const fileAppend = createFileAppendTool();
export const fileDelete = createFileDeleteTool();
export const fileExists = createFileExistsTool();

/**
 * Array of all file operation tools
 */
export const fileOperationTools = [
  fileReader,
  fileWriter,
  fileAppend,
  fileDelete,
  fileExists,
];

/**
 * Create file operation tools with custom configuration
 */
export function createFileOperationTools(config: FileOperationsConfig = {}) {
  const {
    defaultEncoding = 'utf8',
    createDirsDefault = false,
  } = config;

  return [
    createFileReaderTool(defaultEncoding),
    createFileWriterTool(defaultEncoding, createDirsDefault),
    createFileAppendTool(defaultEncoding),
    createFileDeleteTool(),
    createFileExistsTool(),
  ];
}

