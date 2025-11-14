import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof import("../sdk/src/locale/en.json");
    };
  }
}
