import { makeTestBffData } from "./data/test-data";
import { internal } from "./internal";
import { createTFunction } from "./localization";
import { XenditComponents } from "./public-sdk";
import { SessionTelemetry } from "./telemetry";
import { parseSdkKey } from "./utils";

/**
 * Simple mock sdk class for behavior tree and telemetry tests.
 */
export const MockSdk = class MockSdk {
  t = createTFunction("en", (strings) => strings);
  [internal]: unknown;

  constructor(
    private options: { componentsSdkKey: string; enablePaylinks: boolean },
  ) {
    const testData = makeTestBffData();

    this[internal] = {
      options: this.options,
      sdkKey: parseSdkKey(this.options.componentsSdkKey),
      telemetry: new SessionTelemetry(
        this as unknown as XenditComponents,
        false,
      ),
      worldState: {
        session: testData.session,
      },
    };
  }
} as unknown as typeof XenditComponents;
