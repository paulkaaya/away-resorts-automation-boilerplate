import { expect, test } from '@base';
import { auditLinks, collectInternalLinks } from '@utils/linkAudit';
import { parseStructuredData, validateHomepageSchema } from '@utils/structuredData';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

test.describe('page audit helpers', () => {
  let server: Server;
  let origin: string;

  test.beforeAll(async () => {
    server = createServer((request, response) => {
      const path = request.url;
      if (path === '/redirect') {
        response.writeHead(302, { location: '/ok' });
      } else if (path === '/redirect-broken') {
        response.writeHead(302, { location: '/missing' });
      } else if (path === '/external') {
        response.writeHead(302, { location: 'https://example.com/' });
      } else if (path === '/action') {
        response.writeHead(302, { location: '/account/logout/' });
      } else if (path === '/loop') {
        response.writeHead(302, { location: '/loop' });
      } else if (path === '/network-error') {
        request.socket.destroy();
        return;
      } else {
        response.writeHead(path === '/missing' ? 404 : 200);
      }
      response.end();
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  });

  test('normalizes links while excluding external, fragment and action destinations', () => {
    expect(
      collectInternalLinks(
        [
          '/ok#one',
          '/ok#two',
          '/ok?park=7',
          'child',
          '',
          '#section',
          'mailto:test@example.com',
          'tel:012345',
          'javascript:void(0)',
          'https://example.com/',
          '/account/logout/',
          '/book/',
        ],
        `${origin}/landing/`
      )
    ).toEqual([`${origin}/ok`, `${origin}/ok?park=7`, `${origin}/landing/child`]);
    expect(collectInternalLinks(['#only'], origin)).toEqual([]);
    expect(() => collectInternalLinks(['http://[invalid'], origin)).toThrow('Invalid link');
  });

  test('preserves independent same-origin hosts when resolving links', () => {
    expect(collectInternalLinks(['/ok'], 'https://awayresorts.co.uk/')).toEqual([
      'https://awayresorts.co.uk/ok',
    ]);
  });

  test('follows successful redirects and aggregates broken or unsafe destinations', async ({
    request,
  }) => {
    expect(await auditLinks(request, [`${origin}/ok`, `${origin}/redirect`], origin)).toEqual([]);
    const failures = await auditLinks(
      request,
      ['/missing', '/redirect-broken', '/external', '/action', '/loop', '/network-error'].map(
        path => `${origin}${path}`
      ),
      origin
    );
    expect(failures).toHaveLength(6);
    expect(failures.join('\n')).toContain('HTTP 404');
    expect(failures.join('\n')).toContain('Redirect to excluded destination');
    expect(failures.join('\n')).toContain('Redirect limit exceeded');
  });

  const website = {
    '@type': 'WebSite',
    name: 'Away Resorts',
    url: 'https://www.awayresorts.co.uk/',
  };
  const organization = { ...website, '@type': ['Organization'] };
  const trip = { '@type': 'TouristTrip', name: 'England', description: 'Holiday parks' };
  const graph = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [website, organization, trip],
  });

  test('accepts multiple scripts, arrays and graph containers', () => {
    expect(
      parseStructuredData([
        JSON.stringify({ '@context': 'https://schema.org', ...trip }),
        JSON.stringify(
          [website, organization].map(node => ({ '@context': 'http://schema.org', ...node }))
        ),
      ])
    ).toHaveLength(3);
    expect(validateHomepageSchema([graph], website.url)).toEqual([]);
  });

  test('reports absent and malformed schema instead of passing vacuously', () => {
    expect(() => parseStructuredData([])).toThrow('No JSON-LD');
    expect(() => parseStructuredData(['{broken'])).toThrow('script 1');
    expect(() => parseStructuredData(['[]'])).toThrow('Empty JSON-LD');
    expect(() => parseStructuredData(['{}'])).toThrow('@context');
    expect(
      validateHomepageSchema(
        [JSON.stringify({ '@context': 'https://schema.org', ...trip })],
        website.url
      )
    ).toContain('Missing WebSite entity');
    expect(validateHomepageSchema([graph], 'https://incorrect.example/').join('\n')).toContain(
      'WebSite.url must be'
    );
    expect(
      validateHomepageSchema([graph.replace('Away Resorts', '')], website.url).join('\n')
    ).toContain('WebSite.name must be a nonempty string');
  });
});
