import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Security floor for mongoose 8.x (GHSA-8332-j7wj-wjw4, GHSA-gg4r-jv3p-qx3c,
// GHSA-pcrw-h46h-c93h). Keep the lockfile and the declared range at or above it.
const FIXED_MONGOOSE_VERSION = "8.24.3";

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readJson = (file) =>
    JSON.parse(readFileSync(join(backendDir, file), "utf8"));

const parseVersion = (value) => value.split(".").map(Number);

const isAtLeast = (actual, minimum) => {
    for (let index = 0; index < minimum.length; index += 1) {
        if (actual[index] > minimum[index]) return true;
        if (actual[index] < minimum[index]) return false;
    }
    return true;
};

test("backend mongoose dependency resolves to a patched version", () => {
    const minimum = parseVersion(FIXED_MONGOOSE_VERSION);
    const lockfile = readJson("package-lock.json");

    const rootSpec = lockfile.packages[""].dependencies.mongoose;
    const declared = parseVersion(rootSpec.match(/\d+\.\d+\.\d+/)[0]);
    assert.ok(
        isAtLeast(declared, minimum),
        `package-lock.json declares mongoose ${rootSpec}, expected >= ${FIXED_MONGOOSE_VERSION}`
    );

    for (const [name, entry] of Object.entries(lockfile.packages)) {
        if (name === "node_modules/mongoose" || name.endsWith("/node_modules/mongoose")) {
            assert.ok(
                isAtLeast(parseVersion(entry.version), minimum),
                `${name} resolves to ${entry.version}, expected >= ${FIXED_MONGOOSE_VERSION}`
            );
        }
    }

    const manifestSpec = readJson("package.json").dependencies.mongoose;
    const manifestVersion = parseVersion(manifestSpec.match(/\d+\.\d+\.\d+/)[0]);
    assert.ok(
        isAtLeast(manifestVersion, minimum),
        `package.json declares mongoose ${manifestSpec}, expected >= ${FIXED_MONGOOSE_VERSION}`
    );
});
