import { beforeEach, vi } from 'vitest';

vi.mock('../../../../src/data/relational/utils/peer-dependency-checker.js', () => ({
  checkPeerDependency: vi.fn(),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
  };
});

export const mockPoolEnd = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
export const mockPoolConnect = vi.fn<() => Promise<{ release: ReturnType<typeof vi.fn> }>>().mockResolvedValue({
  release: vi.fn(),
});
export const mockPool = vi.fn().mockImplementation(() => ({
  end: mockPoolEnd,
  connect: mockPoolConnect,
  totalCount: 2,
  idleCount: 1,
  waitingCount: 0,
}));

vi.mock('pg', () => ({
  Pool: mockPool,
}));

export const mockPgExecute = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
export const mockPgDrizzle = vi.fn().mockReturnValue({
  execute: mockPgExecute,
});
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockPgDrizzle,
}));

export const mockMysqlPoolEnd = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
export const mockMysqlGetConnection = vi.fn<() => Promise<{ release: ReturnType<typeof vi.fn> }>>().mockResolvedValue({
  release: vi.fn(),
});
export const mockMysqlCreatePool = vi.fn().mockReturnValue({
  end: mockMysqlPoolEnd,
  getConnection: mockMysqlGetConnection,
});
vi.mock('mysql2/promise', () => ({
  createPool: mockMysqlCreatePool,
}));

export const mockMysqlExecute = vi.fn().mockResolvedValue([[{ '?column?': 1 }], []]);
export const mockMysqlDrizzle = vi.fn().mockReturnValue({
  execute: mockMysqlExecute,
});
vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: mockMysqlDrizzle,
}));

export const mockSqliteClose = vi.fn();
export const mockSqlitePragma = vi.fn();
export const mockDatabase = vi.fn().mockReturnValue({
  close: mockSqliteClose,
  pragma: mockSqlitePragma,
  open: true,
});
vi.mock('better-sqlite3', () => ({
  default: mockDatabase,
}));

export const mockSqliteAll = vi.fn().mockReturnValue([{ '?column?': 1 }]);
export const mockSqliteRun = vi.fn().mockReturnValue({ changes: 0, lastInsertRowid: 0 });
export const mockSqliteDrizzle = vi.fn().mockReturnValue({
  all: mockSqliteAll,
  run: mockSqliteRun,
});
vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: mockSqliteDrizzle,
}));

import * as connectionManagerModule from '../../../../src/data/relational/connection/connection-manager.js';

export const ConnectionManager = connectionManagerModule.ConnectionManager;
export const ConnectionState = connectionManagerModule.ConnectionState;

export function resetConnectionManagerMocks(): void {
  vi.clearAllMocks();

  mockPgExecute.mockResolvedValue([{ '?column?': 1 }]);
  mockMysqlExecute.mockResolvedValue([[{ '?column?': 1 }], []]);
  mockSqliteAll.mockReturnValue([{ '?column?': 1 }]);
  mockSqliteRun.mockReturnValue({ changes: 0, lastInsertRowid: 0 });
  mockPoolEnd.mockResolvedValue(undefined);
  mockPoolConnect.mockResolvedValue({ release: vi.fn() });
  mockMysqlPoolEnd.mockResolvedValue(undefined);
  mockMysqlGetConnection.mockResolvedValue({ release: vi.fn() });
  mockSqliteClose.mockReturnValue(undefined);

  mockPgDrizzle.mockReturnValue({ execute: mockPgExecute });
  mockMysqlDrizzle.mockReturnValue({ execute: mockMysqlExecute });
  mockSqliteDrizzle.mockReturnValue({ all: mockSqliteAll, run: mockSqliteRun });

  mockPool.mockImplementation(() => ({
    end: mockPoolEnd,
    connect: mockPoolConnect,
    totalCount: 2,
    idleCount: 1,
    waitingCount: 0,
  }));
  mockMysqlCreatePool.mockReturnValue({
    end: mockMysqlPoolEnd,
    getConnection: mockMysqlGetConnection,
  });
  mockDatabase.mockReturnValue({
    close: mockSqliteClose,
    pragma: mockSqlitePragma,
    open: true,
  });
}

beforeEach(() => {
  resetConnectionManagerMocks();
});
