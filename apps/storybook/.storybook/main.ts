import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/nextjs";

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
const getAbsolutePath = (value: string) =>
  dirname(require.resolve(join(value, "package.json")));

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-themes"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {},
  },
  staticDirs: ["../public"],
  webpackFinal: async (config) => {
    // Mock observability packages to avoid next/router dependency issues in Storybook
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@repo/observability/error": require.resolve("./observability-mock.ts"),
        "@sentry/nextjs": require.resolve("./sentry-mock.ts"),
        "@logtail/next": require.resolve("./logtail-mock.ts"),
      };
    }
    return config;
  },
};

export default config;
