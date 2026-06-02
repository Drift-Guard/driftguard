import { inferSchema, type JsonSchema } from "./diff.js";

export type OpenApiSpec = Record<string, unknown>;

export interface OpenApiOperationSnapshot {
  key: string;
  method: string;
  path: string;
  operationId?: string;
  parameters: JsonSchema;
  /** Legacy single success response schema (200/201/default). */
  responseSchema: JsonSchema;
  /** All response body schemas keyed by status code or `default`. */
  responses: Record<string, JsonSchema>;
  /** Response header schemas keyed by status code. */
  responseHeaders: Record<string, JsonSchema>;
  /** Normalized security requirements for the operation. */
  security: JsonSchema;
}

export const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

export function resolveRef(spec: OpenApiSpec, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let node: unknown = spec;
  for (const part of parts) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

export function resolveSchema(spec: OpenApiSpec, schema: unknown): JsonSchema {
  if (!schema || typeof schema !== "object") {
    return inferSchema(schema ?? null);
  }
  const obj = schema as Record<string, unknown>;
  if (typeof obj.$ref === "string") {
    const resolved = resolveRef(spec, obj.$ref);
    return resolved && typeof resolved === "object"
      ? (resolved as JsonSchema)
      : inferSchema({ $ref: obj.$ref });
  }
  return obj as JsonSchema;
}

function pickPrimaryResponseSchema(responses: Record<string, JsonSchema>): JsonSchema {
  for (const code of ["200", "201", "202", "204", "default"]) {
    if (responses[code]) return responses[code];
  }
  const first = Object.values(responses)[0];
  return first ?? inferSchema(null);
}

function responseBodiesV2(spec: OpenApiSpec, operation: Record<string, unknown>): Record<string, JsonSchema> {
  const responses = operation.responses as Record<string, Record<string, unknown>> | undefined;
  if (!responses) return {};
  const out: Record<string, JsonSchema> = {};
  for (const [code, response] of Object.entries(responses)) {
    if (response.schema) out[code] = resolveSchema(spec, response.schema);
  }
  return out;
}

function responseBodiesV3(spec: OpenApiSpec, operation: Record<string, unknown>): Record<string, JsonSchema> {
  const responses = operation.responses as Record<string, unknown> | undefined;
  if (!responses) return {};
  const out: Record<string, JsonSchema> = {};
  for (const [code, raw] of Object.entries(responses)) {
    const response = raw as Record<string, unknown>;
    const content = response.content as Record<string, Record<string, unknown>> | undefined;
    if (!content) continue;
    const media =
      content["application/json"] ?? content["*/*"] ?? Object.values(content)[0];
    if (media?.schema) out[code] = resolveSchema(spec, media.schema);
  }
  return out;
}

function responseHeadersFromOperation(
  spec: OpenApiSpec,
  operation: Record<string, unknown>,
): Record<string, JsonSchema> {
  const responses = operation.responses as Record<string, Record<string, unknown>> | undefined;
  if (!responses) return {};
  const out: Record<string, JsonSchema> = {};
  for (const [code, response] of Object.entries(responses)) {
    const headers = response.headers as Record<string, Record<string, unknown>> | undefined;
    if (!headers) continue;
    const properties: Record<string, JsonSchema> = {};
    for (const [name, header] of Object.entries(headers)) {
      properties[name] = resolveSchema(spec, header.schema ?? { type: "string" });
    }
    out[code] = { type: "object", properties, path: `$.responses.${code}.headers` };
  }
  return out;
}

export function pickParameters(spec: OpenApiSpec, operation: Record<string, unknown>): JsonSchema {
  const params = operation.parameters as unknown[] | undefined;
  if (!params?.length) return inferSchema({});
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const raw of params) {
    if (!raw || typeof raw !== "object") continue;
    const param = raw as Record<string, unknown>;
    if (typeof param.$ref === "string") {
      const resolved = resolveRef(spec, param.$ref) as Record<string, unknown> | undefined;
      if (resolved?.name) {
        const name = String(resolved.name);
        properties[name] = resolveSchema(spec, resolved.schema ?? { type: "string" });
        if (resolved.required === true) required.push(name);
      }
      continue;
    }
    const name = String(param.name ?? "");
    if (!name) continue;
    properties[name] = resolveSchema(spec, param.schema ?? { type: "string" });
    if (param.required === true) required.push(name);
  }
  const schema: JsonSchema = { type: "object", properties, path: "$.parameters" };
  if (required.length) schema.required = required;
  return schema;
}

function normalizeSecurity(spec: OpenApiSpec, operation: Record<string, unknown>): JsonSchema {
  const opSecurity = operation.security as unknown[] | undefined;
  const globalSecurity = spec.security as unknown[] | undefined;
  const requirements = opSecurity ?? globalSecurity ?? [];
  return inferSchema(requirements, "$.security");
}

export function normalizeOpenApiSpec(spec: unknown): Record<string, OpenApiOperationSnapshot> {
  if (!spec || typeof spec !== "object") {
    throw new Error("OpenAPI spec must be a JSON object");
  }
  const doc = spec as OpenApiSpec;
  const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return {};

  const isV2 = doc.swagger === "2.0";
  const operations: Record<string, OpenApiOperationSnapshot> = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      if (!operation || typeof operation !== "object") continue;
      const op = operation as Record<string, unknown>;
      const verb = method.toUpperCase();
      const key = `${verb} ${path}`;
      const responses = isV2 ? responseBodiesV2(doc, op) : responseBodiesV3(doc, op);
      operations[key] = {
        key,
        method: verb,
        path,
        operationId: typeof op.operationId === "string" ? op.operationId : undefined,
        parameters: pickParameters(doc, op),
        responseSchema: pickPrimaryResponseSchema(responses),
        responses,
        responseHeaders: responseHeadersFromOperation(doc, op),
        security: normalizeSecurity(doc, op),
      };
    }
  }
  return operations;
}

export function openApiSpecToSchema(spec: unknown): Record<string, unknown> {
  return { operations: normalizeOpenApiSpec(spec) };
}
