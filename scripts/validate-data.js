const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");

const FILES = [
  ["data/news/latest.json", "data/schemas/news.schema.json"],
  ["data/tenders/latest.json", "data/schemas/tenders.schema.json"],
  ["data/guides/index.json", "data/schemas/guides.schema.json"],
  ["data/meta/build.json", "data/schemas/build.schema.json"],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function createAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat(
    "date-time",
    (value) => typeof value === "string" && !Number.isNaN(Date.parse(value)),
  );
  ajv.addFormat("uri", (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  });
  return ajv;
}

function validateAll(root = path.join(__dirname, "..")) {
  const ajv = createAjv();
  const errors = [];
  for (const [dataRelative, schemaRelative] of FILES) {
    try {
      const data = readJson(path.join(root, dataRelative));
      const schema = readJson(path.join(root, schemaRelative));
      const validate = ajv.compile(schema);
      if (!validate(data)) {
        for (const error of validate.errors || []) {
          errors.push(
            `${dataRelative}${error.instancePath || "/"} ${error.message}`,
          );
        }
      }
    } catch (error) {
      errors.push(`${dataRelative}: ${error.message}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

if (require.main === module) {
  const result = validateAll();
  if (!result.valid) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${FILES.length} public data files.`);
  }
}

module.exports = { validateAll, createAjv };
