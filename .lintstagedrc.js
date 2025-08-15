export default {
  "*.{js,jsx,ts,tsx,css}": ["pnpm lint", "pnpm prettier", () => "pnpm tsc"],
};
