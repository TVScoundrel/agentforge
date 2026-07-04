export interface ToolPublishOptions {
  tag?: string;
  dryRun?: boolean;
}

export interface ToolPathInfo {
  toolPath: string;
  hasTestScript: boolean;
  hasBuildScript: boolean;
}

export interface ToolPackageJson {
  name?: string;
  scripts?: {
    test?: string;
    build?: string;
  };
}
