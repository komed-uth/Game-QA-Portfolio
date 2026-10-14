import path from "node:path";
import { stat } from "node:fs/promises";

export function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requiredString(value, context, errors) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${context}: required non-empty string is missing.`);
  }
}

export function registerIdentity(value, identities, context, label, errors) {
  if (typeof value !== "string" || value.trim().length === 0) return;
  if (identities.has(value)) {
    errors.push(`${context}: duplicate ${label} ${JSON.stringify(value)}.`);
  }
  identities.add(value);
}

export async function validateMediaPath(pathValue, context, publicDirectory, errors) {
  if (typeof pathValue !== "string" || pathValue.trim().length === 0) {
    errors.push(`${context}: required local media path is missing.`);
    return;
  }
  if (/[\\?#]/.test(pathValue)) {
    errors.push(`${context}: use a local asset path with forward slashes, without query or fragment syntax.`);
    return;
  }

  const normalizedReference = pathValue.replaceAll("\\", "/");
  if (normalizedReference.split("/").includes("..")) {
    errors.push(`${context}: must stay within public/ and cannot contain parent-directory segments.`);
    return;
  }
  const resolvedPublicDirectory = path.resolve(publicDirectory);
  const resolvedAssetPath = path.resolve(resolvedPublicDirectory, normalizedReference);
  const relativeAssetPath = path.relative(resolvedPublicDirectory, resolvedAssetPath);
  if (
    path.isAbsolute(normalizedReference) ||
    relativeAssetPath === ".." ||
    relativeAssetPath.startsWith(`..${path.sep}`) ||
    relativeAssetPath.length === 0
  ) {
    errors.push(`${context}: must be a local path inside public/.`);
    return;
  }

  try {
    if (!(await stat(resolvedAssetPath)).isFile()) {
      errors.push(`${context}: local media file does not exist: public/${normalizedReference}.`);
    }
  } catch {
    errors.push(`${context}: local media file does not exist: public/${normalizedReference}.`);
  }
}

export function records(value, context, errors, { nonempty = true } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) {
    errors.push(`${context}: required ordered record list is missing${nonempty ? " or empty" : ""}.`);
    return [];
  }
  const ids = new Set();
  return value.filter((record, index) => {
    if (!isObject(record)) {
      errors.push(`${context}[${index}]: required record is missing.`);
      return false;
    }
    const location = `${context}[${JSON.stringify(record.id ?? index)}].id`;
    requiredString(record.id, location, errors);
    if (typeof record.id === "string" && !/^[a-z][a-z0-9-]*$/.test(record.id)) {
      errors.push(`${location}: use a lowercase stable identity with letters, numbers, and hyphens.`);
    }
    registerIdentity(record.id, ids, location, "record identity", errors);
    return true;
  });
}
