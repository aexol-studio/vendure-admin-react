import { scalars } from '@/graphql/scalars';
import { useSettings } from '@/state/settings';
import { GraphQLError, GraphQLResponse, Thunder, chainOptions, fetchOptions } from '@/zeus';

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
    const token = useSettings.getState().token;
    const logIn = useSettings.getState().logIn;
    const selectedChannel = useSettings.getState().selectedChannel;
    const additionalHeaders: Record<string, string> = token
      ? {
          ...(selectedChannel && { 'vendure-token': selectedChannel.token }),
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
        if (authToken !== null) {
          logIn(authToken);
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
  const channel = useSettings.getState().selectedChannel;

  return channel
    ? {
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': channel.token,
        },
      }
    : {
        headers: {
          'Content-Type': 'application/json',
        },
      };
};
const buildURL = (language: string): string => `${VENDURE_HOST}?languageCode=${language}`;

export const adminApiQuery = VendureChain(buildURL(useSettings.getState().language), {
  ...buildHeaders(),
})('query', { scalars });
export const adminApiMutation = VendureChain(buildURL(useSettings.getState().language), {
  ...buildHeaders(),
})('mutation', { scalars });

const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};
