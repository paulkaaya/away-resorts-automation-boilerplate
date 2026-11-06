type SchemaNode = Record<string, unknown>;

/**
 * Parses all JSON-LD scripts, accepting object, array and graph containers.
 * @param scripts - Text content of every JSON-LD script on the page.
 * @returns Typed entities, including nested entities; throws with the offending script number.
 */
export function parseStructuredData(scripts: string[]): SchemaNode[] {
  if (!scripts.length) throw new Error('No JSON-LD scripts found');
  const nodes: SchemaNode[] = [];
  /**
   * Collects typed entities recursively, including nested trips and graph nodes.
   * @param value - Parsed JSON value to traverse.
   */
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      const node = value as SchemaNode;
      if (node['@type']) nodes.push(node);
      Object.values(node).forEach(visit);
    }
  }
  scripts.forEach((script, index) => {
    try {
      const value: unknown = JSON.parse(script);
      if (!value || typeof value !== 'object') throw new Error('Expected object or array');
      const roots = Array.isArray(value) ? value : [value];
      if (!roots.length) throw new Error('Empty JSON-LD array');
      for (const root of roots) {
        if (!root || typeof root !== 'object') throw new Error('Expected JSON-LD object');
        const context = (root as SchemaNode)['@context'];
        if (
          !['http://schema.org', 'https://schema.org', 'https://schema.org/'].includes(
            context as string
          )
        ) {
          throw new Error('Expected a schema.org @context');
        }
      }
      visit(value);
    } catch (error) {
      throw new Error(`JSON-LD script ${index + 1}: ${String(error)}`);
    }
  });
  return nodes;
}

/**
 * Checks the observed homepage contract, not full schema.org or Google rich-result eligibility.
 * Canonical identities stay on production even when the page is visited on pre-production.
 * @param scripts - All JSON-LD script contents.
 * @param canonicalUrl - Expected public homepage identity.
 * @returns Contract failures without snapshotting volatile marketing copy or inventory counts.
 */
export function validateHomepageSchema(scripts: string[], canonicalUrl: string): string[] {
  const nodes = parseStructuredData(scripts);
  const failures: string[] = [];
  for (const type of ['WebSite', 'Organization', 'TouristTrip']) {
    const matches = nodes.filter(node => [node['@type']].flat().includes(type));
    if (!matches.length) failures.push(`Missing ${type} entity`);
    for (const node of matches) {
      for (const field of ['name', ...(type === 'TouristTrip' ? ['description'] : ['url'])]) {
        if (typeof node[field] !== 'string' || !(node[field] as string).trim()) {
          failures.push(`${type}.${field} must be a nonempty string`);
        }
      }
      if (type !== 'TouristTrip' && node.url !== canonicalUrl) {
        failures.push(`${type}.url must be ${canonicalUrl}, received ${String(node.url)}`);
      }
    }
  }
  return failures;
}
