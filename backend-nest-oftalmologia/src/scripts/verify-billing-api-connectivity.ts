type HttpMethod = 'GET' | 'POST';

type Scenario = {
  name: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  body?: string;
};

type CliOptions = {
  baseUrl?: string;
  apiKey?: string;
  contributorId?: number;
  invalidContributorId?: number;
};

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  if (!arg) {
    return undefined;
  }
  return arg.slice(prefix.length).trim();
}

function parseOptionalNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCliOptions(): CliOptions {
  return {
    baseUrl: getArgValue('--base-url'),
    apiKey: getArgValue('--api-key'),
    contributorId: parseOptionalNumber(getArgValue('--contributor-id')),
    invalidContributorId: parseOptionalNumber(
      getArgValue('--invalid-contributor-id'),
    ),
  };
}

function normalizeBaseUrl(raw: string): string {
  const normalizedRaw = raw.trim().replace(/\/+$/, '');
  if (!normalizedRaw) {
    return '';
  }

  try {
    const parsed = new URL(normalizedRaw);
    const pathname = (parsed.pathname || '/').replace(/\/+$/, '') || '/';

    if (pathname === '/' || pathname === '/v1') {
      parsed.pathname = '/v1/api';
      return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
    }

    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return normalizedRaw;
  }
}

function buildScenarios(params: {
  apiKey: string;
  contributorId?: number;
  invalidContributorId?: number;
}): Scenario[] {
  const scenarios: Scenario[] = [
    {
      name: 'GET no-key',
      method: 'GET',
      path: '/billing/invoices?page=1&limit=1',
      headers: {},
    },
    {
      name: 'POST no-key empty-body',
      method: 'POST',
      path: '/billing/invoices',
      headers: {
        'content-type': 'application/json',
      },
      body: '{}',
    },
  ];

  if (!params.apiKey) {
    return scenarios;
  }

  scenarios.push(
    {
      name: 'GET key no contributor',
      method: 'GET',
      path: '/billing/invoices?page=1&limit=1',
      headers: {
        'x-api-key': params.apiKey,
      },
    },
    {
      name: 'POST key no contributor empty-body',
      method: 'POST',
      path: '/billing/invoices',
      headers: {
        'content-type': 'application/json',
        'x-api-key': params.apiKey,
      },
      body: '{}',
    },
  );

  if (Number.isFinite(params.contributorId)) {
    const contributorId = Number(params.contributorId);

    scenarios.push(
      {
        name: `GET key contributor=${contributorId}`,
        method: 'GET',
        path: `/billing/invoices?page=1&limit=1&contributor_id=${contributorId}`,
        headers: {
          'x-api-key': params.apiKey,
        },
      },
      {
        name: `POST key contributor=${contributorId} empty-body`,
        method: 'POST',
        path: '/billing/invoices',
        headers: {
          'content-type': 'application/json',
          'x-api-key': params.apiKey,
        },
        body: JSON.stringify({ contributor_id: contributorId }),
      },
    );
  }

  if (Number.isFinite(params.invalidContributorId)) {
    const invalidContributorId = Number(params.invalidContributorId);

    scenarios.push({
      name: `GET key contributor=${invalidContributorId}`,
      method: 'GET',
      path: `/billing/invoices?page=1&limit=1&contributor_id=${invalidContributorId}`,
      headers: {
        'x-api-key': params.apiKey,
      },
    });
  }

  return scenarios;
}

function compactBody(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 900);
}

async function run(): Promise<void> {
  const options = parseCliOptions();
  const rawBaseUrl =
    options.baseUrl ||
    process.env.BILLING_API_URL ||
    'https://api-billingdev.zgamestech.com/v1/api';

  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const apiKey =
    options.apiKey || process.env.BILLING_TEST_API_KEY || process.env.BILLING_API_KEY || '';
  const contributorId =
    options.contributorId ?? parseOptionalNumber(process.env.BILLING_CONTRIBUTOR_ID);
  const fallbackInvalidContributor = Number.isFinite(contributorId)
    ? Number(contributorId) + 99999
    : 99999;
  const invalidContributorId =
    options.invalidContributorId ??
    parseOptionalNumber(process.env.BILLING_INVALID_CONTRIBUTOR_ID) ??
    fallbackInvalidContributor;

  if (!baseUrl) {
    console.error('ERROR: BILLING_API_URL is empty.');
    process.exit(1);
  }

  console.log('=== zBilling connectivity check ===');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API key provided: ${apiKey ? 'yes' : 'no'}`);
  console.log(
    `Contributor: ${Number.isFinite(contributorId) ? contributorId : 'not provided'}`,
  );
  console.log(`Invalid contributor probe: ${invalidContributorId}`);

  const scenarios = buildScenarios({
    apiKey,
    contributorId,
    invalidContributorId,
  });

  for (const scenario of scenarios) {
    const url = `${baseUrl}${scenario.path}`;
    const startedAt = Date.now();
    const response = await fetch(url, {
      method: scenario.method,
      headers: scenario.headers,
      body: scenario.body,
    });
    const elapsedMs = Date.now() - startedAt;
    const rawText = await response.text();

    console.log('\n----------------------------------------');
    console.log(`Scenario: ${scenario.name}`);
    console.log(`Request: ${scenario.method} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log(`Elapsed: ${elapsedMs}ms`);
    console.log(`Body: ${compactBody(rawText)}`);
  }

  console.log('\nDone.');
}

run().catch((error) => {
  console.error('Unexpected error while testing zBilling connectivity.');
  console.error(error);
  process.exit(1);
});
