/** Form alanı id'si — benzersiz ve tutarlı */
export function fieldId(prefix, name) {
  return `${prefix}-${String(name).replace(/[^a-z0-9-]/gi, '-')}`;
}
