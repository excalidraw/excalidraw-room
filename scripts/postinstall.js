// There doesn't appear to be a way to skip `postinstall`,
// as doing `yarn --ignore-scripts` could prevent native packages from building:
// https://github.com/yarnpkg/yarn/issues/4100

const { execSync } = require("child_process");

if (process.env.SKIP_YARN_POSTINSTALL !== "true") {
  execSync("yarnpkg build", { stdio: "inherit" });
}
