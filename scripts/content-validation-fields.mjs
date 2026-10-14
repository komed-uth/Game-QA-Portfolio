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
