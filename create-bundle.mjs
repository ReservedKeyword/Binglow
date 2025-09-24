import esbuild from "esbuild";
import { glob } from "glob";
import { mkdir as fsMakeDir, readFile as fsReadFile, writeFile as fsWriteFile } from "node:fs/promises";
import { join as pathJoin } from "node:path";

export const createProductionBundle = async ({ entryPoints, outDir, packageName }) => {
  console.log(`Starting build for ${packageName}...`);

  // --- Pass 1: Analyze dependencies ---
  console.log("Analyzing dependency graph...");

  const analysisResult = await esbuild.build({
    bundle: true,
    entryPoints,
    metafile: true,
    outdir: outDir,
    packages: "external",
    platform: "node",
    target: "node20",
    write: false
  });

  // --- Dependency Discovery ---
  const externalImports = new Set();

  for (const metaOutput of Object.values(analysisResult.metafile.outputs)) {
    for (const foundImport of metaOutput.imports) {
      if (foundImport.external) {
        const pkgName =
          foundImport.path.startsWith("@") ?
            foundImport.path.split("/").slice(0, 2).join("/")
          : foundImport.path.split("/")[0];

        externalImports.add(pkgName);
      }
    }
  }

  const discoveredDependencies = Array.from(externalImports);
  console.log("Discovered production dependencies:", JSON.stringify(discoveredDependencies.sort()));

  // --- Version Lookup ---
  console.log("Building a complete map of all workspace dependencies...");

  const allPackageJsonPaths = await glob("packages/**/package.json", {
    absolute: true,
    cwd: "../..",
    ignore: ["**/dist/**", "**/generated/**", "**/node_modules/**"]
  });

  const versionMap = new Map();

  for (const packagePath of allPackageJsonPaths) {
    try {
      const jsonContent = JSON.parse(await fsReadFile(packagePath, "utf-8"));
      const dependencies = { ...jsonContent.dependencies, ...jsonContent.devDependencies } ?? {};

      for (const dependency in dependencies) {
        if (!versionMap.has(dependency)) {
          versionMap.set(dependency, dependencies[dependency]);
        }
      }
    } catch (e) {
      console.warn(`Could not parse ${packagePath}, skipping.`);
    }
  }

  console.log("Dependency map created successfully.");

  const productionDependencies = {};

  for (const dependency of discoveredDependencies) {
    if (versionMap.has(dependency)) {
      productionDependencies[dependency] = versionMap.get(dependency);
    }
  }

  // --- Generate Production package.json ---
  console.log("Generating production package.json...");

  const prodPackageJson = {
    name: packageName,
    version: "1.0.0",
    private: true,
    main: "server.js",
    scripts: {
      healthcheck: "node healthcheck-runner.js",
      start: "node server.js"
    },
    dependencies: productionDependencies
  };

  await fsMakeDir(outDir, { recursive: true });
  await fsWriteFile(pathJoin(outDir, "package.json"), JSON.stringify(prodPackageJson, null, 2));
  console.log("Production package.json created successfully.");

  // --- Pass 2: Final Bundle ---
  console.log("Creating final bundle...");

  await esbuild.build({
    bundle: true,
    entryPoints,
    external: discoveredDependencies,
    legalComments: "external",
    logLevel: "info",
    outdir: outDir,
    minify: true,
    platform: "node",
    target: "node20",
    treeShaking: true
  });

  console.log(`Build for ${packageName} finished successfully!`);
};
