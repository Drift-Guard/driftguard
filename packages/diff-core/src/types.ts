export type ChangeSeverity = "breaking" | "warning" | "info";

export interface SchemaChange {
  path: string;
  severity: ChangeSeverity;
  changeType: "added" | "removed" | "type_changed" | "required_added" | "required_removed";
  before?: unknown;
  after?: unknown;
  message: string;
}

export interface DiffResult {
  hasChanges: boolean;
  breakingCount: number;
  warningCount: number;
  infoCount: number;
  changes: SchemaChange[];
}

export type JsonSchema = Record<string, unknown>;

export type DiffProfile = "cli" | "hosted";

export interface InferSchemaOptions {
  profile?: DiffProfile;
  markAllFieldsRequired?: boolean;
}
