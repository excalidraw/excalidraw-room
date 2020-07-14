// This allows `postinstall` to be skipped via `SKIP_YARN_POSTINSTALL=true`.
// This is useful when building a Docker image because it lets you
// take advantage of cached Docker layers and run Yarn
// only if `package.json` or `yarn.lock` changed,
// and not every time source code is updated:
// https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
//
// However, there doesn't appear to be a way to skip `postinstall`,
// and doing `yarn --ignore-scripts` could prevent native packages from building:
// https://github.com/yarnpkg/yarn/issues/4100

const { execSync } = require("child_process");

if (process.env.SKIP_YARN_POSTINSTALL !== "true") {
  execSync("yarnpkg build", { stdio: "inherit" });
}
