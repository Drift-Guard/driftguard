import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class DriftGuardApi implements ICredentialType {
  name = "driftGuardApi";
  displayName = "DriftGuard API";
  documentationUrl = "https://developers.driftguard.org/api/validate/";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://driftguard.org",
      description: "DriftGuard API base (override for staging)",
    },
  ];
}
