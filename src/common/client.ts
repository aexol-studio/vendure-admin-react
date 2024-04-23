import { GraphQLError, GraphQLResponse, Thunder, ZeusScalars, chainOptions, fetchOptions } from '@/zeus';
const VTOKEN = 'vendure-admin-token';
export const CHTOKEN = 'vendure-token';
export let token: string | null = window.localStorage.getItem(VTOKEN);
export const channel: string | null = window.localStorage.getItem(CHTOKEN);

export const scalars = ZeusScalars({
  Money: {
    decode: (e) => e as number,
  },
  DateTime: {
    decode: (e: unknown) => new Date(e as string).toISOString(),
  },
});

//use 'http://localhost:3000/shop-api/' in local .env file for localhost development and provide env to use on prod/dev envs

export const VENDURE_HOST = `http://localhost:3000/admin-api`;
// export const VENDURE_HOST = `${'https://vendure-dev.aexol.com'}/admin-api`;

const apiFetchVendure =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    const additionalHeaders: Record<string, string> = token
      ? {
          'vendure-token': channel || 'default-channel',
          Authorization: `Bearer ${token}`,
        }
      : {};
    return fetch(`${options[0]}`, {
      ...fetchOptions,
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      },
    })
      .then((r) => {
        const authToken = r.headers.get('vendure-auth-token');
        if (authToken != null) {
          token = authToken;
          window.localStorage.setItem(VTOKEN, token);
        }
        return handleFetchResponse(r);
      })
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const VendureChain = (...options: chainOptions) => Thunder(apiFetchVendure(options));

const buildHeaders = (): Parameters<typeof VendureChain>[1] => {
  const channel = window.localStorage.getItem(CHTOKEN);

  return channel
    ? {
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': channel,
        },
      }
    : {
        headers: {
          'Content-Type': 'application/json',
        },
      };
};

export const adminApiQuery = (ctx: { locale: string } = { locale: 'en' }) => {
  const HOST = `${VENDURE_HOST}?languageCode=${ctx.locale}`;
  return VendureChain(HOST, {
    ...buildHeaders(),
  })('query', { scalars });
};

export const adminApiMutation = (ctx: { locale: string } = { locale: 'en' }) => {
  const HOST = `${VENDURE_HOST}?languageCode=${ctx.locale}`;
  return VendureChain(HOST, {
    ...buildHeaders(),
  })('mutation', { scalars });
};

const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const logOut = () => {
  window.localStorage.removeItem(VTOKEN);
  window.localStorage.removeItem(CHTOKEN);
  token = null;
};
