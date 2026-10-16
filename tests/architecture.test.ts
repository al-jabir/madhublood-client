import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "src");
function files(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")
          ? [path.join(dir, entry.name)]
          : [],
    );
}
test("frontend resolves tools locally and has no workspace or server-source dependency", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ) as Record<string, unknown>;
  assert.equal(manifest.workspaces, undefined);
  assert.ok(fs.existsSync(path.join(root, "package-lock.json")));
  assert.ok(
    import.meta.resolve("typescript").includes("/client/node_modules/"),
  );
  for (const file of [...files(src), ...files(path.join(root, "e2e"))])
    assert.doesNotMatch(
      fs.readFileSync(file, "utf8"),
      /from\s+['"][^'"]*(?:server\/src|\.\.\/server)/,
    );
});
test("feature extraction introduces no runtime source dependency cycles", () => {
  const all = files(src);
  const graph = new Map<string, string[]>();
  for (const file of all) {
    const text = fs.readFileSync(file, "utf8");
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .filter((node) => !node.importClause?.isTypeOnly)
      .map((node) => (node.moduleSpecifier as ts.StringLiteral).text);
    graph.set(
      file,
      imports
        .filter((value) => value.startsWith(".") || value.startsWith("@/"))
        .map((value) =>
          value.startsWith("@/")
            ? path.join(src, value.slice(2))
            : path.resolve(path.dirname(file), value),
        )
        .map((value) =>
          all.find(
            (file) =>
              file === value ||
              file === value + ".ts" ||
              file === value + ".tsx",
          ),
        )
        .filter((value): value is string => !!value),
    );
  }
  const visited = new Set<string>();
  function visit(file: string, stack: string[]) {
    assert.ok(
      !stack.includes(file),
      "Runtime dependency cycle: " +
        [...stack, file].map((value) => path.relative(src, value)).join(" -> "),
    );
    if (visited.has(file)) return;
    for (const dep of graph.get(file) ?? []) visit(dep, [...stack, file]);
    visited.add(file);
  }
  for (const file of all) visit(file, []);
});
test("HTTP requests stay in feature API clients and the shared transport", () => {
  for (const file of files(path.join(src, "features"))) {
    if (file.includes(path.sep + "api" + path.sep)) continue;
    assert.doesNotMatch(
      fs.readFileSync(file, "utf8"),
      /\bapi\.(get|post|put|patch|delete)\(/,
      path.relative(src, file),
    );
  }
});
