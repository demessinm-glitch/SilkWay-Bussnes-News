const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function atomicWriteJson(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(temporary, payload, "utf8");
  try {
    fs.renameSync(temporary, filePath);
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}

function itemsOf(value, key = "items") {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.[key]) ? value[key] : [];
}

function publishJsonSafely(filePath, nextValue, options = {}) {
  const current = readJson(filePath, { items: [] });
  const itemsKey = options.itemsKey || "items";
  const existingItems = itemsOf(current, itemsKey);
  const nextItems = itemsOf(nextValue, itemsKey);
  const failedEmptyResult =
    existingItems.length &&
    !nextItems.length &&
    options.collectionSucceeded === false;
  const unexpectedEmptyResult =
    !nextItems.length && options.rejectEmpty === true;
  if (failedEmptyResult || unexpectedEmptyResult) {
    throw new Error(
      "Refusing to replace valid data with an empty collection result",
    );
  }
  atomicWriteJson(filePath, nextValue);
}

module.exports = { atomicWriteJson, itemsOf, publishJsonSafely, readJson };
