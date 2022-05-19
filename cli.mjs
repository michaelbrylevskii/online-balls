import { Parcel } from "@parcel/core";
import { fork } from "child_process";
import fs from 'fs-extra';
import path from 'path';

console.info("🎉 Project CLI started with params: ", process.argv);

const TARGET_BACKEND = "backend";
const TARGET_FRONTEND = "frontend";
const ACTION_WATCH = "watch";
const ACTION_BUILD = "build";
const ACTIONS = [ACTION_WATCH, ACTION_BUILD];
const USAGE_INFO = `Use 'node runner.mjs build|watch'`;
const PRJ_DIR = path.resolve("./");
const DIST_DIR = path.resolve(PRJ_DIR, "dist/");
const DIST_BACKEND_ENTRY = path.resolve(DIST_DIR, TARGET_BACKEND, TARGET_BACKEND + ".js");
const DIST_FRONTEND = path.resolve(DIST_DIR, TARGET_FRONTEND);
const CACHE_DIR = path.resolve(PRJ_DIR, ".parcel-cache/");
const PACKAGE_JSON_PATH = path.resolve(PRJ_DIR, "package.json");

console.debug("PRJ_DIR: ", PRJ_DIR);
console.debug("DIST_DIR: ", DIST_DIR);
console.debug("DIST_BACKEND_ENTRY: ", DIST_BACKEND_ENTRY);
console.debug("DIST_FRONTEND: ", DIST_FRONTEND);
console.debug("CACHE_DIR: ", CACHE_DIR);
console.debug("PACKAGE_JSON_PATH: ", PACKAGE_JSON_PATH);

let backendProcess = null;

if (!fs.pathExistsSync(PACKAGE_JSON_PATH)) {
  console.error("Incorrect working direction, use runner from project root.");
  throw new Error("Usage error");
}

let action = process.argv[2];
if (!action) {
  console.error("Action not specified.");
  console.error(USAGE_INFO);
  throw new Error("Usage error");
}
if (!ACTIONS.includes(action)) {
  console.error(`Incorrect action '${action}'.`);
  console.error(USAGE_INFO);
  throw new Error("Usage error");
}

let backendConfig = {
  entries: PRJ_DIR,
  defaultConfig: "@parcel/config-default",
  targets: [TARGET_BACKEND],
  mode: action === ACTION_BUILD ? "production" : "development",
};

let frontendConfig = {
  entries: PRJ_DIR,
  defaultConfig: "@parcel/config-default",
  targets: [TARGET_FRONTEND],
  mode: action === ACTION_BUILD ? "production" : "development",
  hmrOptions: action === ACTION_BUILD ? null : {
    port: 3001
  },
};

beforeAction(action);

if (action === ACTION_BUILD) {
  await build(frontendConfig, TARGET_FRONTEND);
  await build(backendConfig, TARGET_BACKEND);
} else if (action === ACTION_WATCH) {
  await watch(frontendConfig, TARGET_FRONTEND);
  await watch(backendConfig, TARGET_BACKEND);
}

async function build(config, target) {
  await new Parcel(config).run();
  afterSuccessBuild(target, ACTION_BUILD);
}

async function watch(config, target) {
  await new Parcel(config).watch(watchHandler(target, afterSuccessBuild));
}

function beforeAction(action) {
  fs.removeSync(DIST_DIR);
  fs.removeSync(CACHE_DIR);
}

function afterSuccessBuild(target, action) {
  if (target === TARGET_BACKEND && action == ACTION_WATCH) {
    backendProcess?.kill();
    backendProcess = fork(DIST_BACKEND_ENTRY, [
      "--profile", "dev",
      "--staticDir", DIST_FRONTEND
    ]);
  }
}

function watchHandler(target, onBuildSuccess, onBuildFailure) {
  return (err, event) => {
    if (err) {
      throw err;
    }

    if (event.type === "buildSuccess") {
      let bundles = event.bundleGraph.getBundles();
      console.log(`🟢 ${target} built ${bundles.length} bundles in ${event.buildTime}ms!`);
      onBuildSuccess?.(target, ACTION_WATCH);
    } else if (event.type === "buildFailure") {
      let diagnostics = Array.from(event?.diagnostics ?? []);
      let message = `🔴 ${target} build error. Problems:`;
      diagnostics.map(error => getErrorDescription(error)).forEach((error, i) => message += `\n${i + 1}. ${error}`);
      console.error(message);
      //console.debug("");
      //console.debug("event: ", JSON.stringify(event));
      //console.debug("");
      onBuildFailure?.(target, ACTION_WATCH);
    }
  };
}

function getErrorDescription(error) {
  if (!error) {
    return "Unknown error";
  }

  let message = error.message ?? "Unknown error";
  let files = error.codeFrames && error.codeFrames.length > 0
    ? "\n   Files:\n" + error.codeFrames
      .filter(frame => frame.filePath)
      .filter(frame => frame.codeHighlights && frame.codeHighlights.length > 0)
      .flatMap(frame => frame.codeHighlights.map(codeHighlight => ({
        filePath: path.relative(PRJ_DIR, frame.filePath),
        line: codeHighlight?.start?.line,
        column: codeHighlight?.start?.column
      })))
      .map(point => `   - ${point.filePath}` + (point.line && point.column ? `:${point.line}:${point.column}` : ""))
      .join('\n')
    : "";
  let hints = error.hints
    ? "\n   Hints:\n" + error.hints
      .map(hint => `   - ${hint}`)
      .join('\n')
    : "";
  return message + files + hints;
}
