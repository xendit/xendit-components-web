export const preset = "ts-jest";
export const testEnvironment = "node";
export const roots = ["<rootDir>"];
export const moduleFileExtensions = ["ts", "tsx", "js", "json"];
export const transform = {
  "^.+\\.tsx?$": "ts-jest",
};
export const testMatch = ["**/?(*.)+(spec|test).[tj]s?(x)"];
export const collectCoverageFrom = [
  "secure-iframe/src/**/*.{ts,tsx}",
  "!**/node_modules/**",
];
export const coverageDirectory = "coverage";
export const globals = {
  "ts-jest": {
    tsconfig: "tsconfig.json",
  },
};
