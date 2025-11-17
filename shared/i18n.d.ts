import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      session: typeof import("../sdk/src/locale/en.json");
    };
  }
}
