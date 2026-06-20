import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class DriftGuard implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DriftGuard",
    name: "driftGuard",
    icon: "file:driftguard.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Validate automation payloads and check contract preflight",
    defaults: { name: "DriftGuard" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "driftGuardApi", required: true }],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Validate Payload", value: "validatePayload" },
          { name: "Check Preflight", value: "checkPreflight" },
        ],
        default: "validatePayload",
      },
      {
        displayName: "Payload",
        name: "payload",
        type: "json",
        default: "{}",
        displayOptions: { show: { operation: ["validatePayload"] } },
        description: "Inbound JSON to validate",
      },
      {
        displayName: "Profile",
        name: "profile",
        type: "json",
        default: "{}",
        displayOptions: { show: { operation: ["validatePayload"] } },
        description: "Consumer profile JSON (or use Profile ID below)",
      },
      {
        displayName: "Profile ID",
        name: "profileId",
        type: "string",
        default: "",
        displayOptions: { show: { operation: ["validatePayload"] } },
        description: "Hosted profile registry id (optional when Profile is set)",
      },
      {
        displayName: "Mode",
        name: "mode",
        type: "options",
        options: [
          { name: "Block", value: "block" },
          { name: "Warn", value: "warn" },
          { name: "Quarantine", value: "quarantine" },
        ],
        default: "block",
        displayOptions: { show: { operation: ["validatePayload"] } },
      },
      {
        displayName: "Quarantine Webhook URL",
        name: "webhookUrl",
        type: "string",
        default: "",
        displayOptions: { show: { operation: ["validatePayload"], mode: ["quarantine"] } },
      },
      {
        displayName: "Watch IDs",
        name: "watchIds",
        type: "string",
        default: "",
        displayOptions: { show: { operation: ["checkPreflight"] } },
        description: "Comma-separated watch IDs",
      },
      {
        displayName: "Agent ID",
        name: "agentId",
        type: "string",
        default: "",
        displayOptions: { show: { operation: ["checkPreflight"] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("driftGuardApi");
    const apiKey = credentials.apiKey as string;
    const baseUrl = ((credentials.baseUrl as string) || "https://driftguard.org").replace(/\/$/, "");
    const operation = this.getNodeParameter("operation", 0) as string;
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      if (operation === "validatePayload") {
        const payload = this.getNodeParameter("payload", i, {}) as object;
        const profileRaw = this.getNodeParameter("profile", i, {}) as object;
        const profileId = (this.getNodeParameter("profileId", i, "") as string).trim();
        const mode = this.getNodeParameter("mode", i, "block") as string;
        const webhookUrl = (this.getNodeParameter("webhookUrl", i, "") as string).trim();

        const body: Record<string, unknown> = {
          payload,
          options: { mode, profileMode: "hosted" },
        };
        if (profileId) body.profileId = profileId;
        else body.profile = profileRaw;
        if (mode === "quarantine" && webhookUrl) {
          (body.options as Record<string, unknown>).webhookUrl = webhookUrl;
        }

        const res = await this.helpers.request({
          method: "POST",
          url: `${baseUrl}/api/validate`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-DriftGuard-Source": "n8n",
          },
          body,
          json: true,
          resolveWithFullResponse: true,
          simple: false,
        });

        returnData.push({
          json: {
            statusCode: res.statusCode,
            ...(typeof res.body === "object" ? res.body : { body: res.body }),
          },
          pairedItem: { item: i },
        });
      } else {
        const watchIdsRaw = (this.getNodeParameter("watchIds", i, "") as string).trim();
        const agentId = (this.getNodeParameter("agentId", i, "") as string).trim();
        const body: Record<string, unknown> = {};
        if (agentId) body.agentId = agentId;
        else if (watchIdsRaw) {
          body.watchIds = watchIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
        }

        const res = await this.helpers.request({
          method: "POST",
          url: `${baseUrl}/api/preflight`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body,
          json: true,
          resolveWithFullResponse: true,
          simple: false,
        });

        returnData.push({
          json: {
            statusCode: res.statusCode,
            ...(typeof res.body === "object" ? res.body : { body: res.body }),
          },
          pairedItem: { item: i },
        });
      }
    }

    return [returnData];
  }
}
