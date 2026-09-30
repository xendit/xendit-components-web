export default {
  "*.{js,jsx,ts,tsx}": ["pnpm lint", "pnpm prettier", () => "pnpm tsc"],
  "*.css": ["pnpm prettier"],
};
