import type { AxeMatchers } from "vitest-axe/matchers";

// vitest-axe 0.1.x só estende o namespace antigo `Vi`; este arquivo declara o
// matcher `toHaveNoViolations` para o `Assertion` do Vitest atual.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
