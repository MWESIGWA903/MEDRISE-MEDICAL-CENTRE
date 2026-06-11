const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;
const pnpmStore = path.join(workspaceRoot, "node_modules/.pnpm");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Fix: pnpm encodes peer-dep info in store directory names with a hash suffix.
// Metro sometimes computes a slightly different encoded path (missing duplicate
// peer segments). We intercept those resolutions, locate the real directory by
// matching the 32-char hex hash at the end, and redirect Metro to the correct path.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("node_modules/.pnpm/")) {
    const match = moduleName.match(
      /node_modules\/\.pnpm\/([^/]+)\/node_modules\/(.+)$/
    );
    if (match) {
      const [, encodedPkg, subPath] = match;
      const hashMatch = encodedPkg.match(/_([a-f0-9]{32})$/);
      if (hashMatch) {
        const hash = hashMatch[1];
        try {
          const dirs = fs.readdirSync(pnpmStore);
          const actualDir = dirs.find((d) => d.endsWith("_" + hash));
          if (actualDir) {
            const correctedBase = path.join(
              pnpmStore,
              actualDir,
              "node_modules",
              subPath
            );
            // Try to find the actual file with various extensions
            const candidates = [
              correctedBase,
              correctedBase + ".js",
              correctedBase + ".jsx",
              correctedBase + ".ts",
              correctedBase + ".tsx",
            ];
            for (const candidate of candidates) {
              if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                return { type: "sourceFile", filePath: candidate };
              }
            }
            // If it's a directory, let Metro resolve it via package.json / index
            if (
              fs.existsSync(correctedBase) &&
              fs.statSync(correctedBase).isDirectory()
            ) {
              return context.resolveRequest(
                context,
                correctedBase,
                platform
              );
            }
          }
        } catch (_) {}
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  "@workspace/api-client-react": path.resolve(
    projectRoot,
    "lib/api-client-react"
  ),
};

module.exports = config;
