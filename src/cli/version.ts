import { VERSION, HOSTED_API, HOSTED_TRIAL, HOSTED_PRICING } from "../mcp/constants.js";

export function printVersionJson(): void {
  console.log(
    JSON.stringify(
      {
        client: "driftguard",
        version: VERSION,
        hostedApi: HOSTED_API,
        trial: HOSTED_TRIAL,
        pricing: HOSTED_PRICING,
        ci: {
          actionRef: "kioie/driftguard/.github/actions/drift-diff@v" + VERSION,
          npx: `npx @driftguard/driftguard@${VERSION}`,
        },
      },
      null,
      2,
    ),
  );
}

export function printVersionPlain(): void {
  console.log(VERSION);
}
