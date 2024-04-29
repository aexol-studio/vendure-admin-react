/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
export const HOST = "http://localhost:3000/admin-api"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
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

export const apiFetch =
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
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: (Z & ValueTypes[R]) | ValueTypes[R],
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) =>
    fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (graphqlOptions?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: graphqlOptions.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: (Z & ValueTypes[R]) | ValueTypes[R],
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
    if (returnedFunction?.on && graphqlOptions?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
          if (graphqlOptions?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: graphqlOptions.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: (Z & ValueTypes[R]) | ValueTypes[R],
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariablesDeep<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariablesDeep<Query[K]>> }[keyof Query]>;

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariablesDeep<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = GraphQLTypes["StockMovement"] | GraphQLTypes["PaginatedList"] | GraphQLTypes["Node"] | GraphQLTypes["ErrorResult"] | GraphQLTypes["CustomField"] | GraphQLTypes["Region"]
export type ScalarCoders = {
	JSON?: ScalarResolver;
	DateTime?: ScalarResolver;
	Upload?: ScalarResolver;
	Money?: ScalarResolver;
}
type ZEUS_UNIONS = GraphQLTypes["CreateAssetResult"] | GraphQLTypes["NativeAuthenticationResult"] | GraphQLTypes["AuthenticationResult"] | GraphQLTypes["CreateChannelResult"] | GraphQLTypes["UpdateChannelResult"] | GraphQLTypes["CreateCustomerResult"] | GraphQLTypes["UpdateCustomerResult"] | GraphQLTypes["RemoveFacetFromChannelResult"] | GraphQLTypes["UpdateGlobalSettingsResult"] | GraphQLTypes["TransitionOrderToStateResult"] | GraphQLTypes["SettlePaymentResult"] | GraphQLTypes["CancelPaymentResult"] | GraphQLTypes["AddFulfillmentToOrderResult"] | GraphQLTypes["CancelOrderResult"] | GraphQLTypes["RefundOrderResult"] | GraphQLTypes["SettleRefundResult"] | GraphQLTypes["TransitionFulfillmentToStateResult"] | GraphQLTypes["TransitionPaymentToStateResult"] | GraphQLTypes["ModifyOrderResult"] | GraphQLTypes["AddManualPaymentToOrderResult"] | GraphQLTypes["SetCustomerForDraftOrderResult"] | GraphQLTypes["RemoveOptionGroupFromProductResult"] | GraphQLTypes["CreatePromotionResult"] | GraphQLTypes["UpdatePromotionResult"] | GraphQLTypes["StockMovementItem"] | GraphQLTypes["UpdateOrderItemsResult"] | GraphQLTypes["RemoveOrderItemsResult"] | GraphQLTypes["SetOrderShippingMethodResult"] | GraphQLTypes["ApplyCouponCodeResult"] | GraphQLTypes["CustomFieldConfig"] | GraphQLTypes["SearchResultPrice"]

export type ValueTypes = {
    ["Query"]: AliasType<{
administrators?: [{	options?: ValueTypes["AdministratorListOptions"] | undefined | null | Variable<any, string>},ValueTypes["AdministratorList"]],
administrator?: [{	id: string | Variable<any, string>},ValueTypes["Administrator"]],
	activeAdministrator?:ValueTypes["Administrator"],
assets?: [{	options?: ValueTypes["AssetListOptions"] | undefined | null | Variable<any, string>},ValueTypes["AssetList"]],
asset?: [{	id: string | Variable<any, string>},ValueTypes["Asset"]],
	me?:ValueTypes["CurrentUser"],
channels?: [{	options?: ValueTypes["ChannelListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ChannelList"]],
channel?: [{	id: string | Variable<any, string>},ValueTypes["Channel"]],
	activeChannel?:ValueTypes["Channel"],
collections?: [{	options?: ValueTypes["CollectionListOptions"] | undefined | null | Variable<any, string>},ValueTypes["CollectionList"]],
collection?: [{	id?: string | undefined | null | Variable<any, string>,	slug?: string | undefined | null | Variable<any, string>},ValueTypes["Collection"]],
	collectionFilters?:ValueTypes["ConfigurableOperationDefinition"],
previewCollectionVariants?: [{	input: ValueTypes["PreviewCollectionVariantsInput"] | Variable<any, string>,	options?: ValueTypes["ProductVariantListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProductVariantList"]],
countries?: [{	options?: ValueTypes["CountryListOptions"] | undefined | null | Variable<any, string>},ValueTypes["CountryList"]],
country?: [{	id: string | Variable<any, string>},ValueTypes["Country"]],
customerGroups?: [{	options?: ValueTypes["CustomerGroupListOptions"] | undefined | null | Variable<any, string>},ValueTypes["CustomerGroupList"]],
customerGroup?: [{	id: string | Variable<any, string>},ValueTypes["CustomerGroup"]],
customers?: [{	options?: ValueTypes["CustomerListOptions"] | undefined | null | Variable<any, string>},ValueTypes["CustomerList"]],
customer?: [{	id: string | Variable<any, string>},ValueTypes["Customer"]],
facets?: [{	options?: ValueTypes["FacetListOptions"] | undefined | null | Variable<any, string>},ValueTypes["FacetList"]],
facet?: [{	id: string | Variable<any, string>},ValueTypes["Facet"]],
facetValues?: [{	options?: ValueTypes["FacetValueListOptions"] | undefined | null | Variable<any, string>},ValueTypes["FacetValueList"]],
	globalSettings?:ValueTypes["GlobalSettings"],
job?: [{	jobId: string | Variable<any, string>},ValueTypes["Job"]],
jobs?: [{	options?: ValueTypes["JobListOptions"] | undefined | null | Variable<any, string>},ValueTypes["JobList"]],
jobsById?: [{	jobIds: Array<string> | Variable<any, string>},ValueTypes["Job"]],
	jobQueues?:ValueTypes["JobQueue"],
jobBufferSize?: [{	bufferIds?: Array<string> | undefined | null | Variable<any, string>},ValueTypes["JobBufferSize"]],
order?: [{	id: string | Variable<any, string>},ValueTypes["Order"]],
orders?: [{	options?: ValueTypes["OrderListOptions"] | undefined | null | Variable<any, string>},ValueTypes["OrderList"]],
eligibleShippingMethodsForDraftOrder?: [{	orderId: string | Variable<any, string>},ValueTypes["ShippingMethodQuote"]],
paymentMethods?: [{	options?: ValueTypes["PaymentMethodListOptions"] | undefined | null | Variable<any, string>},ValueTypes["PaymentMethodList"]],
paymentMethod?: [{	id: string | Variable<any, string>},ValueTypes["PaymentMethod"]],
	paymentMethodEligibilityCheckers?:ValueTypes["ConfigurableOperationDefinition"],
	paymentMethodHandlers?:ValueTypes["ConfigurableOperationDefinition"],
productOptionGroups?: [{	filterTerm?: string | undefined | null | Variable<any, string>},ValueTypes["ProductOptionGroup"]],
productOptionGroup?: [{	id: string | Variable<any, string>},ValueTypes["ProductOptionGroup"]],
search?: [{	input: ValueTypes["SearchInput"] | Variable<any, string>},ValueTypes["SearchResponse"]],
	pendingSearchIndexUpdates?:boolean | `@${string}`,
products?: [{	options?: ValueTypes["ProductListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProductList"]],
product?: [{	id?: string | undefined | null | Variable<any, string>,	slug?: string | undefined | null | Variable<any, string>},ValueTypes["Product"]],
productVariants?: [{	options?: ValueTypes["ProductVariantListOptions"] | undefined | null | Variable<any, string>,	productId?: string | undefined | null | Variable<any, string>},ValueTypes["ProductVariantList"]],
productVariant?: [{	id: string | Variable<any, string>},ValueTypes["ProductVariant"]],
promotion?: [{	id: string | Variable<any, string>},ValueTypes["Promotion"]],
promotions?: [{	options?: ValueTypes["PromotionListOptions"] | undefined | null | Variable<any, string>},ValueTypes["PromotionList"]],
	promotionConditions?:ValueTypes["ConfigurableOperationDefinition"],
	promotionActions?:ValueTypes["ConfigurableOperationDefinition"],
provinces?: [{	options?: ValueTypes["ProvinceListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProvinceList"]],
province?: [{	id: string | Variable<any, string>},ValueTypes["Province"]],
roles?: [{	options?: ValueTypes["RoleListOptions"] | undefined | null | Variable<any, string>},ValueTypes["RoleList"]],
role?: [{	id: string | Variable<any, string>},ValueTypes["Role"]],
sellers?: [{	options?: ValueTypes["SellerListOptions"] | undefined | null | Variable<any, string>},ValueTypes["SellerList"]],
seller?: [{	id: string | Variable<any, string>},ValueTypes["Seller"]],
shippingMethods?: [{	options?: ValueTypes["ShippingMethodListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ShippingMethodList"]],
shippingMethod?: [{	id: string | Variable<any, string>},ValueTypes["ShippingMethod"]],
	shippingEligibilityCheckers?:ValueTypes["ConfigurableOperationDefinition"],
	shippingCalculators?:ValueTypes["ConfigurableOperationDefinition"],
	fulfillmentHandlers?:ValueTypes["ConfigurableOperationDefinition"],
testShippingMethod?: [{	input: ValueTypes["TestShippingMethodInput"] | Variable<any, string>},ValueTypes["TestShippingMethodResult"]],
testEligibleShippingMethods?: [{	input: ValueTypes["TestEligibleShippingMethodsInput"] | Variable<any, string>},ValueTypes["ShippingMethodQuote"]],
stockLocation?: [{	id: string | Variable<any, string>},ValueTypes["StockLocation"]],
stockLocations?: [{	options?: ValueTypes["StockLocationListOptions"] | undefined | null | Variable<any, string>},ValueTypes["StockLocationList"]],
tag?: [{	id: string | Variable<any, string>},ValueTypes["Tag"]],
tags?: [{	options?: ValueTypes["TagListOptions"] | undefined | null | Variable<any, string>},ValueTypes["TagList"]],
taxCategories?: [{	options?: ValueTypes["TaxCategoryListOptions"] | undefined | null | Variable<any, string>},ValueTypes["TaxCategoryList"]],
taxCategory?: [{	id: string | Variable<any, string>},ValueTypes["TaxCategory"]],
taxRates?: [{	options?: ValueTypes["TaxRateListOptions"] | undefined | null | Variable<any, string>},ValueTypes["TaxRateList"]],
taxRate?: [{	id: string | Variable<any, string>},ValueTypes["TaxRate"]],
zones?: [{	options?: ValueTypes["ZoneListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ZoneList"]],
zone?: [{	id: string | Variable<any, string>},ValueTypes["Zone"]],
metricSummary?: [{	input?: ValueTypes["MetricSummaryInput"] | undefined | null | Variable<any, string>},ValueTypes["MetricSummary"]],
page?: [{	id: string | Variable<any, string>},ValueTypes["Page"]],
pages?: [{	options?: ValueTypes["PageListOptions"] | undefined | null | Variable<any, string>},ValueTypes["PageList"]],
announcementBar?: [{	id: string | Variable<any, string>},ValueTypes["AnnouncementBar"]],
announcementBars?: [{	options?: ValueTypes["AnnouncementBarListOptions"] | undefined | null | Variable<any, string>},ValueTypes["AnnouncementBarList"]],
	getActiveAnnouncementBar?:ValueTypes["AnnouncementBar"],
wishlist?: [{	id: string | Variable<any, string>},ValueTypes["Wishlist"]],
wishlists?: [{	options?: ValueTypes["WishlistListOptions"] | undefined | null | Variable<any, string>},ValueTypes["WishlistList"]],
mostWishedProducts?: [{	options?: ValueTypes["ProductListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProductList"]],
getRealizationURL?: [{	orderID: string | Variable<any, string>},boolean | `@${string}`],
getProformaURL?: [{	orderID: string | Variable<any, string>},boolean | `@${string}`],
newsletterSubscribers?: [{	options?: ValueTypes["NewsletterSubscriberListOptions"] | undefined | null | Variable<any, string>},ValueTypes["NewsletterSubscriberList"]],
backInStockSubscribers?: [{	options?: ValueTypes["BackInStockSubscriberListOptions"] | undefined | null | Variable<any, string>},ValueTypes["BackInStockSubscriberList"]],
b2bSubscribers?: [{	options?: ValueTypes["B2BSubscriberListOptions"] | undefined | null | Variable<any, string>},ValueTypes["B2BSubscriberList"]],
	haveNotSeenNewsletterSubscribers?:boolean | `@${string}`,
	haveNotSeenBackInStockSubscribers?:boolean | `@${string}`,
	haveNotSeenB2BSubscribers?:boolean | `@${string}`,
model?: [{	id: string | Variable<any, string>},ValueTypes["Model"]],
models?: [{	options?: ValueTypes["ModelListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ModelList"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createAdministrator?: [{	input: ValueTypes["CreateAdministratorInput"] | Variable<any, string>},ValueTypes["Administrator"]],
updateAdministrator?: [{	input: ValueTypes["UpdateAdministratorInput"] | Variable<any, string>},ValueTypes["Administrator"]],
updateActiveAdministrator?: [{	input: ValueTypes["UpdateActiveAdministratorInput"] | Variable<any, string>},ValueTypes["Administrator"]],
deleteAdministrator?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteAdministrators?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignRoleToAdministrator?: [{	administratorId: string | Variable<any, string>,	roleId: string | Variable<any, string>},ValueTypes["Administrator"]],
createAssets?: [{	input: Array<ValueTypes["CreateAssetInput"]> | Variable<any, string>},ValueTypes["CreateAssetResult"]],
updateAsset?: [{	input: ValueTypes["UpdateAssetInput"] | Variable<any, string>},ValueTypes["Asset"]],
deleteAsset?: [{	input: ValueTypes["DeleteAssetInput"] | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteAssets?: [{	input: ValueTypes["DeleteAssetsInput"] | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignAssetsToChannel?: [{	input: ValueTypes["AssignAssetsToChannelInput"] | Variable<any, string>},ValueTypes["Asset"]],
login?: [{	username: string | Variable<any, string>,	password: string | Variable<any, string>,	rememberMe?: boolean | undefined | null | Variable<any, string>},ValueTypes["NativeAuthenticationResult"]],
authenticate?: [{	input: ValueTypes["AuthenticationInput"] | Variable<any, string>,	rememberMe?: boolean | undefined | null | Variable<any, string>},ValueTypes["AuthenticationResult"]],
	logout?:ValueTypes["Success"],
createChannel?: [{	input: ValueTypes["CreateChannelInput"] | Variable<any, string>},ValueTypes["CreateChannelResult"]],
updateChannel?: [{	input: ValueTypes["UpdateChannelInput"] | Variable<any, string>},ValueTypes["UpdateChannelResult"]],
deleteChannel?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteChannels?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createCollection?: [{	input: ValueTypes["CreateCollectionInput"] | Variable<any, string>},ValueTypes["Collection"]],
updateCollection?: [{	input: ValueTypes["UpdateCollectionInput"] | Variable<any, string>},ValueTypes["Collection"]],
deleteCollection?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteCollections?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
moveCollection?: [{	input: ValueTypes["MoveCollectionInput"] | Variable<any, string>},ValueTypes["Collection"]],
assignCollectionsToChannel?: [{	input: ValueTypes["AssignCollectionsToChannelInput"] | Variable<any, string>},ValueTypes["Collection"]],
removeCollectionsFromChannel?: [{	input: ValueTypes["RemoveCollectionsFromChannelInput"] | Variable<any, string>},ValueTypes["Collection"]],
createCountry?: [{	input: ValueTypes["CreateCountryInput"] | Variable<any, string>},ValueTypes["Country"]],
updateCountry?: [{	input: ValueTypes["UpdateCountryInput"] | Variable<any, string>},ValueTypes["Country"]],
deleteCountry?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteCountries?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createCustomerGroup?: [{	input: ValueTypes["CreateCustomerGroupInput"] | Variable<any, string>},ValueTypes["CustomerGroup"]],
updateCustomerGroup?: [{	input: ValueTypes["UpdateCustomerGroupInput"] | Variable<any, string>},ValueTypes["CustomerGroup"]],
deleteCustomerGroup?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteCustomerGroups?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
addCustomersToGroup?: [{	customerGroupId: string | Variable<any, string>,	customerIds: Array<string> | Variable<any, string>},ValueTypes["CustomerGroup"]],
removeCustomersFromGroup?: [{	customerGroupId: string | Variable<any, string>,	customerIds: Array<string> | Variable<any, string>},ValueTypes["CustomerGroup"]],
createCustomer?: [{	input: ValueTypes["CreateCustomerInput"] | Variable<any, string>,	password?: string | undefined | null | Variable<any, string>},ValueTypes["CreateCustomerResult"]],
updateCustomer?: [{	input: ValueTypes["UpdateCustomerInput"] | Variable<any, string>},ValueTypes["UpdateCustomerResult"]],
deleteCustomer?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteCustomers?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createCustomerAddress?: [{	customerId: string | Variable<any, string>,	input: ValueTypes["CreateAddressInput"] | Variable<any, string>},ValueTypes["Address"]],
updateCustomerAddress?: [{	input: ValueTypes["UpdateAddressInput"] | Variable<any, string>},ValueTypes["Address"]],
deleteCustomerAddress?: [{	id: string | Variable<any, string>},ValueTypes["Success"]],
addNoteToCustomer?: [{	input: ValueTypes["AddNoteToCustomerInput"] | Variable<any, string>},ValueTypes["Customer"]],
updateCustomerNote?: [{	input: ValueTypes["UpdateCustomerNoteInput"] | Variable<any, string>},ValueTypes["HistoryEntry"]],
deleteCustomerNote?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
createFacet?: [{	input: ValueTypes["CreateFacetInput"] | Variable<any, string>},ValueTypes["Facet"]],
updateFacet?: [{	input: ValueTypes["UpdateFacetInput"] | Variable<any, string>},ValueTypes["Facet"]],
deleteFacet?: [{	id: string | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteFacets?: [{	ids: Array<string> | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["DeletionResponse"]],
createFacetValues?: [{	input: Array<ValueTypes["CreateFacetValueInput"]> | Variable<any, string>},ValueTypes["FacetValue"]],
updateFacetValues?: [{	input: Array<ValueTypes["UpdateFacetValueInput"]> | Variable<any, string>},ValueTypes["FacetValue"]],
deleteFacetValues?: [{	ids: Array<string> | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignFacetsToChannel?: [{	input: ValueTypes["AssignFacetsToChannelInput"] | Variable<any, string>},ValueTypes["Facet"]],
removeFacetsFromChannel?: [{	input: ValueTypes["RemoveFacetsFromChannelInput"] | Variable<any, string>},ValueTypes["RemoveFacetFromChannelResult"]],
updateGlobalSettings?: [{	input: ValueTypes["UpdateGlobalSettingsInput"] | Variable<any, string>},ValueTypes["UpdateGlobalSettingsResult"]],
importProducts?: [{	csvFile: ValueTypes["Upload"] | Variable<any, string>},ValueTypes["ImportInfo"]],
removeSettledJobs?: [{	queueNames?: Array<string> | undefined | null | Variable<any, string>,	olderThan?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
cancelJob?: [{	jobId: string | Variable<any, string>},ValueTypes["Job"]],
flushBufferedJobs?: [{	bufferIds?: Array<string> | undefined | null | Variable<any, string>},ValueTypes["Success"]],
settlePayment?: [{	id: string | Variable<any, string>},ValueTypes["SettlePaymentResult"]],
cancelPayment?: [{	id: string | Variable<any, string>},ValueTypes["CancelPaymentResult"]],
addFulfillmentToOrder?: [{	input: ValueTypes["FulfillOrderInput"] | Variable<any, string>},ValueTypes["AddFulfillmentToOrderResult"]],
cancelOrder?: [{	input: ValueTypes["CancelOrderInput"] | Variable<any, string>},ValueTypes["CancelOrderResult"]],
refundOrder?: [{	input: ValueTypes["RefundOrderInput"] | Variable<any, string>},ValueTypes["RefundOrderResult"]],
settleRefund?: [{	input: ValueTypes["SettleRefundInput"] | Variable<any, string>},ValueTypes["SettleRefundResult"]],
addNoteToOrder?: [{	input: ValueTypes["AddNoteToOrderInput"] | Variable<any, string>},ValueTypes["Order"]],
updateOrderNote?: [{	input: ValueTypes["UpdateOrderNoteInput"] | Variable<any, string>},ValueTypes["HistoryEntry"]],
deleteOrderNote?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
transitionOrderToState?: [{	id: string | Variable<any, string>,	state: string | Variable<any, string>},ValueTypes["TransitionOrderToStateResult"]],
transitionFulfillmentToState?: [{	id: string | Variable<any, string>,	state: string | Variable<any, string>},ValueTypes["TransitionFulfillmentToStateResult"]],
transitionPaymentToState?: [{	id: string | Variable<any, string>,	state: string | Variable<any, string>},ValueTypes["TransitionPaymentToStateResult"]],
setOrderCustomFields?: [{	input: ValueTypes["UpdateOrderInput"] | Variable<any, string>},ValueTypes["Order"]],
modifyOrder?: [{	input: ValueTypes["ModifyOrderInput"] | Variable<any, string>},ValueTypes["ModifyOrderResult"]],
addManualPaymentToOrder?: [{	input: ValueTypes["ManualPaymentInput"] | Variable<any, string>},ValueTypes["AddManualPaymentToOrderResult"]],
	/** Creates a draft Order */
	createDraftOrder?:ValueTypes["Order"],
deleteDraftOrder?: [{	orderId: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
addItemToDraftOrder?: [{	orderId: string | Variable<any, string>,	input: ValueTypes["AddItemToDraftOrderInput"] | Variable<any, string>},ValueTypes["UpdateOrderItemsResult"]],
adjustDraftOrderLine?: [{	orderId: string | Variable<any, string>,	input: ValueTypes["AdjustDraftOrderLineInput"] | Variable<any, string>},ValueTypes["UpdateOrderItemsResult"]],
removeDraftOrderLine?: [{	orderId: string | Variable<any, string>,	orderLineId: string | Variable<any, string>},ValueTypes["RemoveOrderItemsResult"]],
setCustomerForDraftOrder?: [{	orderId: string | Variable<any, string>,	customerId?: string | undefined | null | Variable<any, string>,	input?: ValueTypes["CreateCustomerInput"] | undefined | null | Variable<any, string>},ValueTypes["SetCustomerForDraftOrderResult"]],
setDraftOrderShippingAddress?: [{	orderId: string | Variable<any, string>,	input: ValueTypes["CreateAddressInput"] | Variable<any, string>},ValueTypes["Order"]],
setDraftOrderBillingAddress?: [{	orderId: string | Variable<any, string>,	input: ValueTypes["CreateAddressInput"] | Variable<any, string>},ValueTypes["Order"]],
setDraftOrderCustomFields?: [{	orderId: string | Variable<any, string>,	input: ValueTypes["UpdateOrderInput"] | Variable<any, string>},ValueTypes["Order"]],
applyCouponCodeToDraftOrder?: [{	orderId: string | Variable<any, string>,	couponCode: string | Variable<any, string>},ValueTypes["ApplyCouponCodeResult"]],
removeCouponCodeFromDraftOrder?: [{	orderId: string | Variable<any, string>,	couponCode: string | Variable<any, string>},ValueTypes["Order"]],
setDraftOrderShippingMethod?: [{	orderId: string | Variable<any, string>,	shippingMethodId: string | Variable<any, string>},ValueTypes["SetOrderShippingMethodResult"]],
createPaymentMethod?: [{	input: ValueTypes["CreatePaymentMethodInput"] | Variable<any, string>},ValueTypes["PaymentMethod"]],
updatePaymentMethod?: [{	input: ValueTypes["UpdatePaymentMethodInput"] | Variable<any, string>},ValueTypes["PaymentMethod"]],
deletePaymentMethod?: [{	id: string | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["DeletionResponse"]],
deletePaymentMethods?: [{	ids: Array<string> | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignPaymentMethodsToChannel?: [{	input: ValueTypes["AssignPaymentMethodsToChannelInput"] | Variable<any, string>},ValueTypes["PaymentMethod"]],
removePaymentMethodsFromChannel?: [{	input: ValueTypes["RemovePaymentMethodsFromChannelInput"] | Variable<any, string>},ValueTypes["PaymentMethod"]],
createProductOptionGroup?: [{	input: ValueTypes["CreateProductOptionGroupInput"] | Variable<any, string>},ValueTypes["ProductOptionGroup"]],
updateProductOptionGroup?: [{	input: ValueTypes["UpdateProductOptionGroupInput"] | Variable<any, string>},ValueTypes["ProductOptionGroup"]],
createProductOption?: [{	input: ValueTypes["CreateProductOptionInput"] | Variable<any, string>},ValueTypes["ProductOption"]],
updateProductOption?: [{	input: ValueTypes["UpdateProductOptionInput"] | Variable<any, string>},ValueTypes["ProductOption"]],
deleteProductOption?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
	reindex?:ValueTypes["Job"],
	runPendingSearchIndexUpdates?:ValueTypes["Success"],
createProduct?: [{	input: ValueTypes["CreateProductInput"] | Variable<any, string>},ValueTypes["Product"]],
updateProduct?: [{	input: ValueTypes["UpdateProductInput"] | Variable<any, string>},ValueTypes["Product"]],
updateProducts?: [{	input: Array<ValueTypes["UpdateProductInput"]> | Variable<any, string>},ValueTypes["Product"]],
deleteProduct?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteProducts?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
addOptionGroupToProduct?: [{	productId: string | Variable<any, string>,	optionGroupId: string | Variable<any, string>},ValueTypes["Product"]],
removeOptionGroupFromProduct?: [{	productId: string | Variable<any, string>,	optionGroupId: string | Variable<any, string>,	force?: boolean | undefined | null | Variable<any, string>},ValueTypes["RemoveOptionGroupFromProductResult"]],
createProductVariants?: [{	input: Array<ValueTypes["CreateProductVariantInput"]> | Variable<any, string>},ValueTypes["ProductVariant"]],
updateProductVariants?: [{	input: Array<ValueTypes["UpdateProductVariantInput"]> | Variable<any, string>},ValueTypes["ProductVariant"]],
deleteProductVariant?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteProductVariants?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignProductsToChannel?: [{	input: ValueTypes["AssignProductsToChannelInput"] | Variable<any, string>},ValueTypes["Product"]],
removeProductsFromChannel?: [{	input: ValueTypes["RemoveProductsFromChannelInput"] | Variable<any, string>},ValueTypes["Product"]],
assignProductVariantsToChannel?: [{	input: ValueTypes["AssignProductVariantsToChannelInput"] | Variable<any, string>},ValueTypes["ProductVariant"]],
removeProductVariantsFromChannel?: [{	input: ValueTypes["RemoveProductVariantsFromChannelInput"] | Variable<any, string>},ValueTypes["ProductVariant"]],
createPromotion?: [{	input: ValueTypes["CreatePromotionInput"] | Variable<any, string>},ValueTypes["CreatePromotionResult"]],
updatePromotion?: [{	input: ValueTypes["UpdatePromotionInput"] | Variable<any, string>},ValueTypes["UpdatePromotionResult"]],
deletePromotion?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deletePromotions?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignPromotionsToChannel?: [{	input: ValueTypes["AssignPromotionsToChannelInput"] | Variable<any, string>},ValueTypes["Promotion"]],
removePromotionsFromChannel?: [{	input: ValueTypes["RemovePromotionsFromChannelInput"] | Variable<any, string>},ValueTypes["Promotion"]],
createProvince?: [{	input: ValueTypes["CreateProvinceInput"] | Variable<any, string>},ValueTypes["Province"]],
updateProvince?: [{	input: ValueTypes["UpdateProvinceInput"] | Variable<any, string>},ValueTypes["Province"]],
deleteProvince?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
createRole?: [{	input: ValueTypes["CreateRoleInput"] | Variable<any, string>},ValueTypes["Role"]],
updateRole?: [{	input: ValueTypes["UpdateRoleInput"] | Variable<any, string>},ValueTypes["Role"]],
deleteRole?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteRoles?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createSeller?: [{	input: ValueTypes["CreateSellerInput"] | Variable<any, string>},ValueTypes["Seller"]],
updateSeller?: [{	input: ValueTypes["UpdateSellerInput"] | Variable<any, string>},ValueTypes["Seller"]],
deleteSeller?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteSellers?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createShippingMethod?: [{	input: ValueTypes["CreateShippingMethodInput"] | Variable<any, string>},ValueTypes["ShippingMethod"]],
updateShippingMethod?: [{	input: ValueTypes["UpdateShippingMethodInput"] | Variable<any, string>},ValueTypes["ShippingMethod"]],
deleteShippingMethod?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteShippingMethods?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignShippingMethodsToChannel?: [{	input: ValueTypes["AssignShippingMethodsToChannelInput"] | Variable<any, string>},ValueTypes["ShippingMethod"]],
removeShippingMethodsFromChannel?: [{	input: ValueTypes["RemoveShippingMethodsFromChannelInput"] | Variable<any, string>},ValueTypes["ShippingMethod"]],
createStockLocation?: [{	input: ValueTypes["CreateStockLocationInput"] | Variable<any, string>},ValueTypes["StockLocation"]],
updateStockLocation?: [{	input: ValueTypes["UpdateStockLocationInput"] | Variable<any, string>},ValueTypes["StockLocation"]],
deleteStockLocation?: [{	input: ValueTypes["DeleteStockLocationInput"] | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteStockLocations?: [{	input: Array<ValueTypes["DeleteStockLocationInput"]> | Variable<any, string>},ValueTypes["DeletionResponse"]],
assignStockLocationsToChannel?: [{	input: ValueTypes["AssignStockLocationsToChannelInput"] | Variable<any, string>},ValueTypes["StockLocation"]],
removeStockLocationsFromChannel?: [{	input: ValueTypes["RemoveStockLocationsFromChannelInput"] | Variable<any, string>},ValueTypes["StockLocation"]],
createTag?: [{	input: ValueTypes["CreateTagInput"] | Variable<any, string>},ValueTypes["Tag"]],
updateTag?: [{	input: ValueTypes["UpdateTagInput"] | Variable<any, string>},ValueTypes["Tag"]],
deleteTag?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
createTaxCategory?: [{	input: ValueTypes["CreateTaxCategoryInput"] | Variable<any, string>},ValueTypes["TaxCategory"]],
updateTaxCategory?: [{	input: ValueTypes["UpdateTaxCategoryInput"] | Variable<any, string>},ValueTypes["TaxCategory"]],
deleteTaxCategory?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteTaxCategories?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createTaxRate?: [{	input: ValueTypes["CreateTaxRateInput"] | Variable<any, string>},ValueTypes["TaxRate"]],
updateTaxRate?: [{	input: ValueTypes["UpdateTaxRateInput"] | Variable<any, string>},ValueTypes["TaxRate"]],
deleteTaxRate?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteTaxRates?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
createZone?: [{	input: ValueTypes["CreateZoneInput"] | Variable<any, string>},ValueTypes["Zone"]],
updateZone?: [{	input: ValueTypes["UpdateZoneInput"] | Variable<any, string>},ValueTypes["Zone"]],
deleteZone?: [{	id: string | Variable<any, string>},ValueTypes["DeletionResponse"]],
deleteZones?: [{	ids: Array<string> | Variable<any, string>},ValueTypes["DeletionResponse"]],
addMembersToZone?: [{	zoneId: string | Variable<any, string>,	memberIds: Array<string> | Variable<any, string>},ValueTypes["Zone"]],
removeMembersFromZone?: [{	zoneId: string | Variable<any, string>,	memberIds: Array<string> | Variable<any, string>},ValueTypes["Zone"]],
updatePage?: [{	input: ValueTypes["UpdatePageInput"] | Variable<any, string>},ValueTypes["Page"]],
createPage?: [{	input: ValueTypes["CreatePageInput"] | Variable<any, string>},ValueTypes["Page"]],
deletePage?: [{	input: ValueTypes["DeletePageInput"] | Variable<any, string>},boolean | `@${string}`],
updateAnnouncementBar?: [{	input: ValueTypes["UpdateAnnouncementBarInput"] | Variable<any, string>},ValueTypes["AnnouncementBar"]],
createAnnouncementBar?: [{	input: ValueTypes["CreateAnnouncementBarInput"] | Variable<any, string>},ValueTypes["AnnouncementBar"]],
deleteAnnouncementBar?: [{	input: ValueTypes["DeleteAnnouncementBarInput"] | Variable<any, string>},boolean | `@${string}`],
changeStatusAnnouncementBar?: [{	input: ValueTypes["ChangeStatusAnnouncementBarInput"] | Variable<any, string>},boolean | `@${string}`],
registerRealization?: [{	input: ValueTypes["OrderRealizationInput"] | Variable<any, string>},ValueTypes["OrderRealization"]],
registerProforma?: [{	input: ValueTypes["RegisterProformaInput"] | Variable<any, string>},boolean | `@${string}`],
deleteNewsletterSubscriber?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
markNewsletterAsSeen?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
deleteBackInStockSubscriber?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
markBackInStockAsSeen?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
deleteB2BSubscriber?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
markB2BAsSeen?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
updateModel?: [{	input: ValueTypes["UpdateModelInput"] | Variable<any, string>},ValueTypes["Model"]],
createModel?: [{	input: ValueTypes["CreateModelInput"] | Variable<any, string>},ValueTypes["Model"]],
deleteModel?: [{	input: ValueTypes["DeleteModelInput"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["AdministratorListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["AdministratorSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["AdministratorFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateAdministratorInput"]: {
	firstName: string | Variable<any, string>,
	lastName: string | Variable<any, string>,
	emailAddress: string | Variable<any, string>,
	password: string | Variable<any, string>,
	roleIds: Array<string> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateAdministratorInput"]: {
	id: string | Variable<any, string>,
	firstName?: string | undefined | null | Variable<any, string>,
	lastName?: string | undefined | null | Variable<any, string>,
	emailAddress?: string | undefined | null | Variable<any, string>,
	password?: string | undefined | null | Variable<any, string>,
	roleIds?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateActiveAdministratorInput"]: {
	firstName?: string | undefined | null | Variable<any, string>,
	lastName?: string | undefined | null | Variable<any, string>,
	emailAddress?: string | undefined | null | Variable<any, string>,
	password?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["Administrator"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
	user?:ValueTypes["User"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AdministratorList"]: AliasType<{
	items?:ValueTypes["Administrator"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MimeTypeError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	fileName?:boolean | `@${string}`,
	mimeType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateAssetResult"]: AliasType<{		["...on Asset"] : ValueTypes["Asset"],
		["...on MimeTypeError"] : ValueTypes["MimeTypeError"]
		__typename?: boolean | `@${string}`
}>;
	["AssetListOptions"]: {
	tags?: Array<string> | undefined | null | Variable<any, string>,
	tagsOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["AssetSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["AssetFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateAssetInput"]: {
	file: ValueTypes["Upload"] | Variable<any, string>,
	tags?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CoordinateInput"]: {
	x: number | Variable<any, string>,
	y: number | Variable<any, string>
};
	["DeleteAssetInput"]: {
	assetId: string | Variable<any, string>,
	force?: boolean | undefined | null | Variable<any, string>,
	deleteFromAllChannels?: boolean | undefined | null | Variable<any, string>
};
	["DeleteAssetsInput"]: {
	assetIds: Array<string> | Variable<any, string>,
	force?: boolean | undefined | null | Variable<any, string>,
	deleteFromAllChannels?: boolean | undefined | null | Variable<any, string>
};
	["UpdateAssetInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	focalPoint?: ValueTypes["CoordinateInput"] | undefined | null | Variable<any, string>,
	tags?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AssignAssetsToChannelInput"]: {
	assetIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["AuthenticationInput"]: {
	native?: ValueTypes["NativeAuthInput"] | undefined | null | Variable<any, string>
};
	["NativeAuthenticationResult"]: AliasType<{		["...on CurrentUser"] : ValueTypes["CurrentUser"],
		["...on InvalidCredentialsError"] : ValueTypes["InvalidCredentialsError"],
		["...on NativeAuthStrategyError"] : ValueTypes["NativeAuthStrategyError"]
		__typename?: boolean | `@${string}`
}>;
	["AuthenticationResult"]: AliasType<{		["...on CurrentUser"] : ValueTypes["CurrentUser"],
		["...on InvalidCredentialsError"] : ValueTypes["InvalidCredentialsError"]
		__typename?: boolean | `@${string}`
}>;
	["ChannelList"]: AliasType<{
	items?:ValueTypes["Channel"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChannelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ChannelSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ChannelFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateChannelInput"]: {
	code: string | Variable<any, string>,
	token: string | Variable<any, string>,
	defaultLanguageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	availableLanguageCodes?: Array<ValueTypes["LanguageCode"]> | undefined | null | Variable<any, string>,
	pricesIncludeTax: boolean | Variable<any, string>,
	defaultCurrencyCode?: ValueTypes["CurrencyCode"] | undefined | null | Variable<any, string>,
	availableCurrencyCodes?: Array<ValueTypes["CurrencyCode"]> | undefined | null | Variable<any, string>,
	trackInventory?: boolean | undefined | null | Variable<any, string>,
	outOfStockThreshold?: number | undefined | null | Variable<any, string>,
	defaultTaxZoneId: string | Variable<any, string>,
	defaultShippingZoneId: string | Variable<any, string>,
	sellerId?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateChannelInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	token?: string | undefined | null | Variable<any, string>,
	defaultLanguageCode?: ValueTypes["LanguageCode"] | undefined | null | Variable<any, string>,
	availableLanguageCodes?: Array<ValueTypes["LanguageCode"]> | undefined | null | Variable<any, string>,
	pricesIncludeTax?: boolean | undefined | null | Variable<any, string>,
	defaultCurrencyCode?: ValueTypes["CurrencyCode"] | undefined | null | Variable<any, string>,
	availableCurrencyCodes?: Array<ValueTypes["CurrencyCode"]> | undefined | null | Variable<any, string>,
	trackInventory?: boolean | undefined | null | Variable<any, string>,
	outOfStockThreshold?: number | undefined | null | Variable<any, string>,
	defaultTaxZoneId?: string | undefined | null | Variable<any, string>,
	defaultShippingZoneId?: string | undefined | null | Variable<any, string>,
	sellerId?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	/** Returned if attempting to set a Channel's defaultLanguageCode to a language which is not enabled in GlobalSettings */
["LanguageNotAvailableError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateChannelResult"]: AliasType<{		["...on Channel"] : ValueTypes["Channel"],
		["...on LanguageNotAvailableError"] : ValueTypes["LanguageNotAvailableError"]
		__typename?: boolean | `@${string}`
}>;
	["UpdateChannelResult"]: AliasType<{		["...on Channel"] : ValueTypes["Channel"],
		["...on LanguageNotAvailableError"] : ValueTypes["LanguageNotAvailableError"]
		__typename?: boolean | `@${string}`
}>;
	["Collection"]: AliasType<{
	isPrivate?:boolean | `@${string}`,
	inheritFilters?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	breadcrumbs?:ValueTypes["CollectionBreadcrumb"],
	position?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	featuredAsset?:ValueTypes["Asset"],
	assets?:ValueTypes["Asset"],
	parent?:ValueTypes["Collection"],
	parentId?:boolean | `@${string}`,
	children?:ValueTypes["Collection"],
	filters?:ValueTypes["ConfigurableOperation"],
	translations?:ValueTypes["CollectionTranslation"],
productVariants?: [{	options?: ValueTypes["ProductVariantListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProductVariantList"]],
	customFields?:ValueTypes["CollectionCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionListOptions"]: {
	topLevelOnly?: boolean | undefined | null | Variable<any, string>,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["CollectionSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["CollectionFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["MoveCollectionInput"]: {
	collectionId: string | Variable<any, string>,
	parentId: string | Variable<any, string>,
	index: number | Variable<any, string>
};
	["CreateCollectionTranslationInput"]: {
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name: string | Variable<any, string>,
	slug: string | Variable<any, string>,
	description: string | Variable<any, string>,
	customFields?: ValueTypes["CreateCollectionTranslationInputCustomFields"] | undefined | null | Variable<any, string>
};
	["UpdateCollectionTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	slug?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateCollectionTranslationInputCustomFields"] | undefined | null | Variable<any, string>
};
	["CreateCollectionInput"]: {
	isPrivate?: boolean | undefined | null | Variable<any, string>,
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	parentId?: string | undefined | null | Variable<any, string>,
	inheritFilters?: boolean | undefined | null | Variable<any, string>,
	filters: Array<ValueTypes["ConfigurableOperationInput"]> | Variable<any, string>,
	translations: Array<ValueTypes["CreateCollectionTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["CreateCollectionCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["PreviewCollectionVariantsInput"]: {
	parentId?: string | undefined | null | Variable<any, string>,
	inheritFilters: boolean | Variable<any, string>,
	filters: Array<ValueTypes["ConfigurableOperationInput"]> | Variable<any, string>
};
	["UpdateCollectionInput"]: {
	id: string | Variable<any, string>,
	isPrivate?: boolean | undefined | null | Variable<any, string>,
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	parentId?: string | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	inheritFilters?: boolean | undefined | null | Variable<any, string>,
	filters?: Array<ValueTypes["ConfigurableOperationInput"]> | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["UpdateCollectionTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateCollectionCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["AssignCollectionsToChannelInput"]: {
	collectionIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemoveCollectionsFromChannelInput"]: {
	collectionIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["CountryTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateCountryInput"]: {
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["CountryTranslationInput"]> | Variable<any, string>,
	enabled: boolean | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateCountryInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["CountryTranslationInput"]> | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CountryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["CountrySortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["CountryFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["Customer"]: AliasType<{
	groups?:ValueTypes["CustomerGroup"],
history?: [{	options?: ValueTypes["HistoryEntryListOptions"] | undefined | null | Variable<any, string>},ValueTypes["HistoryEntryList"]],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	phoneNumber?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
	addresses?:ValueTypes["Address"],
orders?: [{	options?: ValueTypes["OrderListOptions"] | undefined | null | Variable<any, string>},ValueTypes["OrderList"]],
	user?:ValueTypes["User"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroupList"]: AliasType<{
	items?:ValueTypes["CustomerGroup"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroupListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["CustomerGroupSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["CustomerGroupFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateCustomerGroupInput"]: {
	name: string | Variable<any, string>,
	customerIds?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateCustomerGroupInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateCustomerInput"]: {
	id: string | Variable<any, string>,
	title?: string | undefined | null | Variable<any, string>,
	firstName?: string | undefined | null | Variable<any, string>,
	lastName?: string | undefined | null | Variable<any, string>,
	phoneNumber?: string | undefined | null | Variable<any, string>,
	emailAddress?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CustomerFilterParameter"]: {
	postalCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	firstName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	lastName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	phoneNumber?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	emailAddress?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["CustomerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["CustomerSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["CustomerFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["AddNoteToCustomerInput"]: {
	id: string | Variable<any, string>,
	note: string | Variable<any, string>,
	isPublic: boolean | Variable<any, string>
};
	["UpdateCustomerNoteInput"]: {
	noteId: string | Variable<any, string>,
	note: string | Variable<any, string>
};
	["CreateCustomerResult"]: AliasType<{		["...on Customer"] : ValueTypes["Customer"],
		["...on EmailAddressConflictError"] : ValueTypes["EmailAddressConflictError"]
		__typename?: boolean | `@${string}`
}>;
	["UpdateCustomerResult"]: AliasType<{		["...on Customer"] : ValueTypes["Customer"],
		["...on EmailAddressConflictError"] : ValueTypes["EmailAddressConflictError"]
		__typename?: boolean | `@${string}`
}>;
	["Facet"]: AliasType<{
	isPrivate?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	values?:ValueTypes["FacetValue"],
valueList?: [{	options?: ValueTypes["FacetValueListOptions"] | undefined | null | Variable<any, string>},ValueTypes["FacetValueList"]],
	translations?:ValueTypes["FacetTranslation"],
	customFields?:ValueTypes["FacetCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["FacetListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["FacetSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["FacetFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["FacetTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateFacetInput"]: {
	code: string | Variable<any, string>,
	isPrivate: boolean | Variable<any, string>,
	translations: Array<ValueTypes["FacetTranslationInput"]> | Variable<any, string>,
	values?: Array<ValueTypes["CreateFacetValueWithFacetInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["CreateFacetCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["UpdateFacetInput"]: {
	id: string | Variable<any, string>,
	isPrivate?: boolean | undefined | null | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["FacetTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateFacetCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["FacetValueTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateFacetValueWithFacetInput"]: {
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["FacetValueTranslationInput"]> | Variable<any, string>
};
	["CreateFacetValueInput"]: {
	facetId: string | Variable<any, string>,
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["FacetValueTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["CreateFacetValueCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["UpdateFacetValueInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["FacetValueTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateFacetValueCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["AssignFacetsToChannelInput"]: {
	facetIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemoveFacetsFromChannelInput"]: {
	facetIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>,
	force?: boolean | undefined | null | Variable<any, string>
};
	["FacetInUseError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	facetCode?:boolean | `@${string}`,
	productCount?:boolean | `@${string}`,
	variantCount?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveFacetFromChannelResult"]: AliasType<{		["...on Facet"] : ValueTypes["Facet"],
		["...on FacetInUseError"] : ValueTypes["FacetInUseError"]
		__typename?: boolean | `@${string}`
}>;
	["UpdateGlobalSettingsInput"]: {
	availableLanguages?: Array<ValueTypes["LanguageCode"]> | undefined | null | Variable<any, string>,
	trackInventory?: boolean | undefined | null | Variable<any, string>,
	outOfStockThreshold?: number | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	/** Returned when the default LanguageCode of a Channel is no longer found in the `availableLanguages`
of the GlobalSettings */
["ChannelDefaultLanguageError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	language?:boolean | `@${string}`,
	channelCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateGlobalSettingsResult"]: AliasType<{		["...on GlobalSettings"] : ValueTypes["GlobalSettings"],
		["...on ChannelDefaultLanguageError"] : ValueTypes["ChannelDefaultLanguageError"]
		__typename?: boolean | `@${string}`
}>;
	["GlobalSettings"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	availableLanguages?:boolean | `@${string}`,
	trackInventory?:boolean | `@${string}`,
	outOfStockThreshold?:boolean | `@${string}`,
	serverConfig?:ValueTypes["ServerConfig"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderProcessState"]: AliasType<{
	name?:boolean | `@${string}`,
	to?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PermissionDefinition"]: AliasType<{
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	assignable?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerConfig"]: AliasType<{
	orderProcess?:ValueTypes["OrderProcessState"],
	permittedAssetTypes?:boolean | `@${string}`,
	permissions?:ValueTypes["PermissionDefinition"],
	customFieldConfig?:ValueTypes["CustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntry"]: AliasType<{
	isPublic?:boolean | `@${string}`,
	administrator?:ValueTypes["Administrator"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImportInfo"]: AliasType<{
	errors?:boolean | `@${string}`,
	processed?:boolean | `@${string}`,
	imported?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JobBufferSize"]: AliasType<{
	bufferId?:boolean | `@${string}`,
	size?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** @description
The state of a Job in the JobQueue

@docsCategory common */
["JobState"]:JobState;
	["JobListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["JobSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["JobFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["JobList"]: AliasType<{
	items?:ValueTypes["Job"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Job"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	startedAt?:boolean | `@${string}`,
	settledAt?:boolean | `@${string}`,
	queueName?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	progress?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	result?:boolean | `@${string}`,
	error?:boolean | `@${string}`,
	isSettled?:boolean | `@${string}`,
	duration?:boolean | `@${string}`,
	retries?:boolean | `@${string}`,
	attempts?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JobQueue"]: AliasType<{
	name?:boolean | `@${string}`,
	running?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Order"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	modifications?:ValueTypes["OrderModification"],
	sellerOrders?:ValueTypes["Order"],
	aggregateOrder?:ValueTypes["Order"],
	aggregateOrderId?:boolean | `@${string}`,
	channels?:ValueTypes["Channel"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	/** The date & time that the Order was placed, i.e. the Customer
completed the checkout and the Order is no longer "active" */
	orderPlacedAt?:boolean | `@${string}`,
	/** A unique code for the Order */
	code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	/** An order is active as long as the payment process has not been completed */
	active?:boolean | `@${string}`,
	customer?:ValueTypes["Customer"],
	shippingAddress?:ValueTypes["OrderAddress"],
	billingAddress?:ValueTypes["OrderAddress"],
	lines?:ValueTypes["OrderLine"],
	/** Surcharges are arbitrary modifications to the Order total which are neither
ProductVariants nor discounts resulting from applied Promotions. For example,
one-off discounts based on customer interaction, or surcharges based on payment
methods. */
	surcharges?:ValueTypes["Surcharge"],
	discounts?:ValueTypes["Discount"],
	/** An array of all coupon codes applied to the Order */
	couponCodes?:boolean | `@${string}`,
	/** Promotions applied to the order. Only gets populated after the payment process has completed. */
	promotions?:ValueTypes["Promotion"],
	payments?:ValueTypes["Payment"],
	fulfillments?:ValueTypes["Fulfillment"],
	totalQuantity?:boolean | `@${string}`,
	/** The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
discounts which have been prorated (proportionally distributed) amongst the items of each OrderLine.
To get a total of all OrderLines which does not account for prorated discounts, use the
sum of `OrderLine.discountedLinePrice` values. */
	subTotal?:boolean | `@${string}`,
	/** Same as subTotal, but inclusive of tax */
	subTotalWithTax?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	shippingLines?:ValueTypes["ShippingLine"],
	shipping?:boolean | `@${string}`,
	shippingWithTax?:boolean | `@${string}`,
	/** Equal to subTotal plus shipping */
	total?:boolean | `@${string}`,
	/** The final payable amount. Equal to subTotalWithTax plus shippingWithTax */
	totalWithTax?:boolean | `@${string}`,
	/** A summary of the taxes being applied to this Order */
	taxSummary?:ValueTypes["OrderTaxSummary"],
history?: [{	options?: ValueTypes["HistoryEntryListOptions"] | undefined | null | Variable<any, string>},ValueTypes["HistoryEntryList"]],
	getRealization?:ValueTypes["OrderRealization"],
	getProforma?:boolean | `@${string}`,
	customFields?:ValueTypes["OrderCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["Fulfillment"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	lines?:ValueTypes["FulfillmentLine"],
	summary?:ValueTypes["FulfillmentLine"],
	state?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	trackingCode?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Payment"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	transactionId?:boolean | `@${string}`,
	errorMessage?:boolean | `@${string}`,
	refunds?:ValueTypes["Refund"],
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderModificationLine"]: AliasType<{
	orderLine?:ValueTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	modification?:ValueTypes["OrderModification"],
	modificationId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderModification"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	priceChange?:boolean | `@${string}`,
	note?:boolean | `@${string}`,
	lines?:ValueTypes["OrderModificationLine"],
	surcharges?:ValueTypes["Surcharge"],
	payment?:ValueTypes["Payment"],
	refund?:ValueTypes["Refund"],
	isSettled?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderFilterParameter"]: {
	customerLastName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	transactionId?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	aggregateOrderId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	orderPlacedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	state?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	active?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	totalQuantity?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	subTotal?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	subTotalWithTax?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	currencyCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	shipping?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	shippingWithTax?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	total?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	totalWithTax?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	getProforma?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	registeredOnCheckout?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	additionalInformation?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["OrderSortParameter"]: {
	customerLastName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	transactionId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	aggregateOrderId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	orderPlacedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	state?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	totalQuantity?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	subTotal?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	subTotalWithTax?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	shipping?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	shippingWithTax?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	total?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	totalWithTax?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	getProforma?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	registeredOnCheckout?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	selectedPaymentMethod?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	additionalInformation?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["OrderListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["OrderSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["OrderFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["UpdateOrderInput"]: {
	id: string | Variable<any, string>,
	customFields?: ValueTypes["UpdateOrderCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["FulfillOrderInput"]: {
	lines: Array<ValueTypes["OrderLineInput"]> | Variable<any, string>,
	handler: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>
};
	["CancelOrderInput"]: {
	/** The id of the order to be cancelled */
	orderId: string | Variable<any, string>,
	/** Optionally specify which OrderLines to cancel. If not provided, all OrderLines will be cancelled */
	lines?: Array<ValueTypes["OrderLineInput"]> | undefined | null | Variable<any, string>,
	/** Specify whether the shipping charges should also be cancelled. Defaults to false */
	cancelShipping?: boolean | undefined | null | Variable<any, string>,
	reason?: string | undefined | null | Variable<any, string>
};
	["RefundOrderInput"]: {
	lines: Array<ValueTypes["OrderLineInput"]> | Variable<any, string>,
	shipping: ValueTypes["Money"] | Variable<any, string>,
	adjustment: ValueTypes["Money"] | Variable<any, string>,
	paymentId: string | Variable<any, string>,
	reason?: string | undefined | null | Variable<any, string>
};
	["OrderLineInput"]: {
	orderLineId: string | Variable<any, string>,
	quantity: number | Variable<any, string>,
	customFields?: ValueTypes["OrderLineCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["SettleRefundInput"]: {
	id: string | Variable<any, string>,
	transactionId: string | Variable<any, string>
};
	["AddNoteToOrderInput"]: {
	id: string | Variable<any, string>,
	note: string | Variable<any, string>,
	isPublic: boolean | Variable<any, string>
};
	["UpdateOrderNoteInput"]: {
	noteId: string | Variable<any, string>,
	note?: string | undefined | null | Variable<any, string>,
	isPublic?: boolean | undefined | null | Variable<any, string>
};
	["AdministratorPaymentInput"]: {
	paymentMethod?: string | undefined | null | Variable<any, string>,
	metadata?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AdministratorRefundInput"]: {
	paymentId: string | Variable<any, string>,
	reason?: string | undefined | null | Variable<any, string>
};
	["ModifyOrderOptions"]: {
	freezePromotions?: boolean | undefined | null | Variable<any, string>,
	recalculateShipping?: boolean | undefined | null | Variable<any, string>
};
	["UpdateOrderAddressInput"]: {
	fullName?: string | undefined | null | Variable<any, string>,
	company?: string | undefined | null | Variable<any, string>,
	streetLine1?: string | undefined | null | Variable<any, string>,
	streetLine2?: string | undefined | null | Variable<any, string>,
	city?: string | undefined | null | Variable<any, string>,
	province?: string | undefined | null | Variable<any, string>,
	postalCode?: string | undefined | null | Variable<any, string>,
	countryCode?: string | undefined | null | Variable<any, string>,
	phoneNumber?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateAddressCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["ModifyOrderInput"]: {
	dryRun: boolean | Variable<any, string>,
	orderId: string | Variable<any, string>,
	addItems?: Array<ValueTypes["AddItemInput"]> | undefined | null | Variable<any, string>,
	adjustOrderLines?: Array<ValueTypes["OrderLineInput"]> | undefined | null | Variable<any, string>,
	surcharges?: Array<ValueTypes["SurchargeInput"]> | undefined | null | Variable<any, string>,
	updateShippingAddress?: ValueTypes["UpdateOrderAddressInput"] | undefined | null | Variable<any, string>,
	updateBillingAddress?: ValueTypes["UpdateOrderAddressInput"] | undefined | null | Variable<any, string>,
	note?: string | undefined | null | Variable<any, string>,
	refund?: ValueTypes["AdministratorRefundInput"] | undefined | null | Variable<any, string>,
	options?: ValueTypes["ModifyOrderOptions"] | undefined | null | Variable<any, string>,
	couponCodes?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateOrderCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["AddItemInput"]: {
	productVariantId: string | Variable<any, string>,
	quantity: number | Variable<any, string>,
	customFields?: ValueTypes["OrderLineCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["SurchargeInput"]: {
	description: string | Variable<any, string>,
	sku?: string | undefined | null | Variable<any, string>,
	price: ValueTypes["Money"] | Variable<any, string>,
	priceIncludesTax: boolean | Variable<any, string>,
	taxRate?: number | undefined | null | Variable<any, string>,
	taxDescription?: string | undefined | null | Variable<any, string>
};
	["ManualPaymentInput"]: {
	orderId: string | Variable<any, string>,
	method: string | Variable<any, string>,
	transactionId?: string | undefined | null | Variable<any, string>,
	metadata?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AddItemToDraftOrderInput"]: {
	productVariantId: string | Variable<any, string>,
	quantity: number | Variable<any, string>,
	customFields?: ValueTypes["OrderLineCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["AdjustDraftOrderLineInput"]: {
	orderLineId: string | Variable<any, string>,
	quantity: number | Variable<any, string>,
	customFields?: ValueTypes["OrderLineCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	/** Returned if the Payment settlement fails */
["SettlePaymentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	paymentErrorMessage?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the Payment cancellation fails */
["CancelPaymentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	paymentErrorMessage?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if no OrderLines have been specified for the operation */
["EmptyOrderLineSelectionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified items are already part of a Fulfillment */
["ItemsAlreadyFulfilledError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified FulfillmentHandler code is not valid */
["InvalidFulfillmentHandlerError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an error is thrown in a FulfillmentHandler's createFulfillment method */
["CreateFulfillmentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	fulfillmentHandlerError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if attempting to create a Fulfillment when there is insufficient
stockOnHand of a ProductVariant to satisfy the requested quantity. */
["InsufficientStockOnHandError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	productVariantId?:boolean | `@${string}`,
	productVariantName?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an operation has specified OrderLines from multiple Orders */
["MultipleOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to cancel lines from an Order which is still active */
["CancelActiveOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	orderState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund a Payment against OrderLines from a different Order */
["PaymentOrderMismatchError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an Order which is not in the expected state */
["RefundOrderStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	orderState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an Order but neither items nor shipping refund was specified */
["NothingToRefundError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an OrderItem which has already been refunded */
["AlreadyRefundedError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	refundId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified quantity of an OrderLine is greater than the number of items in that line */
["QuantityTooGreatError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Refund state */
["RefundStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Payment state */
["PaymentStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Fulfillment state */
["FulfillmentStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to modify the contents of an Order that is not in the `Modifying` state. */
["OrderModificationStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to specify any changes */
["NoChangesSpecifiedError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to include a paymentMethod even
though the price has increased as a result of the changes. */
["PaymentMethodMissingError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to include a refundPaymentId even
though the price has decreased as a result of the changes. */
["RefundPaymentIdMissingError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to addManualPaymentToOrder is made but the Order
is not in the required state. */
["ManualPaymentStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TransitionOrderToStateResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on OrderStateTransitionError"] : ValueTypes["OrderStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["SettlePaymentResult"]: AliasType<{		["...on Payment"] : ValueTypes["Payment"],
		["...on SettlePaymentError"] : ValueTypes["SettlePaymentError"],
		["...on PaymentStateTransitionError"] : ValueTypes["PaymentStateTransitionError"],
		["...on OrderStateTransitionError"] : ValueTypes["OrderStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["CancelPaymentResult"]: AliasType<{		["...on Payment"] : ValueTypes["Payment"],
		["...on CancelPaymentError"] : ValueTypes["CancelPaymentError"],
		["...on PaymentStateTransitionError"] : ValueTypes["PaymentStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["AddFulfillmentToOrderResult"]: AliasType<{		["...on Fulfillment"] : ValueTypes["Fulfillment"],
		["...on EmptyOrderLineSelectionError"] : ValueTypes["EmptyOrderLineSelectionError"],
		["...on ItemsAlreadyFulfilledError"] : ValueTypes["ItemsAlreadyFulfilledError"],
		["...on InsufficientStockOnHandError"] : ValueTypes["InsufficientStockOnHandError"],
		["...on InvalidFulfillmentHandlerError"] : ValueTypes["InvalidFulfillmentHandlerError"],
		["...on FulfillmentStateTransitionError"] : ValueTypes["FulfillmentStateTransitionError"],
		["...on CreateFulfillmentError"] : ValueTypes["CreateFulfillmentError"]
		__typename?: boolean | `@${string}`
}>;
	["CancelOrderResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on EmptyOrderLineSelectionError"] : ValueTypes["EmptyOrderLineSelectionError"],
		["...on QuantityTooGreatError"] : ValueTypes["QuantityTooGreatError"],
		["...on MultipleOrderError"] : ValueTypes["MultipleOrderError"],
		["...on CancelActiveOrderError"] : ValueTypes["CancelActiveOrderError"],
		["...on OrderStateTransitionError"] : ValueTypes["OrderStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["RefundOrderResult"]: AliasType<{		["...on Refund"] : ValueTypes["Refund"],
		["...on QuantityTooGreatError"] : ValueTypes["QuantityTooGreatError"],
		["...on NothingToRefundError"] : ValueTypes["NothingToRefundError"],
		["...on OrderStateTransitionError"] : ValueTypes["OrderStateTransitionError"],
		["...on MultipleOrderError"] : ValueTypes["MultipleOrderError"],
		["...on PaymentOrderMismatchError"] : ValueTypes["PaymentOrderMismatchError"],
		["...on RefundOrderStateError"] : ValueTypes["RefundOrderStateError"],
		["...on AlreadyRefundedError"] : ValueTypes["AlreadyRefundedError"],
		["...on RefundStateTransitionError"] : ValueTypes["RefundStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["SettleRefundResult"]: AliasType<{		["...on Refund"] : ValueTypes["Refund"],
		["...on RefundStateTransitionError"] : ValueTypes["RefundStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["TransitionFulfillmentToStateResult"]: AliasType<{		["...on Fulfillment"] : ValueTypes["Fulfillment"],
		["...on FulfillmentStateTransitionError"] : ValueTypes["FulfillmentStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["TransitionPaymentToStateResult"]: AliasType<{		["...on Payment"] : ValueTypes["Payment"],
		["...on PaymentStateTransitionError"] : ValueTypes["PaymentStateTransitionError"]
		__typename?: boolean | `@${string}`
}>;
	["ModifyOrderResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on NoChangesSpecifiedError"] : ValueTypes["NoChangesSpecifiedError"],
		["...on OrderModificationStateError"] : ValueTypes["OrderModificationStateError"],
		["...on PaymentMethodMissingError"] : ValueTypes["PaymentMethodMissingError"],
		["...on RefundPaymentIdMissingError"] : ValueTypes["RefundPaymentIdMissingError"],
		["...on OrderLimitError"] : ValueTypes["OrderLimitError"],
		["...on NegativeQuantityError"] : ValueTypes["NegativeQuantityError"],
		["...on InsufficientStockError"] : ValueTypes["InsufficientStockError"],
		["...on CouponCodeExpiredError"] : ValueTypes["CouponCodeExpiredError"],
		["...on CouponCodeInvalidError"] : ValueTypes["CouponCodeInvalidError"],
		["...on CouponCodeLimitError"] : ValueTypes["CouponCodeLimitError"]
		__typename?: boolean | `@${string}`
}>;
	["AddManualPaymentToOrderResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on ManualPaymentStateError"] : ValueTypes["ManualPaymentStateError"]
		__typename?: boolean | `@${string}`
}>;
	["SetCustomerForDraftOrderResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on EmailAddressConflictError"] : ValueTypes["EmailAddressConflictError"]
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodList"]: AliasType<{
	items?:ValueTypes["PaymentMethod"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["PaymentMethodSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["PaymentMethodFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["PaymentMethodTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["PaymentMethodTranslationInputCustomFields"] | undefined | null | Variable<any, string>
};
	["CreatePaymentMethodInput"]: {
	code: string | Variable<any, string>,
	enabled: boolean | Variable<any, string>,
	checker?: ValueTypes["ConfigurableOperationInput"] | undefined | null | Variable<any, string>,
	handler: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>,
	translations: Array<ValueTypes["PaymentMethodTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdatePaymentMethodInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	checker?: ValueTypes["ConfigurableOperationInput"] | undefined | null | Variable<any, string>,
	handler?: ValueTypes["ConfigurableOperationInput"] | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["PaymentMethodTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AssignPaymentMethodsToChannelInput"]: {
	paymentMethodIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemovePaymentMethodsFromChannelInput"]: {
	paymentMethodIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["Product"]: AliasType<{
	enabled?:boolean | `@${string}`,
	channels?:ValueTypes["Channel"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	featuredAsset?:ValueTypes["Asset"],
	assets?:ValueTypes["Asset"],
	/** Returns all ProductVariants */
	variants?:ValueTypes["ProductVariant"],
variantList?: [{	options?: ValueTypes["ProductVariantListOptions"] | undefined | null | Variable<any, string>},ValueTypes["ProductVariantList"]],
	optionGroups?:ValueTypes["ProductOptionGroup"],
	facetValues?:ValueTypes["FacetValue"],
	translations?:ValueTypes["ProductTranslation"],
	collections?:ValueTypes["Collection"],
	customFields?:ValueTypes["ProductCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantPrice"]: AliasType<{
	currencyCode?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariant"]: AliasType<{
	enabled?:boolean | `@${string}`,
	trackInventory?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
	stockAllocated?:boolean | `@${string}`,
	outOfStockThreshold?:boolean | `@${string}`,
	useGlobalOutOfStockThreshold?:boolean | `@${string}`,
	prices?:ValueTypes["ProductVariantPrice"],
	stockLevels?:ValueTypes["StockLevel"],
stockMovements?: [{	options?: ValueTypes["StockMovementListOptions"] | undefined | null | Variable<any, string>},ValueTypes["StockMovementList"]],
	channels?:ValueTypes["Channel"],
	id?:boolean | `@${string}`,
	product?:ValueTypes["Product"],
	productId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	featuredAsset?:ValueTypes["Asset"],
	assets?:ValueTypes["Asset"],
	price?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	stockLevel?:boolean | `@${string}`,
	taxRateApplied?:ValueTypes["TaxRate"],
	taxCategory?:ValueTypes["TaxCategory"],
	options?:ValueTypes["ProductOption"],
	facetValues?:ValueTypes["FacetValue"],
	translations?:ValueTypes["ProductVariantTranslation"],
	omnibusPrice?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroupTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateProductOptionGroupInput"]: {
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["ProductOptionGroupTranslationInput"]> | Variable<any, string>,
	options: Array<ValueTypes["CreateGroupOptionInput"]> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateProductOptionGroupInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ProductOptionGroupTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["ProductOptionTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateGroupOptionInput"]: {
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["ProductOptionGroupTranslationInput"]> | Variable<any, string>
};
	["CreateProductOptionInput"]: {
	productOptionGroupId: string | Variable<any, string>,
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["ProductOptionGroupTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["CreateProductOptionCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["UpdateProductOptionInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ProductOptionGroupTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateProductOptionCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["SearchResult"]: AliasType<{
	enabled?:boolean | `@${string}`,
	/** An array of ids of the Channels in which this result appears */
	channelIds?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	productName?:boolean | `@${string}`,
	productAsset?:ValueTypes["SearchResultAsset"],
	productVariantId?:boolean | `@${string}`,
	productVariantName?:boolean | `@${string}`,
	productVariantAsset?:ValueTypes["SearchResultAsset"],
	price?:ValueTypes["SearchResultPrice"],
	priceWithTax?:ValueTypes["SearchResultPrice"],
	currencyCode?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	facetIds?:boolean | `@${string}`,
	facetValueIds?:boolean | `@${string}`,
	/** An array of ids of the Collections in which this result appears */
	collectionIds?:boolean | `@${string}`,
	/** A relevance score for the result. Differs between database implementations */
	score?:boolean | `@${string}`,
	inStock?:boolean | `@${string}`,
	omnibusPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementListOptions"]: {
	type?: ValueTypes["StockMovementType"] | undefined | null | Variable<any, string>,
	skip?: number | undefined | null | Variable<any, string>,
	take?: number | undefined | null | Variable<any, string>
};
	["ProductListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ProductSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ProductFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["ProductFilterParameter"]: {
	facetValueId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seoTitle?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seoDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	optionsOrder?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	sizes?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	finish?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	materials?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	payment?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	delivery?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	realization?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	discountBy?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>
};
	["ProductVariantListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ProductVariantSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ProductVariantFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["ProductVariantFilterParameter"]: {
	facetValueId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	trackInventory?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	stockOnHand?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	stockAllocated?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	outOfStockThreshold?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	useGlobalOutOfStockThreshold?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	productId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	sku?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	price?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	currencyCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	priceWithTax?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	stockLevel?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	omnibusPrice?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>
};
	["ProductTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	slug?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["ProductTranslationInputCustomFields"] | undefined | null | Variable<any, string>
};
	["CreateProductInput"]: {
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	facetValueIds?: Array<string> | undefined | null | Variable<any, string>,
	translations: Array<ValueTypes["ProductTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["CreateProductCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["UpdateProductInput"]: {
	id: string | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	facetValueIds?: Array<string> | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ProductTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateProductCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	["ProductVariantTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateProductVariantOptionInput"]: {
	optionGroupId: string | Variable<any, string>,
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["ProductOptionTranslationInput"]> | Variable<any, string>
};
	["StockLevelInput"]: {
	stockLocationId: string | Variable<any, string>,
	stockOnHand: number | Variable<any, string>
};
	/** Used to set up update the price of a ProductVariant in a particular Channel.
If the `delete` flag is `true`, the price will be deleted for the given Channel. */
["ProductVariantPriceInput"]: {
	currencyCode: ValueTypes["CurrencyCode"] | Variable<any, string>,
	price: ValueTypes["Money"] | Variable<any, string>,
	delete?: boolean | undefined | null | Variable<any, string>
};
	["CreateProductVariantInput"]: {
	productId: string | Variable<any, string>,
	translations: Array<ValueTypes["ProductVariantTranslationInput"]> | Variable<any, string>,
	facetValueIds?: Array<string> | undefined | null | Variable<any, string>,
	sku: string | Variable<any, string>,
	price?: ValueTypes["Money"] | undefined | null | Variable<any, string>,
	taxCategoryId?: string | undefined | null | Variable<any, string>,
	optionIds?: Array<string> | undefined | null | Variable<any, string>,
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	stockOnHand?: number | undefined | null | Variable<any, string>,
	stockLevels?: Array<ValueTypes["StockLevelInput"]> | undefined | null | Variable<any, string>,
	outOfStockThreshold?: number | undefined | null | Variable<any, string>,
	useGlobalOutOfStockThreshold?: boolean | undefined | null | Variable<any, string>,
	trackInventory?: ValueTypes["GlobalFlag"] | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateProductVariantInput"]: {
	id: string | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ProductVariantTranslationInput"]> | undefined | null | Variable<any, string>,
	facetValueIds?: Array<string> | undefined | null | Variable<any, string>,
	optionIds?: Array<string> | undefined | null | Variable<any, string>,
	sku?: string | undefined | null | Variable<any, string>,
	taxCategoryId?: string | undefined | null | Variable<any, string>,
	/** Sets the price for the ProductVariant in the Channel's default currency */
	price?: ValueTypes["Money"] | undefined | null | Variable<any, string>,
	/** Allows multiple prices to be set for the ProductVariant in different currencies. */
	prices?: Array<ValueTypes["ProductVariantPriceInput"]> | undefined | null | Variable<any, string>,
	featuredAssetId?: string | undefined | null | Variable<any, string>,
	assetIds?: Array<string> | undefined | null | Variable<any, string>,
	stockOnHand?: number | undefined | null | Variable<any, string>,
	stockLevels?: Array<ValueTypes["StockLevelInput"]> | undefined | null | Variable<any, string>,
	outOfStockThreshold?: number | undefined | null | Variable<any, string>,
	useGlobalOutOfStockThreshold?: boolean | undefined | null | Variable<any, string>,
	trackInventory?: ValueTypes["GlobalFlag"] | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AssignProductsToChannelInput"]: {
	productIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>,
	priceFactor?: number | undefined | null | Variable<any, string>
};
	["RemoveProductsFromChannelInput"]: {
	productIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["AssignProductVariantsToChannelInput"]: {
	productVariantIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>,
	priceFactor?: number | undefined | null | Variable<any, string>
};
	["RemoveProductVariantsFromChannelInput"]: {
	productVariantIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["ProductOptionInUseError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	optionGroupCode?:boolean | `@${string}`,
	productVariantCount?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveOptionGroupFromProductResult"]: AliasType<{		["...on Product"] : ValueTypes["Product"],
		["...on ProductOptionInUseError"] : ValueTypes["ProductOptionInUseError"]
		__typename?: boolean | `@${string}`
}>;
	["PromotionListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["PromotionSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["PromotionFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["PromotionTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreatePromotionInput"]: {
	enabled: boolean | Variable<any, string>,
	startsAt?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	endsAt?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	couponCode?: string | undefined | null | Variable<any, string>,
	perCustomerUsageLimit?: number | undefined | null | Variable<any, string>,
	usageLimit?: number | undefined | null | Variable<any, string>,
	conditions: Array<ValueTypes["ConfigurableOperationInput"]> | Variable<any, string>,
	actions: Array<ValueTypes["ConfigurableOperationInput"]> | Variable<any, string>,
	translations: Array<ValueTypes["PromotionTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdatePromotionInput"]: {
	id: string | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	startsAt?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	endsAt?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	couponCode?: string | undefined | null | Variable<any, string>,
	perCustomerUsageLimit?: number | undefined | null | Variable<any, string>,
	usageLimit?: number | undefined | null | Variable<any, string>,
	conditions?: Array<ValueTypes["ConfigurableOperationInput"]> | undefined | null | Variable<any, string>,
	actions?: Array<ValueTypes["ConfigurableOperationInput"]> | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["PromotionTranslationInput"]> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["AssignPromotionsToChannelInput"]: {
	promotionIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemovePromotionsFromChannelInput"]: {
	promotionIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	/** Returned if a PromotionCondition has neither a couponCode nor any conditions set */
["MissingConditionsError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreatePromotionResult"]: AliasType<{		["...on Promotion"] : ValueTypes["Promotion"],
		["...on MissingConditionsError"] : ValueTypes["MissingConditionsError"]
		__typename?: boolean | `@${string}`
}>;
	["UpdatePromotionResult"]: AliasType<{		["...on Promotion"] : ValueTypes["Promotion"],
		["...on MissingConditionsError"] : ValueTypes["MissingConditionsError"]
		__typename?: boolean | `@${string}`
}>;
	["ProvinceTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["CreateProvinceInput"]: {
	code: string | Variable<any, string>,
	translations: Array<ValueTypes["ProvinceTranslationInput"]> | Variable<any, string>,
	enabled: boolean | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateProvinceInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ProvinceTranslationInput"]> | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["ProvinceListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ProvinceSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ProvinceFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["RoleListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["RoleSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["RoleFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateRoleInput"]: {
	code: string | Variable<any, string>,
	description: string | Variable<any, string>,
	permissions: Array<ValueTypes["Permission"]> | Variable<any, string>,
	channelIds?: Array<string> | undefined | null | Variable<any, string>
};
	["UpdateRoleInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	permissions?: Array<ValueTypes["Permission"]> | undefined | null | Variable<any, string>,
	channelIds?: Array<string> | undefined | null | Variable<any, string>
};
	["SellerList"]: AliasType<{
	items?:ValueTypes["Seller"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SellerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["SellerSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["SellerFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateSellerInput"]: {
	name: string | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateSellerInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["ShippingMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ShippingMethodSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ShippingMethodFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["ShippingMethodTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["ShippingMethodTranslationInputCustomFields"] | undefined | null | Variable<any, string>
};
	["CreateShippingMethodInput"]: {
	code: string | Variable<any, string>,
	fulfillmentHandler: string | Variable<any, string>,
	checker: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>,
	calculator: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>,
	translations: Array<ValueTypes["ShippingMethodTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateShippingMethodInput"]: {
	id: string | Variable<any, string>,
	code?: string | undefined | null | Variable<any, string>,
	fulfillmentHandler?: string | undefined | null | Variable<any, string>,
	checker?: ValueTypes["ConfigurableOperationInput"] | undefined | null | Variable<any, string>,
	calculator?: ValueTypes["ConfigurableOperationInput"] | undefined | null | Variable<any, string>,
	translations: Array<ValueTypes["ShippingMethodTranslationInput"]> | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["TestShippingMethodInput"]: {
	checker: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>,
	calculator: ValueTypes["ConfigurableOperationInput"] | Variable<any, string>,
	shippingAddress: ValueTypes["CreateAddressInput"] | Variable<any, string>,
	lines: Array<ValueTypes["TestShippingMethodOrderLineInput"]> | Variable<any, string>
};
	["TestEligibleShippingMethodsInput"]: {
	shippingAddress: ValueTypes["CreateAddressInput"] | Variable<any, string>,
	lines: Array<ValueTypes["TestShippingMethodOrderLineInput"]> | Variable<any, string>
};
	["TestShippingMethodOrderLineInput"]: {
	productVariantId: string | Variable<any, string>,
	quantity: number | Variable<any, string>
};
	["TestShippingMethodResult"]: AliasType<{
	eligible?:boolean | `@${string}`,
	quote?:ValueTypes["TestShippingMethodQuote"],
		__typename?: boolean | `@${string}`
}>;
	["TestShippingMethodQuote"]: AliasType<{
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssignShippingMethodsToChannelInput"]: {
	shippingMethodIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemoveShippingMethodsFromChannelInput"]: {
	shippingMethodIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["StockLevel"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	stockLocationId?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
	stockAllocated?:boolean | `@${string}`,
	stockLocation?:ValueTypes["StockLocation"],
		__typename?: boolean | `@${string}`
}>;
	["StockLocationListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["StockLocationSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["StockLocationFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["StockLocationList"]: AliasType<{
	items?:ValueTypes["StockLocation"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateStockLocationInput"]: {
	name: string | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateStockLocationInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["DeleteStockLocationInput"]: {
	id: string | Variable<any, string>,
	transferToLocationId?: string | undefined | null | Variable<any, string>
};
	["AssignStockLocationsToChannelInput"]: {
	stockLocationIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["RemoveStockLocationsFromChannelInput"]: {
	stockLocationIds: Array<string> | Variable<any, string>,
	channelId: string | Variable<any, string>
};
	["StockLocation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementType"]:StockMovementType;
	["StockMovement"]:AliasType<{
		id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`;
		['...on StockAdjustment']?: Omit<ValueTypes["StockAdjustment"],keyof ValueTypes["StockMovement"]>;
		['...on Allocation']?: Omit<ValueTypes["Allocation"],keyof ValueTypes["StockMovement"]>;
		['...on Sale']?: Omit<ValueTypes["Sale"],keyof ValueTypes["StockMovement"]>;
		['...on Cancellation']?: Omit<ValueTypes["Cancellation"],keyof ValueTypes["StockMovement"]>;
		['...on Return']?: Omit<ValueTypes["Return"],keyof ValueTypes["StockMovement"]>;
		['...on Release']?: Omit<ValueTypes["Release"],keyof ValueTypes["StockMovement"]>;
		__typename?: boolean | `@${string}`
}>;
	["StockAdjustment"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Allocation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	orderLine?:ValueTypes["OrderLine"],
		__typename?: boolean | `@${string}`
}>;
	["Sale"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Cancellation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	orderLine?:ValueTypes["OrderLine"],
		__typename?: boolean | `@${string}`
}>;
	["Return"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Release"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementItem"]: AliasType<{		["...on StockAdjustment"] : ValueTypes["StockAdjustment"],
		["...on Allocation"] : ValueTypes["Allocation"],
		["...on Sale"] : ValueTypes["Sale"],
		["...on Cancellation"] : ValueTypes["Cancellation"],
		["...on Return"] : ValueTypes["Return"],
		["...on Release"] : ValueTypes["Release"]
		__typename?: boolean | `@${string}`
}>;
	["StockMovementList"]: AliasType<{
	items?:ValueTypes["StockMovementItem"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TagListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["TagSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["TagFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateTagInput"]: {
	value: string | Variable<any, string>
};
	["UpdateTagInput"]: {
	id: string | Variable<any, string>,
	value?: string | undefined | null | Variable<any, string>
};
	["TaxCategoryList"]: AliasType<{
	items?:ValueTypes["TaxCategory"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxCategoryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["TaxCategorySortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["TaxCategoryFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateTaxCategoryInput"]: {
	name: string | Variable<any, string>,
	isDefault?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateTaxCategoryInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	isDefault?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["TaxRateListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["TaxRateSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["TaxRateFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateTaxRateInput"]: {
	name: string | Variable<any, string>,
	enabled: boolean | Variable<any, string>,
	value: number | Variable<any, string>,
	categoryId: string | Variable<any, string>,
	zoneId: string | Variable<any, string>,
	customerGroupId?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateTaxRateInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	value?: number | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	categoryId?: string | undefined | null | Variable<any, string>,
	zoneId?: string | undefined | null | Variable<any, string>,
	customerGroupId?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["ZoneList"]: AliasType<{
	items?:ValueTypes["Zone"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ZoneListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ZoneSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ZoneFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["CreateZoneInput"]: {
	name: string | Variable<any, string>,
	memberIds?: Array<string> | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["UpdateZoneInput"]: {
	id: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	["Address"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	company?:boolean | `@${string}`,
	streetLine1?:boolean | `@${string}`,
	streetLine2?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	province?:boolean | `@${string}`,
	postalCode?:boolean | `@${string}`,
	country?:ValueTypes["Country"],
	phoneNumber?:boolean | `@${string}`,
	defaultShippingAddress?:boolean | `@${string}`,
	defaultBillingAddress?:boolean | `@${string}`,
	customFields?:ValueTypes["AddressCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["Asset"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	fileSize?:boolean | `@${string}`,
	mimeType?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
	height?:boolean | `@${string}`,
	source?:boolean | `@${string}`,
	preview?:boolean | `@${string}`,
	focalPoint?:ValueTypes["Coordinate"],
	tags?:ValueTypes["Tag"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Coordinate"]: AliasType<{
	x?:boolean | `@${string}`,
	y?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssetList"]: AliasType<{
	items?:ValueTypes["Asset"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssetType"]:AssetType;
	["CurrentUser"]: AliasType<{
	id?:boolean | `@${string}`,
	identifier?:boolean | `@${string}`,
	channels?:ValueTypes["CurrentUserChannel"],
		__typename?: boolean | `@${string}`
}>;
	["CurrentUserChannel"]: AliasType<{
	id?:boolean | `@${string}`,
	token?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	permissions?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Channel"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	token?:boolean | `@${string}`,
	defaultTaxZone?:ValueTypes["Zone"],
	defaultShippingZone?:ValueTypes["Zone"],
	defaultLanguageCode?:boolean | `@${string}`,
	availableLanguageCodes?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	defaultCurrencyCode?:boolean | `@${string}`,
	availableCurrencyCodes?:boolean | `@${string}`,
	/** Not yet used - will be implemented in a future release. */
	trackInventory?:boolean | `@${string}`,
	/** Not yet used - will be implemented in a future release. */
	outOfStockThreshold?:boolean | `@${string}`,
	pricesIncludeTax?:boolean | `@${string}`,
	seller?:ValueTypes["Seller"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CollectionBreadcrumb"]: AliasType<{
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CollectionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ValueTypes["CollectionTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionList"]: AliasType<{
	items?:ValueTypes["Collection"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GlobalFlag"]:GlobalFlag;
	["AdjustmentType"]:AdjustmentType;
	["DeletionResult"]:DeletionResult;
	/** @description
Permissions for administrators and customers. Used to control access to
GraphQL resolvers via the {@link Allow} decorator.

## Understanding Permission.Owner

`Permission.Owner` is a special permission which is used in some Vendure resolvers to indicate that that resolver should only
be accessible to the "owner" of that resource.

For example, the Shop API `activeCustomer` query resolver should only return the Customer object for the "owner" of that Customer, i.e.
based on the activeUserId of the current session. As a result, the resolver code looks like this:

@example
```TypeScript
\@Query()
\@Allow(Permission.Owner)
async activeCustomer(\@Ctx() ctx: RequestContext): Promise<Customer | undefined> {
  const userId = ctx.activeUserId;
  if (userId) {
    return this.customerService.findOneByUserId(ctx, userId);
  }
}
```

Here we can see that the "ownership" must be enforced by custom logic inside the resolver. Since "ownership" cannot be defined generally
nor statically encoded at build-time, any resolvers using `Permission.Owner` **must** include logic to enforce that only the owner
of the resource has access. If not, then it is the equivalent of using `Permission.Public`.


@docsCategory common */
["Permission"]:Permission;
	["SortOrder"]:SortOrder;
	["ErrorCode"]:ErrorCode;
	["LogicalOperator"]:LogicalOperator;
	/** Returned when attempting an operation that relies on the NativeAuthStrategy, if that strategy is not configured. */
["NativeAuthStrategyError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the user authentication credentials are not valid */
["InvalidCredentialsError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	authenticationError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if there is an error in transitioning the Order state */
["OrderStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to create a Customer with an email address already registered to an existing User. */
["EmailAddressConflictError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set the Customer on a guest checkout when the configured GuestCheckoutStrategy does not allow it. */
["GuestCheckoutError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	errorDetail?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when the maximum order size limit has been reached. */
["OrderLimitError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	maxItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set a negative OrderLine quantity. */
["NegativeQuantityError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to add more items to the Order than are available */
["InsufficientStockError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	quantityAvailable?:boolean | `@${string}`,
	order?:ValueTypes["Order"],
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeInvalidError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeExpiredError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeLimitError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
	limit?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to modify the contents of an Order that is not in the `AddingItems` state. */
["OrderModificationError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set a ShippingMethod for which the Order is not eligible */
["IneligibleShippingMethodError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when invoking a mutation which depends on there being an active Order on the
current session. */
["NoActiveOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
["JSON"]:unknown;
	/** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
["DateTime"]:unknown;
	/** The `Upload` scalar type represents a file upload. */
["Upload"]:unknown;
	/** The `Money` scalar type represents monetary values and supports signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
["Money"]:unknown;
	["PaginatedList"]:AliasType<{
		items?:ValueTypes["Node"],
	totalItems?:boolean | `@${string}`;
		['...on AdministratorList']?: Omit<ValueTypes["AdministratorList"],keyof ValueTypes["PaginatedList"]>;
		['...on ChannelList']?: Omit<ValueTypes["ChannelList"],keyof ValueTypes["PaginatedList"]>;
		['...on CustomerGroupList']?: Omit<ValueTypes["CustomerGroupList"],keyof ValueTypes["PaginatedList"]>;
		['...on JobList']?: Omit<ValueTypes["JobList"],keyof ValueTypes["PaginatedList"]>;
		['...on PaymentMethodList']?: Omit<ValueTypes["PaymentMethodList"],keyof ValueTypes["PaginatedList"]>;
		['...on SellerList']?: Omit<ValueTypes["SellerList"],keyof ValueTypes["PaginatedList"]>;
		['...on StockLocationList']?: Omit<ValueTypes["StockLocationList"],keyof ValueTypes["PaginatedList"]>;
		['...on TaxCategoryList']?: Omit<ValueTypes["TaxCategoryList"],keyof ValueTypes["PaginatedList"]>;
		['...on ZoneList']?: Omit<ValueTypes["ZoneList"],keyof ValueTypes["PaginatedList"]>;
		['...on AssetList']?: Omit<ValueTypes["AssetList"],keyof ValueTypes["PaginatedList"]>;
		['...on CollectionList']?: Omit<ValueTypes["CollectionList"],keyof ValueTypes["PaginatedList"]>;
		['...on CustomerList']?: Omit<ValueTypes["CustomerList"],keyof ValueTypes["PaginatedList"]>;
		['...on FacetList']?: Omit<ValueTypes["FacetList"],keyof ValueTypes["PaginatedList"]>;
		['...on FacetValueList']?: Omit<ValueTypes["FacetValueList"],keyof ValueTypes["PaginatedList"]>;
		['...on HistoryEntryList']?: Omit<ValueTypes["HistoryEntryList"],keyof ValueTypes["PaginatedList"]>;
		['...on OrderList']?: Omit<ValueTypes["OrderList"],keyof ValueTypes["PaginatedList"]>;
		['...on ProductList']?: Omit<ValueTypes["ProductList"],keyof ValueTypes["PaginatedList"]>;
		['...on ProductVariantList']?: Omit<ValueTypes["ProductVariantList"],keyof ValueTypes["PaginatedList"]>;
		['...on PromotionList']?: Omit<ValueTypes["PromotionList"],keyof ValueTypes["PaginatedList"]>;
		['...on CountryList']?: Omit<ValueTypes["CountryList"],keyof ValueTypes["PaginatedList"]>;
		['...on ProvinceList']?: Omit<ValueTypes["ProvinceList"],keyof ValueTypes["PaginatedList"]>;
		['...on RoleList']?: Omit<ValueTypes["RoleList"],keyof ValueTypes["PaginatedList"]>;
		['...on ShippingMethodList']?: Omit<ValueTypes["ShippingMethodList"],keyof ValueTypes["PaginatedList"]>;
		['...on TagList']?: Omit<ValueTypes["TagList"],keyof ValueTypes["PaginatedList"]>;
		['...on TaxRateList']?: Omit<ValueTypes["TaxRateList"],keyof ValueTypes["PaginatedList"]>;
		['...on PageList']?: Omit<ValueTypes["PageList"],keyof ValueTypes["PaginatedList"]>;
		['...on AnnouncementBarList']?: Omit<ValueTypes["AnnouncementBarList"],keyof ValueTypes["PaginatedList"]>;
		['...on WishlistList']?: Omit<ValueTypes["WishlistList"],keyof ValueTypes["PaginatedList"]>;
		['...on NewsletterSubscriberList']?: Omit<ValueTypes["NewsletterSubscriberList"],keyof ValueTypes["PaginatedList"]>;
		['...on BackInStockSubscriberList']?: Omit<ValueTypes["BackInStockSubscriberList"],keyof ValueTypes["PaginatedList"]>;
		['...on B2BSubscriberList']?: Omit<ValueTypes["B2BSubscriberList"],keyof ValueTypes["PaginatedList"]>;
		['...on ModelList']?: Omit<ValueTypes["ModelList"],keyof ValueTypes["PaginatedList"]>;
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		id?:boolean | `@${string}`;
		['...on Administrator']?: Omit<ValueTypes["Administrator"],keyof ValueTypes["Node"]>;
		['...on Collection']?: Omit<ValueTypes["Collection"],keyof ValueTypes["Node"]>;
		['...on Customer']?: Omit<ValueTypes["Customer"],keyof ValueTypes["Node"]>;
		['...on Facet']?: Omit<ValueTypes["Facet"],keyof ValueTypes["Node"]>;
		['...on HistoryEntry']?: Omit<ValueTypes["HistoryEntry"],keyof ValueTypes["Node"]>;
		['...on Job']?: Omit<ValueTypes["Job"],keyof ValueTypes["Node"]>;
		['...on Order']?: Omit<ValueTypes["Order"],keyof ValueTypes["Node"]>;
		['...on Fulfillment']?: Omit<ValueTypes["Fulfillment"],keyof ValueTypes["Node"]>;
		['...on Payment']?: Omit<ValueTypes["Payment"],keyof ValueTypes["Node"]>;
		['...on OrderModification']?: Omit<ValueTypes["OrderModification"],keyof ValueTypes["Node"]>;
		['...on Product']?: Omit<ValueTypes["Product"],keyof ValueTypes["Node"]>;
		['...on ProductVariant']?: Omit<ValueTypes["ProductVariant"],keyof ValueTypes["Node"]>;
		['...on StockLevel']?: Omit<ValueTypes["StockLevel"],keyof ValueTypes["Node"]>;
		['...on StockLocation']?: Omit<ValueTypes["StockLocation"],keyof ValueTypes["Node"]>;
		['...on StockAdjustment']?: Omit<ValueTypes["StockAdjustment"],keyof ValueTypes["Node"]>;
		['...on Allocation']?: Omit<ValueTypes["Allocation"],keyof ValueTypes["Node"]>;
		['...on Sale']?: Omit<ValueTypes["Sale"],keyof ValueTypes["Node"]>;
		['...on Cancellation']?: Omit<ValueTypes["Cancellation"],keyof ValueTypes["Node"]>;
		['...on Return']?: Omit<ValueTypes["Return"],keyof ValueTypes["Node"]>;
		['...on Release']?: Omit<ValueTypes["Release"],keyof ValueTypes["Node"]>;
		['...on Address']?: Omit<ValueTypes["Address"],keyof ValueTypes["Node"]>;
		['...on Asset']?: Omit<ValueTypes["Asset"],keyof ValueTypes["Node"]>;
		['...on Channel']?: Omit<ValueTypes["Channel"],keyof ValueTypes["Node"]>;
		['...on CustomerGroup']?: Omit<ValueTypes["CustomerGroup"],keyof ValueTypes["Node"]>;
		['...on FacetValue']?: Omit<ValueTypes["FacetValue"],keyof ValueTypes["Node"]>;
		['...on OrderLine']?: Omit<ValueTypes["OrderLine"],keyof ValueTypes["Node"]>;
		['...on Refund']?: Omit<ValueTypes["Refund"],keyof ValueTypes["Node"]>;
		['...on Surcharge']?: Omit<ValueTypes["Surcharge"],keyof ValueTypes["Node"]>;
		['...on PaymentMethod']?: Omit<ValueTypes["PaymentMethod"],keyof ValueTypes["Node"]>;
		['...on ProductOptionGroup']?: Omit<ValueTypes["ProductOptionGroup"],keyof ValueTypes["Node"]>;
		['...on ProductOption']?: Omit<ValueTypes["ProductOption"],keyof ValueTypes["Node"]>;
		['...on Promotion']?: Omit<ValueTypes["Promotion"],keyof ValueTypes["Node"]>;
		['...on Region']?: Omit<ValueTypes["Region"],keyof ValueTypes["Node"]>;
		['...on Country']?: Omit<ValueTypes["Country"],keyof ValueTypes["Node"]>;
		['...on Province']?: Omit<ValueTypes["Province"],keyof ValueTypes["Node"]>;
		['...on Role']?: Omit<ValueTypes["Role"],keyof ValueTypes["Node"]>;
		['...on Seller']?: Omit<ValueTypes["Seller"],keyof ValueTypes["Node"]>;
		['...on ShippingMethod']?: Omit<ValueTypes["ShippingMethod"],keyof ValueTypes["Node"]>;
		['...on Tag']?: Omit<ValueTypes["Tag"],keyof ValueTypes["Node"]>;
		['...on TaxCategory']?: Omit<ValueTypes["TaxCategory"],keyof ValueTypes["Node"]>;
		['...on TaxRate']?: Omit<ValueTypes["TaxRate"],keyof ValueTypes["Node"]>;
		['...on User']?: Omit<ValueTypes["User"],keyof ValueTypes["Node"]>;
		['...on AuthenticationMethod']?: Omit<ValueTypes["AuthenticationMethod"],keyof ValueTypes["Node"]>;
		['...on Zone']?: Omit<ValueTypes["Zone"],keyof ValueTypes["Node"]>;
		['...on Page']?: Omit<ValueTypes["Page"],keyof ValueTypes["Node"]>;
		['...on AnnouncementBar']?: Omit<ValueTypes["AnnouncementBar"],keyof ValueTypes["Node"]>;
		['...on WishlistItem']?: Omit<ValueTypes["WishlistItem"],keyof ValueTypes["Node"]>;
		['...on Wishlist']?: Omit<ValueTypes["Wishlist"],keyof ValueTypes["Node"]>;
		['...on NewsletterSubscriber']?: Omit<ValueTypes["NewsletterSubscriber"],keyof ValueTypes["Node"]>;
		['...on BackInStockSubscriber']?: Omit<ValueTypes["BackInStockSubscriber"],keyof ValueTypes["Node"]>;
		['...on B2BSubscriber']?: Omit<ValueTypes["B2BSubscriber"],keyof ValueTypes["Node"]>;
		['...on Model']?: Omit<ValueTypes["Model"],keyof ValueTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["ErrorResult"]:AliasType<{
		errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`;
		['...on MimeTypeError']?: Omit<ValueTypes["MimeTypeError"],keyof ValueTypes["ErrorResult"]>;
		['...on LanguageNotAvailableError']?: Omit<ValueTypes["LanguageNotAvailableError"],keyof ValueTypes["ErrorResult"]>;
		['...on FacetInUseError']?: Omit<ValueTypes["FacetInUseError"],keyof ValueTypes["ErrorResult"]>;
		['...on ChannelDefaultLanguageError']?: Omit<ValueTypes["ChannelDefaultLanguageError"],keyof ValueTypes["ErrorResult"]>;
		['...on SettlePaymentError']?: Omit<ValueTypes["SettlePaymentError"],keyof ValueTypes["ErrorResult"]>;
		['...on CancelPaymentError']?: Omit<ValueTypes["CancelPaymentError"],keyof ValueTypes["ErrorResult"]>;
		['...on EmptyOrderLineSelectionError']?: Omit<ValueTypes["EmptyOrderLineSelectionError"],keyof ValueTypes["ErrorResult"]>;
		['...on ItemsAlreadyFulfilledError']?: Omit<ValueTypes["ItemsAlreadyFulfilledError"],keyof ValueTypes["ErrorResult"]>;
		['...on InvalidFulfillmentHandlerError']?: Omit<ValueTypes["InvalidFulfillmentHandlerError"],keyof ValueTypes["ErrorResult"]>;
		['...on CreateFulfillmentError']?: Omit<ValueTypes["CreateFulfillmentError"],keyof ValueTypes["ErrorResult"]>;
		['...on InsufficientStockOnHandError']?: Omit<ValueTypes["InsufficientStockOnHandError"],keyof ValueTypes["ErrorResult"]>;
		['...on MultipleOrderError']?: Omit<ValueTypes["MultipleOrderError"],keyof ValueTypes["ErrorResult"]>;
		['...on CancelActiveOrderError']?: Omit<ValueTypes["CancelActiveOrderError"],keyof ValueTypes["ErrorResult"]>;
		['...on PaymentOrderMismatchError']?: Omit<ValueTypes["PaymentOrderMismatchError"],keyof ValueTypes["ErrorResult"]>;
		['...on RefundOrderStateError']?: Omit<ValueTypes["RefundOrderStateError"],keyof ValueTypes["ErrorResult"]>;
		['...on NothingToRefundError']?: Omit<ValueTypes["NothingToRefundError"],keyof ValueTypes["ErrorResult"]>;
		['...on AlreadyRefundedError']?: Omit<ValueTypes["AlreadyRefundedError"],keyof ValueTypes["ErrorResult"]>;
		['...on QuantityTooGreatError']?: Omit<ValueTypes["QuantityTooGreatError"],keyof ValueTypes["ErrorResult"]>;
		['...on RefundStateTransitionError']?: Omit<ValueTypes["RefundStateTransitionError"],keyof ValueTypes["ErrorResult"]>;
		['...on PaymentStateTransitionError']?: Omit<ValueTypes["PaymentStateTransitionError"],keyof ValueTypes["ErrorResult"]>;
		['...on FulfillmentStateTransitionError']?: Omit<ValueTypes["FulfillmentStateTransitionError"],keyof ValueTypes["ErrorResult"]>;
		['...on OrderModificationStateError']?: Omit<ValueTypes["OrderModificationStateError"],keyof ValueTypes["ErrorResult"]>;
		['...on NoChangesSpecifiedError']?: Omit<ValueTypes["NoChangesSpecifiedError"],keyof ValueTypes["ErrorResult"]>;
		['...on PaymentMethodMissingError']?: Omit<ValueTypes["PaymentMethodMissingError"],keyof ValueTypes["ErrorResult"]>;
		['...on RefundPaymentIdMissingError']?: Omit<ValueTypes["RefundPaymentIdMissingError"],keyof ValueTypes["ErrorResult"]>;
		['...on ManualPaymentStateError']?: Omit<ValueTypes["ManualPaymentStateError"],keyof ValueTypes["ErrorResult"]>;
		['...on ProductOptionInUseError']?: Omit<ValueTypes["ProductOptionInUseError"],keyof ValueTypes["ErrorResult"]>;
		['...on MissingConditionsError']?: Omit<ValueTypes["MissingConditionsError"],keyof ValueTypes["ErrorResult"]>;
		['...on NativeAuthStrategyError']?: Omit<ValueTypes["NativeAuthStrategyError"],keyof ValueTypes["ErrorResult"]>;
		['...on InvalidCredentialsError']?: Omit<ValueTypes["InvalidCredentialsError"],keyof ValueTypes["ErrorResult"]>;
		['...on OrderStateTransitionError']?: Omit<ValueTypes["OrderStateTransitionError"],keyof ValueTypes["ErrorResult"]>;
		['...on EmailAddressConflictError']?: Omit<ValueTypes["EmailAddressConflictError"],keyof ValueTypes["ErrorResult"]>;
		['...on GuestCheckoutError']?: Omit<ValueTypes["GuestCheckoutError"],keyof ValueTypes["ErrorResult"]>;
		['...on OrderLimitError']?: Omit<ValueTypes["OrderLimitError"],keyof ValueTypes["ErrorResult"]>;
		['...on NegativeQuantityError']?: Omit<ValueTypes["NegativeQuantityError"],keyof ValueTypes["ErrorResult"]>;
		['...on InsufficientStockError']?: Omit<ValueTypes["InsufficientStockError"],keyof ValueTypes["ErrorResult"]>;
		['...on CouponCodeInvalidError']?: Omit<ValueTypes["CouponCodeInvalidError"],keyof ValueTypes["ErrorResult"]>;
		['...on CouponCodeExpiredError']?: Omit<ValueTypes["CouponCodeExpiredError"],keyof ValueTypes["ErrorResult"]>;
		['...on CouponCodeLimitError']?: Omit<ValueTypes["CouponCodeLimitError"],keyof ValueTypes["ErrorResult"]>;
		['...on OrderModificationError']?: Omit<ValueTypes["OrderModificationError"],keyof ValueTypes["ErrorResult"]>;
		['...on IneligibleShippingMethodError']?: Omit<ValueTypes["IneligibleShippingMethodError"],keyof ValueTypes["ErrorResult"]>;
		['...on NoActiveOrderError']?: Omit<ValueTypes["NoActiveOrderError"],keyof ValueTypes["ErrorResult"]>;
		__typename?: boolean | `@${string}`
}>;
	["Adjustment"]: AliasType<{
	adjustmentSource?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxLine"]: AliasType<{
	description?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArg"]: AliasType<{
	name?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArgDefinition"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	required?:boolean | `@${string}`,
	defaultValue?:boolean | `@${string}`,
	label?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigurableOperation"]: AliasType<{
	code?:boolean | `@${string}`,
	args?:ValueTypes["ConfigArg"],
		__typename?: boolean | `@${string}`
}>;
	["ConfigurableOperationDefinition"]: AliasType<{
	code?:boolean | `@${string}`,
	args?:ValueTypes["ConfigArgDefinition"],
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DeletionResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArgInput"]: {
	name: string | Variable<any, string>,
	/** A JSON stringified representation of the actual value */
	value: string | Variable<any, string>
};
	["ConfigurableOperationInput"]: {
	code: string | Variable<any, string>,
	arguments: Array<ValueTypes["ConfigArgInput"]> | Variable<any, string>
};
	/** Operators for filtering on a String field */
["StringOperators"]: {
	eq?: string | undefined | null | Variable<any, string>,
	notEq?: string | undefined | null | Variable<any, string>,
	contains?: string | undefined | null | Variable<any, string>,
	notContains?: string | undefined | null | Variable<any, string>,
	in?: Array<string> | undefined | null | Variable<any, string>,
	notIn?: Array<string> | undefined | null | Variable<any, string>,
	regex?: string | undefined | null | Variable<any, string>,
	isNull?: boolean | undefined | null | Variable<any, string>
};
	/** Operators for filtering on an ID field */
["IDOperators"]: {
	eq?: string | undefined | null | Variable<any, string>,
	notEq?: string | undefined | null | Variable<any, string>,
	in?: Array<string> | undefined | null | Variable<any, string>,
	notIn?: Array<string> | undefined | null | Variable<any, string>,
	isNull?: boolean | undefined | null | Variable<any, string>
};
	/** Operators for filtering on a Boolean field */
["BooleanOperators"]: {
	eq?: boolean | undefined | null | Variable<any, string>,
	isNull?: boolean | undefined | null | Variable<any, string>
};
	["NumberRange"]: {
	start: number | Variable<any, string>,
	end: number | Variable<any, string>
};
	/** Operators for filtering on a Int or Float field */
["NumberOperators"]: {
	eq?: number | undefined | null | Variable<any, string>,
	lt?: number | undefined | null | Variable<any, string>,
	lte?: number | undefined | null | Variable<any, string>,
	gt?: number | undefined | null | Variable<any, string>,
	gte?: number | undefined | null | Variable<any, string>,
	between?: ValueTypes["NumberRange"] | undefined | null | Variable<any, string>,
	isNull?: boolean | undefined | null | Variable<any, string>
};
	["DateRange"]: {
	start: ValueTypes["DateTime"] | Variable<any, string>,
	end: ValueTypes["DateTime"] | Variable<any, string>
};
	/** Operators for filtering on a DateTime field */
["DateOperators"]: {
	eq?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	before?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	after?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	between?: ValueTypes["DateRange"] | undefined | null | Variable<any, string>,
	isNull?: boolean | undefined | null | Variable<any, string>
};
	/** Operators for filtering on a list of String fields */
["StringListOperators"]: {
	inList: string | Variable<any, string>
};
	/** Operators for filtering on a list of Number fields */
["NumberListOperators"]: {
	inList: number | Variable<any, string>
};
	/** Operators for filtering on a list of Boolean fields */
["BooleanListOperators"]: {
	inList: boolean | Variable<any, string>
};
	/** Operators for filtering on a list of ID fields */
["IDListOperators"]: {
	inList: string | Variable<any, string>
};
	/** Operators for filtering on a list of Date fields */
["DateListOperators"]: {
	inList: ValueTypes["DateTime"] | Variable<any, string>
};
	/** Used to construct boolean expressions for filtering search results
by FacetValue ID. Examples:

* ID=1 OR ID=2: `{ facetValueFilters: [{ or: [1,2] }] }`
* ID=1 AND ID=2: `{ facetValueFilters: [{ and: 1 }, { and: 2 }] }`
* ID=1 AND (ID=2 OR ID=3): `{ facetValueFilters: [{ and: 1 }, { or: [2,3] }] }` */
["FacetValueFilterInput"]: {
	and?: string | undefined | null | Variable<any, string>,
	or?: Array<string> | undefined | null | Variable<any, string>
};
	["SearchInput"]: {
	term?: string | undefined | null | Variable<any, string>,
	facetValueFilters?: Array<ValueTypes["FacetValueFilterInput"]> | undefined | null | Variable<any, string>,
	collectionId?: string | undefined | null | Variable<any, string>,
	collectionSlug?: string | undefined | null | Variable<any, string>,
	groupByProduct?: boolean | undefined | null | Variable<any, string>,
	take?: number | undefined | null | Variable<any, string>,
	skip?: number | undefined | null | Variable<any, string>,
	sort?: ValueTypes["SearchResultSortParameter"] | undefined | null | Variable<any, string>,
	inStock?: boolean | undefined | null | Variable<any, string>,
	minPrice?: number | undefined | null | Variable<any, string>,
	maxPrice?: number | undefined | null | Variable<any, string>
};
	["SearchResultSortParameter"]: {
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	price?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["CreateCustomerInput"]: {
	title?: string | undefined | null | Variable<any, string>,
	firstName: string | Variable<any, string>,
	lastName: string | Variable<any, string>,
	phoneNumber?: string | undefined | null | Variable<any, string>,
	emailAddress: string | Variable<any, string>,
	customFields?: ValueTypes["JSON"] | undefined | null | Variable<any, string>
};
	/** Input used to create an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["CreateAddressInput"]: {
	fullName?: string | undefined | null | Variable<any, string>,
	company?: string | undefined | null | Variable<any, string>,
	streetLine1: string | Variable<any, string>,
	streetLine2?: string | undefined | null | Variable<any, string>,
	city?: string | undefined | null | Variable<any, string>,
	province?: string | undefined | null | Variable<any, string>,
	postalCode?: string | undefined | null | Variable<any, string>,
	countryCode: string | Variable<any, string>,
	phoneNumber?: string | undefined | null | Variable<any, string>,
	defaultShippingAddress?: boolean | undefined | null | Variable<any, string>,
	defaultBillingAddress?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["CreateAddressCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	/** Input used to update an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["UpdateAddressInput"]: {
	id: string | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	company?: string | undefined | null | Variable<any, string>,
	streetLine1?: string | undefined | null | Variable<any, string>,
	streetLine2?: string | undefined | null | Variable<any, string>,
	city?: string | undefined | null | Variable<any, string>,
	province?: string | undefined | null | Variable<any, string>,
	postalCode?: string | undefined | null | Variable<any, string>,
	countryCode?: string | undefined | null | Variable<any, string>,
	phoneNumber?: string | undefined | null | Variable<any, string>,
	defaultShippingAddress?: boolean | undefined | null | Variable<any, string>,
	defaultBillingAddress?: boolean | undefined | null | Variable<any, string>,
	customFields?: ValueTypes["UpdateAddressCustomFieldsInput"] | undefined | null | Variable<any, string>
};
	/** Indicates that an operation succeeded, where we do not want to return any more specific information. */
["Success"]: AliasType<{
	success?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodQuote"]: AliasType<{
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	/** Any optional metadata returned by the ShippingCalculator in the ShippingCalculationResult */
	metadata?:boolean | `@${string}`,
	customFields?:ValueTypes["ShippingMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodQuote"]: AliasType<{
	id?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	isEligible?:boolean | `@${string}`,
	eligibilityMessage?:boolean | `@${string}`,
	customFields?:ValueTypes["PaymentMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderItemsResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on OrderModificationError"] : ValueTypes["OrderModificationError"],
		["...on OrderLimitError"] : ValueTypes["OrderLimitError"],
		["...on NegativeQuantityError"] : ValueTypes["NegativeQuantityError"],
		["...on InsufficientStockError"] : ValueTypes["InsufficientStockError"]
		__typename?: boolean | `@${string}`
}>;
	["RemoveOrderItemsResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on OrderModificationError"] : ValueTypes["OrderModificationError"]
		__typename?: boolean | `@${string}`
}>;
	["SetOrderShippingMethodResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on OrderModificationError"] : ValueTypes["OrderModificationError"],
		["...on IneligibleShippingMethodError"] : ValueTypes["IneligibleShippingMethodError"],
		["...on NoActiveOrderError"] : ValueTypes["NoActiveOrderError"]
		__typename?: boolean | `@${string}`
}>;
	["ApplyCouponCodeResult"]: AliasType<{		["...on Order"] : ValueTypes["Order"],
		["...on CouponCodeExpiredError"] : ValueTypes["CouponCodeExpiredError"],
		["...on CouponCodeInvalidError"] : ValueTypes["CouponCodeInvalidError"],
		["...on CouponCodeLimitError"] : ValueTypes["CouponCodeLimitError"]
		__typename?: boolean | `@${string}`
}>;
	/** @description
ISO 4217 currency code

@docsCategory common */
["CurrencyCode"]:CurrencyCode;
	["CustomField"]:AliasType<{
		name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`;
		['...on StringCustomFieldConfig']?: Omit<ValueTypes["StringCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on LocaleStringCustomFieldConfig']?: Omit<ValueTypes["LocaleStringCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on IntCustomFieldConfig']?: Omit<ValueTypes["IntCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on FloatCustomFieldConfig']?: Omit<ValueTypes["FloatCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on BooleanCustomFieldConfig']?: Omit<ValueTypes["BooleanCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on DateTimeCustomFieldConfig']?: Omit<ValueTypes["DateTimeCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on RelationCustomFieldConfig']?: Omit<ValueTypes["RelationCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on TextCustomFieldConfig']?: Omit<ValueTypes["TextCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		['...on LocaleTextCustomFieldConfig']?: Omit<ValueTypes["LocaleTextCustomFieldConfig"],keyof ValueTypes["CustomField"]>;
		__typename?: boolean | `@${string}`
}>;
	["StringCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	pattern?:boolean | `@${string}`,
	options?:ValueTypes["StringFieldOption"],
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StringFieldOption"]: AliasType<{
	value?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
		__typename?: boolean | `@${string}`
}>;
	["LocaleStringCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	pattern?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IntCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FloatCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BooleanCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Expects the same validation formats as the `<input type="datetime-local">` HTML element.
See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#Additional_attributes */
["DateTimeCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RelationCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	entity?:boolean | `@${string}`,
	scalarFields?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TextCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LocaleTextCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ValueTypes["LocalizedString"],
	description?:ValueTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LocalizedString"]: AliasType<{
	languageCode?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomFieldConfig"]: AliasType<{		["...on StringCustomFieldConfig"] : ValueTypes["StringCustomFieldConfig"],
		["...on LocaleStringCustomFieldConfig"] : ValueTypes["LocaleStringCustomFieldConfig"],
		["...on IntCustomFieldConfig"] : ValueTypes["IntCustomFieldConfig"],
		["...on FloatCustomFieldConfig"] : ValueTypes["FloatCustomFieldConfig"],
		["...on BooleanCustomFieldConfig"] : ValueTypes["BooleanCustomFieldConfig"],
		["...on DateTimeCustomFieldConfig"] : ValueTypes["DateTimeCustomFieldConfig"],
		["...on RelationCustomFieldConfig"] : ValueTypes["RelationCustomFieldConfig"],
		["...on TextCustomFieldConfig"] : ValueTypes["TextCustomFieldConfig"],
		["...on LocaleTextCustomFieldConfig"] : ValueTypes["LocaleTextCustomFieldConfig"]
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroup"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
customers?: [{	options?: ValueTypes["CustomerListOptions"] | undefined | null | Variable<any, string>},ValueTypes["CustomerList"]],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerList"]: AliasType<{
	items?:ValueTypes["Customer"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetValue"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	facet?:ValueTypes["Facet"],
	facetId?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	translations?:ValueTypes["FacetValueTranslation"],
	customFields?:ValueTypes["FacetValueCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["FacetValueTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetList"]: AliasType<{
	items?:ValueTypes["Facet"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetValueListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["FacetValueSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["FacetValueFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["FacetValueList"]: AliasType<{
	items?:ValueTypes["FacetValue"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntryType"]:HistoryEntryType;
	["HistoryEntryList"]: AliasType<{
	items?:ValueTypes["HistoryEntry"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["HistoryEntrySortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["HistoryEntryFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	/** @description
Languages in the form of a ISO 639-1 language code with optional
region or script modifier (e.g. de_AT). The selection available is based
on the [Unicode CLDR summary list](https://unicode-org.github.io/cldr-staging/charts/37/summary/root.html)
and includes the major spoken languages of the world and any widely-used variants.

@docsCategory common */
["LanguageCode"]:LanguageCode;
	["OrderType"]:OrderType;
	/** A summary of the taxes being applied to this order, grouped
by taxRate. */
["OrderTaxSummary"]: AliasType<{
	/** A description of this tax */
	description?:boolean | `@${string}`,
	/** The taxRate as a percentage */
	taxRate?:boolean | `@${string}`,
	/** The total net price of OrderLines to which this taxRate applies */
	taxBase?:boolean | `@${string}`,
	/** The total tax being applied to the Order at this taxRate */
	taxTotal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderAddress"]: AliasType<{
	fullName?:boolean | `@${string}`,
	company?:boolean | `@${string}`,
	streetLine1?:boolean | `@${string}`,
	streetLine2?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	province?:boolean | `@${string}`,
	postalCode?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	countryCode?:boolean | `@${string}`,
	phoneNumber?:boolean | `@${string}`,
	customFields?:ValueTypes["AddressCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["OrderList"]: AliasType<{
	items?:ValueTypes["Order"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingLine"]: AliasType<{
	id?:boolean | `@${string}`,
	shippingMethod?:ValueTypes["ShippingMethod"],
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	discountedPrice?:boolean | `@${string}`,
	discountedPriceWithTax?:boolean | `@${string}`,
	discounts?:ValueTypes["Discount"],
		__typename?: boolean | `@${string}`
}>;
	["Discount"]: AliasType<{
	adjustmentSource?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	amountWithTax?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderLine"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ValueTypes["ProductVariant"],
	featuredAsset?:ValueTypes["Asset"],
	/** The price of a single unit, excluding tax and discounts */
	unitPrice?:boolean | `@${string}`,
	/** The price of a single unit, including tax but excluding discounts */
	unitPriceWithTax?:boolean | `@${string}`,
	/** Non-zero if the unitPrice has changed since it was initially added to Order */
	unitPriceChangeSinceAdded?:boolean | `@${string}`,
	/** Non-zero if the unitPriceWithTax has changed since it was initially added to Order */
	unitPriceWithTaxChangeSinceAdded?:boolean | `@${string}`,
	/** The price of a single unit including discounts, excluding tax.

If Order-level discounts have been applied, this will not be the
actual taxable unit price (see `proratedUnitPrice`), but is generally the
correct price to display to customers to avoid confusion
about the internal handling of distributed Order-level discounts. */
	discountedUnitPrice?:boolean | `@${string}`,
	/** The price of a single unit including discounts and tax */
	discountedUnitPriceWithTax?:boolean | `@${string}`,
	/** The actual unit price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderItem, and is used in tax
and refund calculations. */
	proratedUnitPrice?:boolean | `@${string}`,
	/** The proratedUnitPrice including tax */
	proratedUnitPriceWithTax?:boolean | `@${string}`,
	/** The quantity of items purchased */
	quantity?:boolean | `@${string}`,
	/** The quantity at the time the Order was placed */
	orderPlacedQuantity?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
	/** The total price of the line excluding tax and discounts. */
	linePrice?:boolean | `@${string}`,
	/** The total price of the line including tax but excluding discounts. */
	linePriceWithTax?:boolean | `@${string}`,
	/** The price of the line including discounts, excluding tax */
	discountedLinePrice?:boolean | `@${string}`,
	/** The price of the line including discounts and tax */
	discountedLinePriceWithTax?:boolean | `@${string}`,
	/** The actual line price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderLine, and is used in tax
and refund calculations. */
	proratedLinePrice?:boolean | `@${string}`,
	/** The proratedLinePrice including tax */
	proratedLinePriceWithTax?:boolean | `@${string}`,
	/** The total tax on this line */
	lineTax?:boolean | `@${string}`,
	discounts?:ValueTypes["Discount"],
	taxLines?:ValueTypes["TaxLine"],
	order?:ValueTypes["Order"],
	fulfillmentLines?:ValueTypes["FulfillmentLine"],
	customFields?:ValueTypes["OrderLineCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["RefundLine"]: AliasType<{
	orderLine?:ValueTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	refund?:ValueTypes["Refund"],
	refundId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Refund"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	items?:boolean | `@${string}`,
	shipping?:boolean | `@${string}`,
	adjustment?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	transactionId?:boolean | `@${string}`,
	reason?:boolean | `@${string}`,
	lines?:ValueTypes["RefundLine"],
	paymentId?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FulfillmentLine"]: AliasType<{
	orderLine?:ValueTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	fulfillment?:ValueTypes["Fulfillment"],
	fulfillmentId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Surcharge"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	taxLines?:ValueTypes["TaxLine"],
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	checker?:ValueTypes["ConfigurableOperation"],
	handler?:ValueTypes["ConfigurableOperation"],
	translations?:ValueTypes["PaymentMethodTranslation"],
	customFields?:ValueTypes["PaymentMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ValueTypes["PaymentMethodTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroup"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	options?:ValueTypes["ProductOption"],
	translations?:ValueTypes["ProductOptionGroupTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroupTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOption"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	groupId?:boolean | `@${string}`,
	group?:ValueTypes["ProductOptionGroup"],
	translations?:ValueTypes["ProductOptionTranslation"],
	customFields?:ValueTypes["ProductOptionCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchReindexResponse"]: AliasType<{
	success?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchResponse"]: AliasType<{
	items?:ValueTypes["SearchResult"],
	totalItems?:boolean | `@${string}`,
	facetValues?:ValueTypes["FacetValueResult"],
	collections?:ValueTypes["CollectionResult"],
	minPrice?:boolean | `@${string}`,
	maxPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Which FacetValues are present in the products returned
by the search, and in what quantity. */
["FacetValueResult"]: AliasType<{
	facetValue?:ValueTypes["FacetValue"],
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Which Collections are present in the products returned
by the search, and in what quantity. */
["CollectionResult"]: AliasType<{
	collection?:ValueTypes["Collection"],
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchResultAsset"]: AliasType<{
	id?:boolean | `@${string}`,
	preview?:boolean | `@${string}`,
	focalPoint?:ValueTypes["Coordinate"],
		__typename?: boolean | `@${string}`
}>;
	/** The price of a search result product, either as a range or as a single price */
["SearchResultPrice"]: AliasType<{		["...on PriceRange"] : ValueTypes["PriceRange"],
		["...on SinglePrice"] : ValueTypes["SinglePrice"]
		__typename?: boolean | `@${string}`
}>;
	/** The price value where the result has a single price */
["SinglePrice"]: AliasType<{
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** The price range where the result has more than one price */
["PriceRange"]: AliasType<{
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ValueTypes["ProductTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductList"]: AliasType<{
	items?:ValueTypes["Product"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantList"]: AliasType<{
	items?:ValueTypes["ProductVariant"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Promotion"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	startsAt?:boolean | `@${string}`,
	endsAt?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
	perCustomerUsageLimit?:boolean | `@${string}`,
	usageLimit?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	conditions?:ValueTypes["ConfigurableOperation"],
	actions?:ValueTypes["ConfigurableOperation"],
	translations?:ValueTypes["PromotionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PromotionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PromotionList"]: AliasType<{
	items?:ValueTypes["Promotion"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Region"]:AliasType<{
		id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ValueTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ValueTypes["RegionTranslation"];
		['...on Country']?: Omit<ValueTypes["Country"],keyof ValueTypes["Region"]>;
		['...on Province']?: Omit<ValueTypes["Province"],keyof ValueTypes["Region"]>;
		__typename?: boolean | `@${string}`
}>;
	["RegionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** A Country of the world which your shop operates in.

The `code` field is typically a 2-character ISO code such as "GB", "US", "DE" etc. This code is used in certain inputs such as
`UpdateAddressInput` and `CreateAddressInput` to specify the country. */
["Country"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ValueTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ValueTypes["RegionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CountryList"]: AliasType<{
	items?:ValueTypes["Country"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Province"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ValueTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ValueTypes["RegionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProvinceList"]: AliasType<{
	items?:ValueTypes["Province"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Role"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	permissions?:boolean | `@${string}`,
	channels?:ValueTypes["Channel"],
		__typename?: boolean | `@${string}`
}>;
	["RoleList"]: AliasType<{
	items?:ValueTypes["Role"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Seller"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	fulfillmentHandlerCode?:boolean | `@${string}`,
	checker?:ValueTypes["ConfigurableOperation"],
	calculator?:ValueTypes["ConfigurableOperation"],
	translations?:ValueTypes["ShippingMethodTranslation"],
	customFields?:ValueTypes["ShippingMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ValueTypes["ShippingMethodTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodList"]: AliasType<{
	items?:ValueTypes["ShippingMethod"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Tag"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TagList"]: AliasType<{
	items?:ValueTypes["Tag"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxCategory"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	isDefault?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxRate"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
	category?:ValueTypes["TaxCategory"],
	zone?:ValueTypes["Zone"],
	customerGroup?:ValueTypes["CustomerGroup"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxRateList"]: AliasType<{
	items?:ValueTypes["TaxRate"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	identifier?:boolean | `@${string}`,
	verified?:boolean | `@${string}`,
	roles?:ValueTypes["Role"],
	lastLogin?:boolean | `@${string}`,
	authenticationMethods?:ValueTypes["AuthenticationMethod"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AuthenticationMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	strategy?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Zone"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	members?:ValueTypes["Region"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MetricSummary"]: AliasType<{
	interval?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	entries?:ValueTypes["MetricSummaryEntry"],
		__typename?: boolean | `@${string}`
}>;
	["MetricInterval"]:MetricInterval;
	["MetricType"]:MetricType;
	["MetricSummaryEntry"]: AliasType<{
	label?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MetricSummaryInput"]: {
	interval: ValueTypes["MetricInterval"] | Variable<any, string>,
	types: Array<ValueTypes["MetricType"]> | Variable<any, string>,
	refresh?: boolean | undefined | null | Variable<any, string>
};
	["PageType"]:PageType;
	["Author"]: AliasType<{
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Page"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	asset?:ValueTypes["Asset"],
	position?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	author?:ValueTypes["Author"],
translations?: [{	languageCode?: ValueTypes["LanguageCode"] | undefined | null | Variable<any, string>},ValueTypes["PageTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["PageTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	tags?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageList"]: AliasType<{
	items?:ValueTypes["Page"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["PageSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["PageFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["PageTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	content: string | Variable<any, string>,
	slug: string | Variable<any, string>,
	title: string | Variable<any, string>,
	description: string | Variable<any, string>,
	tags?: string | undefined | null | Variable<any, string>
};
	["UpdatePageInput"]: {
	id: string | Variable<any, string>,
	position?: number | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	assetId?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["PageTranslationInput"]> | undefined | null | Variable<any, string>
};
	["CreatePageInput"]: {
	position?: number | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	type: ValueTypes["PageType"] | Variable<any, string>,
	assetId?: string | undefined | null | Variable<any, string>,
	authorId?: string | undefined | null | Variable<any, string>,
	translations: Array<ValueTypes["PageTranslationInput"]> | Variable<any, string>
};
	["DeletePageInput"]: {
	id: string | Variable<any, string>
};
	["AnnouncementBarEntryTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	text?:boolean | `@${string}`,
	redirectUrl?:boolean | `@${string}`,
	icon?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarEntry"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	text?:boolean | `@${string}`,
	redirectUrl?:boolean | `@${string}`,
	icon?:boolean | `@${string}`,
	colorIcon?:boolean | `@${string}`,
	colorText?:boolean | `@${string}`,
translations?: [{	languageCode?: ValueTypes["LanguageCode"] | undefined | null | Variable<any, string>},ValueTypes["AnnouncementBarEntryTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBar"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	startDate?:boolean | `@${string}`,
	endDate?:boolean | `@${string}`,
	speed?:boolean | `@${string}`,
	spaceBetween?:boolean | `@${string}`,
	colorBackground?:boolean | `@${string}`,
	nowActive?:boolean | `@${string}`,
	entries?:ValueTypes["AnnouncementBarEntry"],
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarList"]: AliasType<{
	items?:ValueTypes["AnnouncementBar"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["AnnouncementBarSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["AnnouncementBarFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["AnnouncementBarEntryTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	text: string | Variable<any, string>,
	redirectUrl: string | Variable<any, string>,
	icon: string | Variable<any, string>
};
	["AnnouncementBarEntryInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	colorIcon?: string | undefined | null | Variable<any, string>,
	colorText?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["AnnouncementBarEntryTranslationInput"]> | undefined | null | Variable<any, string>
};
	["UpdateAnnouncementBarInput"]: {
	id: string | Variable<any, string>,
	title?: string | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	speed?: number | undefined | null | Variable<any, string>,
	spaceBetween?: number | undefined | null | Variable<any, string>,
	colorBackground?: string | undefined | null | Variable<any, string>,
	entries?: Array<ValueTypes["AnnouncementBarEntryInput"]> | undefined | null | Variable<any, string>
};
	["CreateAnnouncementBarInput"]: {
	title?: string | undefined | null | Variable<any, string>,
	enabled?: boolean | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["DateTime"] | undefined | null | Variable<any, string>,
	speed?: number | undefined | null | Variable<any, string>,
	spaceBetween?: number | undefined | null | Variable<any, string>,
	colorBackground?: string | undefined | null | Variable<any, string>,
	entries?: Array<ValueTypes["AnnouncementBarEntryInput"]> | undefined | null | Variable<any, string>
};
	["DeleteAnnouncementBarInput"]: {
	id: string | Variable<any, string>
};
	["ChangeStatusAnnouncementBarInput"]: {
	id: string | Variable<any, string>,
	enabled: boolean | Variable<any, string>
};
	["WishlistItem"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	product?:ValueTypes["Product"],
	wishlistId?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	minVariantPrice?:boolean | `@${string}`,
	maxVariantPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistList"]: AliasType<{
	items?:ValueTypes["WishlistItem"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["WishlistSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["WishlistFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["Wishlist"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
entries?: [{	options?: ValueTypes["WishlistListOptions"] | undefined | null | Variable<any, string>},ValueTypes["WishlistList"]],
		__typename?: boolean | `@${string}`
}>;
	["WishlistEntryID"]: AliasType<{
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistIDs"]: AliasType<{
	id?:boolean | `@${string}`,
	entries?:ValueTypes["WishlistEntryID"],
		__typename?: boolean | `@${string}`
}>;
	["OrderRealization"]: AliasType<{
	orderID?:boolean | `@${string}`,
	assetID?:boolean | `@${string}`,
	plannedAt?:boolean | `@${string}`,
	finalPlannedAt?:boolean | `@${string}`,
	note?:boolean | `@${string}`,
	color?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DiscountedPriceMetadata"]: AliasType<{
	price?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	isCustomerGroup?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DiscountedPrice"]: AliasType<{
	value?:boolean | `@${string}`,
	metadata?:ValueTypes["DiscountedPriceMetadata"],
		__typename?: boolean | `@${string}`
}>;
	["ShopOrderRealization"]: AliasType<{
	note?:boolean | `@${string}`,
	plannedAt?:boolean | `@${string}`,
	finalPlannedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RealizationAssetInput"]: {
	id: string | Variable<any, string>,
	orderLineID: string | Variable<any, string>,
	preview: string | Variable<any, string>
};
	["OrderRealizationInput"]: {
	orderID: string | Variable<any, string>,
	assets: Array<ValueTypes["RealizationAssetInput"]> | Variable<any, string>,
	plannedAt: string | Variable<any, string>,
	finalPlannedAt: string | Variable<any, string>,
	note: string | Variable<any, string>,
	color: string | Variable<any, string>
};
	["RegisterProformaInput"]: {
	orderID: string | Variable<any, string>
};
	["NewsletterSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	customer?:ValueTypes["Customer"],
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BackInStockSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	registerToNewsletter?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	customer?:ValueTypes["Customer"],
	variant?:ValueTypes["ProductVariant"],
	product?:ValueTypes["Product"],
	images?:boolean | `@${string}`,
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["B2BSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	NIP?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	number?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NewsletterSubscriberList"]: AliasType<{
	items?:ValueTypes["NewsletterSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BackInStockSubscriberList"]: AliasType<{
	items?:ValueTypes["BackInStockSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["B2BSubscriberList"]: AliasType<{
	items?:ValueTypes["B2BSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NewsletterSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["NewsletterSubscriberSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["NewsletterSubscriberFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["BackInStockSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["BackInStockSubscriberSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["BackInStockSubscriberFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["B2BSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["B2BSubscriberSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["B2BSubscriberFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["Model"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	product?:ValueTypes["Product"],
translations?: [{	languageCode?: ValueTypes["LanguageCode"] | undefined | null | Variable<any, string>},ValueTypes["ModelTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["ModelTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelList"]: AliasType<{
	items?:ValueTypes["Model"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null | Variable<any, string>,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null | Variable<any, string>,
	/** Specifies which properties to sort the results by */
	sort?: ValueTypes["ModelSortParameter"] | undefined | null | Variable<any, string>,
	/** Allows the results to be filtered */
	filter?: ValueTypes["ModelFilterParameter"] | undefined | null | Variable<any, string>,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ValueTypes["LogicalOperator"] | undefined | null | Variable<any, string>
};
	["ModelTranslationInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	languageCode: ValueTypes["LanguageCode"] | Variable<any, string>,
	title: string | Variable<any, string>,
	content: string | Variable<any, string>
};
	["UpdateModelInput"]: {
	id: string | Variable<any, string>,
	productId?: string | undefined | null | Variable<any, string>,
	translations?: Array<ValueTypes["ModelTranslationInput"]> | undefined | null | Variable<any, string>
};
	["CreateModelInput"]: {
	file: ValueTypes["Upload"] | Variable<any, string>,
	productId?: string | undefined | null | Variable<any, string>,
	translations: Array<ValueTypes["ModelTranslationInput"]> | Variable<any, string>
};
	["DeleteModelInput"]: {
	id: string | Variable<any, string>
};
	["AdministratorFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	firstName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	lastName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	emailAddress?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["AdministratorSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	firstName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	lastName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	emailAddress?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["AssetFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	fileSize?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	mimeType?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	width?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	height?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	source?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	preview?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["AssetSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	fileSize?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	mimeType?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	width?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	height?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	source?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	preview?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ChannelFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	token?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	defaultLanguageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	currencyCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	defaultCurrencyCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	trackInventory?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	outOfStockThreshold?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	pricesIncludeTax?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["ChannelSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	token?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	outOfStockThreshold?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["CollectionFilterParameter"]: {
	isPrivate?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	inheritFilters?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	position?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	seoTitle?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seoDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["CollectionSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	position?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	seoTitle?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	seoDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	facebookImage?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	twitterImage?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ProductVariantSortParameter"]: {
	stockOnHand?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	stockAllocated?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	outOfStockThreshold?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	productId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	sku?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	price?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	priceWithTax?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	stockLevel?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	omnibusPrice?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["CountryFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>
};
	["CountrySortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["CustomerGroupFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["CustomerGroupSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["CustomerSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	firstName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	lastName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	phoneNumber?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	emailAddress?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["FacetFilterParameter"]: {
	isPrivate?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	usedForColors?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	usedForProductCreations?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	colorsCollection?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["FacetSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	usedForColors?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	usedForProductCreations?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	colorsCollection?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["FacetValueFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	facetId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	hexColor?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	isNew?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["FacetValueSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	facetId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	image?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	hexColor?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	isNew?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["JobFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	startedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	settledAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	queueName?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	state?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	progress?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	isSettled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	duration?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	retries?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	attempts?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>
};
	["JobSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	startedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	settledAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	queueName?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	progress?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	duration?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	retries?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	attempts?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["PaymentMethodFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	modalTitle?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	modalDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["PaymentMethodSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalTitle?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ProductSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	seoTitle?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	seoDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	facebookImage?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	twitterImage?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	optionsOrder?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	sizes?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	finish?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	materials?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	payment?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	delivery?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	realization?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	discountBy?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["PromotionFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	startsAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	endsAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	couponCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	perCustomerUsageLimit?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	usageLimit?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["PromotionSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	startsAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	endsAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	couponCode?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	perCustomerUsageLimit?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	usageLimit?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ProvinceFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>
};
	["ProvinceSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	parentId?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["RoleFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["RoleSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["SellerFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["SellerSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ShippingMethodFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	languageCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	fulfillmentHandlerCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	modalTitle?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	modalDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["ShippingMethodSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	code?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	fulfillmentHandlerCode?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalTitle?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["StockLocationFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["StockLocationSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["TagFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	value?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["TagSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	value?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["TaxCategoryFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	isDefault?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["TaxCategorySortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["TaxRateFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	value?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>
};
	["TaxRateSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	value?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ZoneFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["ZoneSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["PageFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	content?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	position?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["PageSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	content?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	description?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	slug?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	position?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["AnnouncementBarFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	enabled?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	speed?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	spaceBetween?: ValueTypes["NumberOperators"] | undefined | null | Variable<any, string>,
	colorBackground?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	nowActive?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["AnnouncementBarSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	speed?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	spaceBetween?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	colorBackground?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["WishlistFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	currencyCode?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["WishlistSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["NewsletterSubscriberFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	data?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seen?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["NewsletterSubscriberSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	data?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["BackInStockSubscriberFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	data?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	registerToNewsletter?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	options?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seen?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["BackInStockSubscriberSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	data?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	options?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["B2BSubscriberFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	NIP?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	city?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	number?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	message?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	seen?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>
};
	["B2BSubscriberSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	NIP?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	city?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	number?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	message?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["ModelFilterParameter"]: {
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	content?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	url?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>,
	key?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["ModelSortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	title?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	content?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	url?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	key?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["HistoryEntryFilterParameter"]: {
	isPublic?: ValueTypes["BooleanOperators"] | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDOperators"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["DateOperators"] | undefined | null | Variable<any, string>,
	type?: ValueTypes["StringOperators"] | undefined | null | Variable<any, string>
};
	["HistoryEntrySortParameter"]: {
	id?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["SortOrder"] | undefined | null | Variable<any, string>
};
	["AddressCustomFields"]: AliasType<{
	companyName?:boolean | `@${string}`,
	companyTaxId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateAddressCustomFieldsInput"]: {
	companyName?: string | undefined | null | Variable<any, string>,
	companyTaxId?: string | undefined | null | Variable<any, string>
};
	["UpdateAddressCustomFieldsInput"]: {
	companyName?: string | undefined | null | Variable<any, string>,
	companyTaxId?: string | undefined | null | Variable<any, string>
};
	["CollectionCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	facebookImage?:ValueTypes["Asset"],
	twitterImage?:ValueTypes["Asset"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionTranslationCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null | Variable<any, string>,
	twitterImageId?: string | undefined | null | Variable<any, string>
};
	["UpdateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null | Variable<any, string>,
	twitterImageId?: string | undefined | null | Variable<any, string>
};
	["CreateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null | Variable<any, string>,
	seoDescription?: string | undefined | null | Variable<any, string>
};
	["UpdateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null | Variable<any, string>,
	seoDescription?: string | undefined | null | Variable<any, string>
};
	["FacetCustomFields"]: AliasType<{
	usedForColors?:boolean | `@${string}`,
	usedForProductCreations?:boolean | `@${string}`,
	colorsCollection?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined | null | Variable<any, string>,
	usedForProductCreations?: boolean | undefined | null | Variable<any, string>,
	colorsCollection?: boolean | undefined | null | Variable<any, string>
};
	["UpdateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined | null | Variable<any, string>,
	usedForProductCreations?: boolean | undefined | null | Variable<any, string>,
	colorsCollection?: boolean | undefined | null | Variable<any, string>
};
	["FacetValueCustomFields"]: AliasType<{
	image?:ValueTypes["Asset"],
	hexColor?:boolean | `@${string}`,
	isNew?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined | null | Variable<any, string>,
	hexColor?: string | undefined | null | Variable<any, string>,
	isNew?: boolean | undefined | null | Variable<any, string>
};
	["UpdateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined | null | Variable<any, string>,
	hexColor?: string | undefined | null | Variable<any, string>,
	isNew?: boolean | undefined | null | Variable<any, string>
};
	["OrderCustomFields"]: AliasType<{
	registeredOnCheckout?:boolean | `@${string}`,
	selectedPaymentMethod?:ValueTypes["PaymentMethod"],
	additionalInformation?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderCustomFieldsInput"]: {
	registeredOnCheckout?: boolean | undefined | null | Variable<any, string>,
	selectedPaymentMethodId?: string | undefined | null | Variable<any, string>,
	additionalInformation?: string | undefined | null | Variable<any, string>
};
	["OrderLineCustomFields"]: AliasType<{
	attributes?:boolean | `@${string}`,
	discountBy?:boolean | `@${string}`,
	selectedImage?:ValueTypes["Asset"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslationCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined | null | Variable<any, string>,
	modalDescription?: string | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: string | undefined | null | Variable<any, string>
};
	["ProductCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	facebookImage?:ValueTypes["Asset"],
	twitterImage?:ValueTypes["Asset"],
	optionsOrder?:boolean | `@${string}`,
	sizes?:boolean | `@${string}`,
	finish?:boolean | `@${string}`,
	materials?:boolean | `@${string}`,
	payment?:boolean | `@${string}`,
	delivery?:boolean | `@${string}`,
	realization?:boolean | `@${string}`,
	discountBy?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductTranslationCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	sizes?:boolean | `@${string}`,
	finish?:boolean | `@${string}`,
	materials?:boolean | `@${string}`,
	payment?:boolean | `@${string}`,
	delivery?:boolean | `@${string}`,
	realization?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null | Variable<any, string>,
	twitterImageId?: string | undefined | null | Variable<any, string>,
	optionsOrder?: string | undefined | null | Variable<any, string>,
	discountBy?: number | undefined | null | Variable<any, string>
};
	["UpdateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null | Variable<any, string>,
	twitterImageId?: string | undefined | null | Variable<any, string>,
	optionsOrder?: string | undefined | null | Variable<any, string>,
	discountBy?: number | undefined | null | Variable<any, string>
};
	["ProductTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null | Variable<any, string>,
	seoDescription?: string | undefined | null | Variable<any, string>,
	sizes?: string | undefined | null | Variable<any, string>,
	finish?: string | undefined | null | Variable<any, string>,
	materials?: string | undefined | null | Variable<any, string>,
	payment?: string | undefined | null | Variable<any, string>,
	delivery?: string | undefined | null | Variable<any, string>,
	realization?: string | undefined | null | Variable<any, string>
};
	["ProductOptionCustomFields"]: AliasType<{
	image?:ValueTypes["Asset"],
	hexColor?:boolean | `@${string}`,
	isNew?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined | null | Variable<any, string>,
	hexColor?: string | undefined | null | Variable<any, string>,
	isNew?: boolean | undefined | null | Variable<any, string>
};
	["UpdateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined | null | Variable<any, string>,
	hexColor?: string | undefined | null | Variable<any, string>,
	isNew?: boolean | undefined | null | Variable<any, string>
};
	["ShippingMethodCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslationCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined | null | Variable<any, string>,
	modalDescription?: string | undefined | null | Variable<any, string>,
	modalAdditionalDescription?: string | undefined | null | Variable<any, string>
};
	["OrderLineCustomFieldsInput"]: {
	attributes?: string | undefined | null | Variable<any, string>,
	discountBy?: number | undefined | null | Variable<any, string>,
	selectedImageId?: string | undefined | null | Variable<any, string>
};
	["NativeAuthInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["CustomFields"]: AliasType<{
	Address?:ValueTypes["CustomFieldConfig"],
	Administrator?:ValueTypes["CustomFieldConfig"],
	Asset?:ValueTypes["CustomFieldConfig"],
	Channel?:ValueTypes["CustomFieldConfig"],
	Collection?:ValueTypes["CustomFieldConfig"],
	Customer?:ValueTypes["CustomFieldConfig"],
	CustomerGroup?:ValueTypes["CustomFieldConfig"],
	Facet?:ValueTypes["CustomFieldConfig"],
	FacetValue?:ValueTypes["CustomFieldConfig"],
	Fulfillment?:ValueTypes["CustomFieldConfig"],
	GlobalSettings?:ValueTypes["CustomFieldConfig"],
	Order?:ValueTypes["CustomFieldConfig"],
	OrderLine?:ValueTypes["CustomFieldConfig"],
	PaymentMethod?:ValueTypes["CustomFieldConfig"],
	Product?:ValueTypes["CustomFieldConfig"],
	ProductOption?:ValueTypes["CustomFieldConfig"],
	ProductOptionGroup?:ValueTypes["CustomFieldConfig"],
	ProductVariant?:ValueTypes["CustomFieldConfig"],
	Promotion?:ValueTypes["CustomFieldConfig"],
	Region?:ValueTypes["CustomFieldConfig"],
	Seller?:ValueTypes["CustomFieldConfig"],
	ShippingMethod?:ValueTypes["CustomFieldConfig"],
	StockLocation?:ValueTypes["CustomFieldConfig"],
	TaxCategory?:ValueTypes["CustomFieldConfig"],
	TaxRate?:ValueTypes["CustomFieldConfig"],
	User?:ValueTypes["CustomFieldConfig"],
	Zone?:ValueTypes["CustomFieldConfig"],
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
administrators?: [{	options?: ResolverInputTypes["AdministratorListOptions"] | undefined | null},ResolverInputTypes["AdministratorList"]],
administrator?: [{	id: string},ResolverInputTypes["Administrator"]],
	activeAdministrator?:ResolverInputTypes["Administrator"],
assets?: [{	options?: ResolverInputTypes["AssetListOptions"] | undefined | null},ResolverInputTypes["AssetList"]],
asset?: [{	id: string},ResolverInputTypes["Asset"]],
	me?:ResolverInputTypes["CurrentUser"],
channels?: [{	options?: ResolverInputTypes["ChannelListOptions"] | undefined | null},ResolverInputTypes["ChannelList"]],
channel?: [{	id: string},ResolverInputTypes["Channel"]],
	activeChannel?:ResolverInputTypes["Channel"],
collections?: [{	options?: ResolverInputTypes["CollectionListOptions"] | undefined | null},ResolverInputTypes["CollectionList"]],
collection?: [{	id?: string | undefined | null,	slug?: string | undefined | null},ResolverInputTypes["Collection"]],
	collectionFilters?:ResolverInputTypes["ConfigurableOperationDefinition"],
previewCollectionVariants?: [{	input: ResolverInputTypes["PreviewCollectionVariantsInput"],	options?: ResolverInputTypes["ProductVariantListOptions"] | undefined | null},ResolverInputTypes["ProductVariantList"]],
countries?: [{	options?: ResolverInputTypes["CountryListOptions"] | undefined | null},ResolverInputTypes["CountryList"]],
country?: [{	id: string},ResolverInputTypes["Country"]],
customerGroups?: [{	options?: ResolverInputTypes["CustomerGroupListOptions"] | undefined | null},ResolverInputTypes["CustomerGroupList"]],
customerGroup?: [{	id: string},ResolverInputTypes["CustomerGroup"]],
customers?: [{	options?: ResolverInputTypes["CustomerListOptions"] | undefined | null},ResolverInputTypes["CustomerList"]],
customer?: [{	id: string},ResolverInputTypes["Customer"]],
facets?: [{	options?: ResolverInputTypes["FacetListOptions"] | undefined | null},ResolverInputTypes["FacetList"]],
facet?: [{	id: string},ResolverInputTypes["Facet"]],
facetValues?: [{	options?: ResolverInputTypes["FacetValueListOptions"] | undefined | null},ResolverInputTypes["FacetValueList"]],
	globalSettings?:ResolverInputTypes["GlobalSettings"],
job?: [{	jobId: string},ResolverInputTypes["Job"]],
jobs?: [{	options?: ResolverInputTypes["JobListOptions"] | undefined | null},ResolverInputTypes["JobList"]],
jobsById?: [{	jobIds: Array<string>},ResolverInputTypes["Job"]],
	jobQueues?:ResolverInputTypes["JobQueue"],
jobBufferSize?: [{	bufferIds?: Array<string> | undefined | null},ResolverInputTypes["JobBufferSize"]],
order?: [{	id: string},ResolverInputTypes["Order"]],
orders?: [{	options?: ResolverInputTypes["OrderListOptions"] | undefined | null},ResolverInputTypes["OrderList"]],
eligibleShippingMethodsForDraftOrder?: [{	orderId: string},ResolverInputTypes["ShippingMethodQuote"]],
paymentMethods?: [{	options?: ResolverInputTypes["PaymentMethodListOptions"] | undefined | null},ResolverInputTypes["PaymentMethodList"]],
paymentMethod?: [{	id: string},ResolverInputTypes["PaymentMethod"]],
	paymentMethodEligibilityCheckers?:ResolverInputTypes["ConfigurableOperationDefinition"],
	paymentMethodHandlers?:ResolverInputTypes["ConfigurableOperationDefinition"],
productOptionGroups?: [{	filterTerm?: string | undefined | null},ResolverInputTypes["ProductOptionGroup"]],
productOptionGroup?: [{	id: string},ResolverInputTypes["ProductOptionGroup"]],
search?: [{	input: ResolverInputTypes["SearchInput"]},ResolverInputTypes["SearchResponse"]],
	pendingSearchIndexUpdates?:boolean | `@${string}`,
products?: [{	options?: ResolverInputTypes["ProductListOptions"] | undefined | null},ResolverInputTypes["ProductList"]],
product?: [{	id?: string | undefined | null,	slug?: string | undefined | null},ResolverInputTypes["Product"]],
productVariants?: [{	options?: ResolverInputTypes["ProductVariantListOptions"] | undefined | null,	productId?: string | undefined | null},ResolverInputTypes["ProductVariantList"]],
productVariant?: [{	id: string},ResolverInputTypes["ProductVariant"]],
promotion?: [{	id: string},ResolverInputTypes["Promotion"]],
promotions?: [{	options?: ResolverInputTypes["PromotionListOptions"] | undefined | null},ResolverInputTypes["PromotionList"]],
	promotionConditions?:ResolverInputTypes["ConfigurableOperationDefinition"],
	promotionActions?:ResolverInputTypes["ConfigurableOperationDefinition"],
provinces?: [{	options?: ResolverInputTypes["ProvinceListOptions"] | undefined | null},ResolverInputTypes["ProvinceList"]],
province?: [{	id: string},ResolverInputTypes["Province"]],
roles?: [{	options?: ResolverInputTypes["RoleListOptions"] | undefined | null},ResolverInputTypes["RoleList"]],
role?: [{	id: string},ResolverInputTypes["Role"]],
sellers?: [{	options?: ResolverInputTypes["SellerListOptions"] | undefined | null},ResolverInputTypes["SellerList"]],
seller?: [{	id: string},ResolverInputTypes["Seller"]],
shippingMethods?: [{	options?: ResolverInputTypes["ShippingMethodListOptions"] | undefined | null},ResolverInputTypes["ShippingMethodList"]],
shippingMethod?: [{	id: string},ResolverInputTypes["ShippingMethod"]],
	shippingEligibilityCheckers?:ResolverInputTypes["ConfigurableOperationDefinition"],
	shippingCalculators?:ResolverInputTypes["ConfigurableOperationDefinition"],
	fulfillmentHandlers?:ResolverInputTypes["ConfigurableOperationDefinition"],
testShippingMethod?: [{	input: ResolverInputTypes["TestShippingMethodInput"]},ResolverInputTypes["TestShippingMethodResult"]],
testEligibleShippingMethods?: [{	input: ResolverInputTypes["TestEligibleShippingMethodsInput"]},ResolverInputTypes["ShippingMethodQuote"]],
stockLocation?: [{	id: string},ResolverInputTypes["StockLocation"]],
stockLocations?: [{	options?: ResolverInputTypes["StockLocationListOptions"] | undefined | null},ResolverInputTypes["StockLocationList"]],
tag?: [{	id: string},ResolverInputTypes["Tag"]],
tags?: [{	options?: ResolverInputTypes["TagListOptions"] | undefined | null},ResolverInputTypes["TagList"]],
taxCategories?: [{	options?: ResolverInputTypes["TaxCategoryListOptions"] | undefined | null},ResolverInputTypes["TaxCategoryList"]],
taxCategory?: [{	id: string},ResolverInputTypes["TaxCategory"]],
taxRates?: [{	options?: ResolverInputTypes["TaxRateListOptions"] | undefined | null},ResolverInputTypes["TaxRateList"]],
taxRate?: [{	id: string},ResolverInputTypes["TaxRate"]],
zones?: [{	options?: ResolverInputTypes["ZoneListOptions"] | undefined | null},ResolverInputTypes["ZoneList"]],
zone?: [{	id: string},ResolverInputTypes["Zone"]],
metricSummary?: [{	input?: ResolverInputTypes["MetricSummaryInput"] | undefined | null},ResolverInputTypes["MetricSummary"]],
page?: [{	id: string},ResolverInputTypes["Page"]],
pages?: [{	options?: ResolverInputTypes["PageListOptions"] | undefined | null},ResolverInputTypes["PageList"]],
announcementBar?: [{	id: string},ResolverInputTypes["AnnouncementBar"]],
announcementBars?: [{	options?: ResolverInputTypes["AnnouncementBarListOptions"] | undefined | null},ResolverInputTypes["AnnouncementBarList"]],
	getActiveAnnouncementBar?:ResolverInputTypes["AnnouncementBar"],
wishlist?: [{	id: string},ResolverInputTypes["Wishlist"]],
wishlists?: [{	options?: ResolverInputTypes["WishlistListOptions"] | undefined | null},ResolverInputTypes["WishlistList"]],
mostWishedProducts?: [{	options?: ResolverInputTypes["ProductListOptions"] | undefined | null},ResolverInputTypes["ProductList"]],
getRealizationURL?: [{	orderID: string},boolean | `@${string}`],
getProformaURL?: [{	orderID: string},boolean | `@${string}`],
newsletterSubscribers?: [{	options?: ResolverInputTypes["NewsletterSubscriberListOptions"] | undefined | null},ResolverInputTypes["NewsletterSubscriberList"]],
backInStockSubscribers?: [{	options?: ResolverInputTypes["BackInStockSubscriberListOptions"] | undefined | null},ResolverInputTypes["BackInStockSubscriberList"]],
b2bSubscribers?: [{	options?: ResolverInputTypes["B2BSubscriberListOptions"] | undefined | null},ResolverInputTypes["B2BSubscriberList"]],
	haveNotSeenNewsletterSubscribers?:boolean | `@${string}`,
	haveNotSeenBackInStockSubscribers?:boolean | `@${string}`,
	haveNotSeenB2BSubscribers?:boolean | `@${string}`,
model?: [{	id: string},ResolverInputTypes["Model"]],
models?: [{	options?: ResolverInputTypes["ModelListOptions"] | undefined | null},ResolverInputTypes["ModelList"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createAdministrator?: [{	input: ResolverInputTypes["CreateAdministratorInput"]},ResolverInputTypes["Administrator"]],
updateAdministrator?: [{	input: ResolverInputTypes["UpdateAdministratorInput"]},ResolverInputTypes["Administrator"]],
updateActiveAdministrator?: [{	input: ResolverInputTypes["UpdateActiveAdministratorInput"]},ResolverInputTypes["Administrator"]],
deleteAdministrator?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteAdministrators?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
assignRoleToAdministrator?: [{	administratorId: string,	roleId: string},ResolverInputTypes["Administrator"]],
createAssets?: [{	input: Array<ResolverInputTypes["CreateAssetInput"]>},ResolverInputTypes["CreateAssetResult"]],
updateAsset?: [{	input: ResolverInputTypes["UpdateAssetInput"]},ResolverInputTypes["Asset"]],
deleteAsset?: [{	input: ResolverInputTypes["DeleteAssetInput"]},ResolverInputTypes["DeletionResponse"]],
deleteAssets?: [{	input: ResolverInputTypes["DeleteAssetsInput"]},ResolverInputTypes["DeletionResponse"]],
assignAssetsToChannel?: [{	input: ResolverInputTypes["AssignAssetsToChannelInput"]},ResolverInputTypes["Asset"]],
login?: [{	username: string,	password: string,	rememberMe?: boolean | undefined | null},ResolverInputTypes["NativeAuthenticationResult"]],
authenticate?: [{	input: ResolverInputTypes["AuthenticationInput"],	rememberMe?: boolean | undefined | null},ResolverInputTypes["AuthenticationResult"]],
	logout?:ResolverInputTypes["Success"],
createChannel?: [{	input: ResolverInputTypes["CreateChannelInput"]},ResolverInputTypes["CreateChannelResult"]],
updateChannel?: [{	input: ResolverInputTypes["UpdateChannelInput"]},ResolverInputTypes["UpdateChannelResult"]],
deleteChannel?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteChannels?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createCollection?: [{	input: ResolverInputTypes["CreateCollectionInput"]},ResolverInputTypes["Collection"]],
updateCollection?: [{	input: ResolverInputTypes["UpdateCollectionInput"]},ResolverInputTypes["Collection"]],
deleteCollection?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteCollections?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
moveCollection?: [{	input: ResolverInputTypes["MoveCollectionInput"]},ResolverInputTypes["Collection"]],
assignCollectionsToChannel?: [{	input: ResolverInputTypes["AssignCollectionsToChannelInput"]},ResolverInputTypes["Collection"]],
removeCollectionsFromChannel?: [{	input: ResolverInputTypes["RemoveCollectionsFromChannelInput"]},ResolverInputTypes["Collection"]],
createCountry?: [{	input: ResolverInputTypes["CreateCountryInput"]},ResolverInputTypes["Country"]],
updateCountry?: [{	input: ResolverInputTypes["UpdateCountryInput"]},ResolverInputTypes["Country"]],
deleteCountry?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteCountries?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createCustomerGroup?: [{	input: ResolverInputTypes["CreateCustomerGroupInput"]},ResolverInputTypes["CustomerGroup"]],
updateCustomerGroup?: [{	input: ResolverInputTypes["UpdateCustomerGroupInput"]},ResolverInputTypes["CustomerGroup"]],
deleteCustomerGroup?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteCustomerGroups?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
addCustomersToGroup?: [{	customerGroupId: string,	customerIds: Array<string>},ResolverInputTypes["CustomerGroup"]],
removeCustomersFromGroup?: [{	customerGroupId: string,	customerIds: Array<string>},ResolverInputTypes["CustomerGroup"]],
createCustomer?: [{	input: ResolverInputTypes["CreateCustomerInput"],	password?: string | undefined | null},ResolverInputTypes["CreateCustomerResult"]],
updateCustomer?: [{	input: ResolverInputTypes["UpdateCustomerInput"]},ResolverInputTypes["UpdateCustomerResult"]],
deleteCustomer?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteCustomers?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createCustomerAddress?: [{	customerId: string,	input: ResolverInputTypes["CreateAddressInput"]},ResolverInputTypes["Address"]],
updateCustomerAddress?: [{	input: ResolverInputTypes["UpdateAddressInput"]},ResolverInputTypes["Address"]],
deleteCustomerAddress?: [{	id: string},ResolverInputTypes["Success"]],
addNoteToCustomer?: [{	input: ResolverInputTypes["AddNoteToCustomerInput"]},ResolverInputTypes["Customer"]],
updateCustomerNote?: [{	input: ResolverInputTypes["UpdateCustomerNoteInput"]},ResolverInputTypes["HistoryEntry"]],
deleteCustomerNote?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
createFacet?: [{	input: ResolverInputTypes["CreateFacetInput"]},ResolverInputTypes["Facet"]],
updateFacet?: [{	input: ResolverInputTypes["UpdateFacetInput"]},ResolverInputTypes["Facet"]],
deleteFacet?: [{	id: string,	force?: boolean | undefined | null},ResolverInputTypes["DeletionResponse"]],
deleteFacets?: [{	ids: Array<string>,	force?: boolean | undefined | null},ResolverInputTypes["DeletionResponse"]],
createFacetValues?: [{	input: Array<ResolverInputTypes["CreateFacetValueInput"]>},ResolverInputTypes["FacetValue"]],
updateFacetValues?: [{	input: Array<ResolverInputTypes["UpdateFacetValueInput"]>},ResolverInputTypes["FacetValue"]],
deleteFacetValues?: [{	ids: Array<string>,	force?: boolean | undefined | null},ResolverInputTypes["DeletionResponse"]],
assignFacetsToChannel?: [{	input: ResolverInputTypes["AssignFacetsToChannelInput"]},ResolverInputTypes["Facet"]],
removeFacetsFromChannel?: [{	input: ResolverInputTypes["RemoveFacetsFromChannelInput"]},ResolverInputTypes["RemoveFacetFromChannelResult"]],
updateGlobalSettings?: [{	input: ResolverInputTypes["UpdateGlobalSettingsInput"]},ResolverInputTypes["UpdateGlobalSettingsResult"]],
importProducts?: [{	csvFile: ResolverInputTypes["Upload"]},ResolverInputTypes["ImportInfo"]],
removeSettledJobs?: [{	queueNames?: Array<string> | undefined | null,	olderThan?: ResolverInputTypes["DateTime"] | undefined | null},boolean | `@${string}`],
cancelJob?: [{	jobId: string},ResolverInputTypes["Job"]],
flushBufferedJobs?: [{	bufferIds?: Array<string> | undefined | null},ResolverInputTypes["Success"]],
settlePayment?: [{	id: string},ResolverInputTypes["SettlePaymentResult"]],
cancelPayment?: [{	id: string},ResolverInputTypes["CancelPaymentResult"]],
addFulfillmentToOrder?: [{	input: ResolverInputTypes["FulfillOrderInput"]},ResolverInputTypes["AddFulfillmentToOrderResult"]],
cancelOrder?: [{	input: ResolverInputTypes["CancelOrderInput"]},ResolverInputTypes["CancelOrderResult"]],
refundOrder?: [{	input: ResolverInputTypes["RefundOrderInput"]},ResolverInputTypes["RefundOrderResult"]],
settleRefund?: [{	input: ResolverInputTypes["SettleRefundInput"]},ResolverInputTypes["SettleRefundResult"]],
addNoteToOrder?: [{	input: ResolverInputTypes["AddNoteToOrderInput"]},ResolverInputTypes["Order"]],
updateOrderNote?: [{	input: ResolverInputTypes["UpdateOrderNoteInput"]},ResolverInputTypes["HistoryEntry"]],
deleteOrderNote?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
transitionOrderToState?: [{	id: string,	state: string},ResolverInputTypes["TransitionOrderToStateResult"]],
transitionFulfillmentToState?: [{	id: string,	state: string},ResolverInputTypes["TransitionFulfillmentToStateResult"]],
transitionPaymentToState?: [{	id: string,	state: string},ResolverInputTypes["TransitionPaymentToStateResult"]],
setOrderCustomFields?: [{	input: ResolverInputTypes["UpdateOrderInput"]},ResolverInputTypes["Order"]],
modifyOrder?: [{	input: ResolverInputTypes["ModifyOrderInput"]},ResolverInputTypes["ModifyOrderResult"]],
addManualPaymentToOrder?: [{	input: ResolverInputTypes["ManualPaymentInput"]},ResolverInputTypes["AddManualPaymentToOrderResult"]],
	/** Creates a draft Order */
	createDraftOrder?:ResolverInputTypes["Order"],
deleteDraftOrder?: [{	orderId: string},ResolverInputTypes["DeletionResponse"]],
addItemToDraftOrder?: [{	orderId: string,	input: ResolverInputTypes["AddItemToDraftOrderInput"]},ResolverInputTypes["UpdateOrderItemsResult"]],
adjustDraftOrderLine?: [{	orderId: string,	input: ResolverInputTypes["AdjustDraftOrderLineInput"]},ResolverInputTypes["UpdateOrderItemsResult"]],
removeDraftOrderLine?: [{	orderId: string,	orderLineId: string},ResolverInputTypes["RemoveOrderItemsResult"]],
setCustomerForDraftOrder?: [{	orderId: string,	customerId?: string | undefined | null,	input?: ResolverInputTypes["CreateCustomerInput"] | undefined | null},ResolverInputTypes["SetCustomerForDraftOrderResult"]],
setDraftOrderShippingAddress?: [{	orderId: string,	input: ResolverInputTypes["CreateAddressInput"]},ResolverInputTypes["Order"]],
setDraftOrderBillingAddress?: [{	orderId: string,	input: ResolverInputTypes["CreateAddressInput"]},ResolverInputTypes["Order"]],
setDraftOrderCustomFields?: [{	orderId: string,	input: ResolverInputTypes["UpdateOrderInput"]},ResolverInputTypes["Order"]],
applyCouponCodeToDraftOrder?: [{	orderId: string,	couponCode: string},ResolverInputTypes["ApplyCouponCodeResult"]],
removeCouponCodeFromDraftOrder?: [{	orderId: string,	couponCode: string},ResolverInputTypes["Order"]],
setDraftOrderShippingMethod?: [{	orderId: string,	shippingMethodId: string},ResolverInputTypes["SetOrderShippingMethodResult"]],
createPaymentMethod?: [{	input: ResolverInputTypes["CreatePaymentMethodInput"]},ResolverInputTypes["PaymentMethod"]],
updatePaymentMethod?: [{	input: ResolverInputTypes["UpdatePaymentMethodInput"]},ResolverInputTypes["PaymentMethod"]],
deletePaymentMethod?: [{	id: string,	force?: boolean | undefined | null},ResolverInputTypes["DeletionResponse"]],
deletePaymentMethods?: [{	ids: Array<string>,	force?: boolean | undefined | null},ResolverInputTypes["DeletionResponse"]],
assignPaymentMethodsToChannel?: [{	input: ResolverInputTypes["AssignPaymentMethodsToChannelInput"]},ResolverInputTypes["PaymentMethod"]],
removePaymentMethodsFromChannel?: [{	input: ResolverInputTypes["RemovePaymentMethodsFromChannelInput"]},ResolverInputTypes["PaymentMethod"]],
createProductOptionGroup?: [{	input: ResolverInputTypes["CreateProductOptionGroupInput"]},ResolverInputTypes["ProductOptionGroup"]],
updateProductOptionGroup?: [{	input: ResolverInputTypes["UpdateProductOptionGroupInput"]},ResolverInputTypes["ProductOptionGroup"]],
createProductOption?: [{	input: ResolverInputTypes["CreateProductOptionInput"]},ResolverInputTypes["ProductOption"]],
updateProductOption?: [{	input: ResolverInputTypes["UpdateProductOptionInput"]},ResolverInputTypes["ProductOption"]],
deleteProductOption?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
	reindex?:ResolverInputTypes["Job"],
	runPendingSearchIndexUpdates?:ResolverInputTypes["Success"],
createProduct?: [{	input: ResolverInputTypes["CreateProductInput"]},ResolverInputTypes["Product"]],
updateProduct?: [{	input: ResolverInputTypes["UpdateProductInput"]},ResolverInputTypes["Product"]],
updateProducts?: [{	input: Array<ResolverInputTypes["UpdateProductInput"]>},ResolverInputTypes["Product"]],
deleteProduct?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteProducts?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
addOptionGroupToProduct?: [{	productId: string,	optionGroupId: string},ResolverInputTypes["Product"]],
removeOptionGroupFromProduct?: [{	productId: string,	optionGroupId: string,	force?: boolean | undefined | null},ResolverInputTypes["RemoveOptionGroupFromProductResult"]],
createProductVariants?: [{	input: Array<ResolverInputTypes["CreateProductVariantInput"]>},ResolverInputTypes["ProductVariant"]],
updateProductVariants?: [{	input: Array<ResolverInputTypes["UpdateProductVariantInput"]>},ResolverInputTypes["ProductVariant"]],
deleteProductVariant?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteProductVariants?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
assignProductsToChannel?: [{	input: ResolverInputTypes["AssignProductsToChannelInput"]},ResolverInputTypes["Product"]],
removeProductsFromChannel?: [{	input: ResolverInputTypes["RemoveProductsFromChannelInput"]},ResolverInputTypes["Product"]],
assignProductVariantsToChannel?: [{	input: ResolverInputTypes["AssignProductVariantsToChannelInput"]},ResolverInputTypes["ProductVariant"]],
removeProductVariantsFromChannel?: [{	input: ResolverInputTypes["RemoveProductVariantsFromChannelInput"]},ResolverInputTypes["ProductVariant"]],
createPromotion?: [{	input: ResolverInputTypes["CreatePromotionInput"]},ResolverInputTypes["CreatePromotionResult"]],
updatePromotion?: [{	input: ResolverInputTypes["UpdatePromotionInput"]},ResolverInputTypes["UpdatePromotionResult"]],
deletePromotion?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deletePromotions?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
assignPromotionsToChannel?: [{	input: ResolverInputTypes["AssignPromotionsToChannelInput"]},ResolverInputTypes["Promotion"]],
removePromotionsFromChannel?: [{	input: ResolverInputTypes["RemovePromotionsFromChannelInput"]},ResolverInputTypes["Promotion"]],
createProvince?: [{	input: ResolverInputTypes["CreateProvinceInput"]},ResolverInputTypes["Province"]],
updateProvince?: [{	input: ResolverInputTypes["UpdateProvinceInput"]},ResolverInputTypes["Province"]],
deleteProvince?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
createRole?: [{	input: ResolverInputTypes["CreateRoleInput"]},ResolverInputTypes["Role"]],
updateRole?: [{	input: ResolverInputTypes["UpdateRoleInput"]},ResolverInputTypes["Role"]],
deleteRole?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteRoles?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createSeller?: [{	input: ResolverInputTypes["CreateSellerInput"]},ResolverInputTypes["Seller"]],
updateSeller?: [{	input: ResolverInputTypes["UpdateSellerInput"]},ResolverInputTypes["Seller"]],
deleteSeller?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteSellers?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createShippingMethod?: [{	input: ResolverInputTypes["CreateShippingMethodInput"]},ResolverInputTypes["ShippingMethod"]],
updateShippingMethod?: [{	input: ResolverInputTypes["UpdateShippingMethodInput"]},ResolverInputTypes["ShippingMethod"]],
deleteShippingMethod?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteShippingMethods?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
assignShippingMethodsToChannel?: [{	input: ResolverInputTypes["AssignShippingMethodsToChannelInput"]},ResolverInputTypes["ShippingMethod"]],
removeShippingMethodsFromChannel?: [{	input: ResolverInputTypes["RemoveShippingMethodsFromChannelInput"]},ResolverInputTypes["ShippingMethod"]],
createStockLocation?: [{	input: ResolverInputTypes["CreateStockLocationInput"]},ResolverInputTypes["StockLocation"]],
updateStockLocation?: [{	input: ResolverInputTypes["UpdateStockLocationInput"]},ResolverInputTypes["StockLocation"]],
deleteStockLocation?: [{	input: ResolverInputTypes["DeleteStockLocationInput"]},ResolverInputTypes["DeletionResponse"]],
deleteStockLocations?: [{	input: Array<ResolverInputTypes["DeleteStockLocationInput"]>},ResolverInputTypes["DeletionResponse"]],
assignStockLocationsToChannel?: [{	input: ResolverInputTypes["AssignStockLocationsToChannelInput"]},ResolverInputTypes["StockLocation"]],
removeStockLocationsFromChannel?: [{	input: ResolverInputTypes["RemoveStockLocationsFromChannelInput"]},ResolverInputTypes["StockLocation"]],
createTag?: [{	input: ResolverInputTypes["CreateTagInput"]},ResolverInputTypes["Tag"]],
updateTag?: [{	input: ResolverInputTypes["UpdateTagInput"]},ResolverInputTypes["Tag"]],
deleteTag?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
createTaxCategory?: [{	input: ResolverInputTypes["CreateTaxCategoryInput"]},ResolverInputTypes["TaxCategory"]],
updateTaxCategory?: [{	input: ResolverInputTypes["UpdateTaxCategoryInput"]},ResolverInputTypes["TaxCategory"]],
deleteTaxCategory?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteTaxCategories?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createTaxRate?: [{	input: ResolverInputTypes["CreateTaxRateInput"]},ResolverInputTypes["TaxRate"]],
updateTaxRate?: [{	input: ResolverInputTypes["UpdateTaxRateInput"]},ResolverInputTypes["TaxRate"]],
deleteTaxRate?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteTaxRates?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
createZone?: [{	input: ResolverInputTypes["CreateZoneInput"]},ResolverInputTypes["Zone"]],
updateZone?: [{	input: ResolverInputTypes["UpdateZoneInput"]},ResolverInputTypes["Zone"]],
deleteZone?: [{	id: string},ResolverInputTypes["DeletionResponse"]],
deleteZones?: [{	ids: Array<string>},ResolverInputTypes["DeletionResponse"]],
addMembersToZone?: [{	zoneId: string,	memberIds: Array<string>},ResolverInputTypes["Zone"]],
removeMembersFromZone?: [{	zoneId: string,	memberIds: Array<string>},ResolverInputTypes["Zone"]],
updatePage?: [{	input: ResolverInputTypes["UpdatePageInput"]},ResolverInputTypes["Page"]],
createPage?: [{	input: ResolverInputTypes["CreatePageInput"]},ResolverInputTypes["Page"]],
deletePage?: [{	input: ResolverInputTypes["DeletePageInput"]},boolean | `@${string}`],
updateAnnouncementBar?: [{	input: ResolverInputTypes["UpdateAnnouncementBarInput"]},ResolverInputTypes["AnnouncementBar"]],
createAnnouncementBar?: [{	input: ResolverInputTypes["CreateAnnouncementBarInput"]},ResolverInputTypes["AnnouncementBar"]],
deleteAnnouncementBar?: [{	input: ResolverInputTypes["DeleteAnnouncementBarInput"]},boolean | `@${string}`],
changeStatusAnnouncementBar?: [{	input: ResolverInputTypes["ChangeStatusAnnouncementBarInput"]},boolean | `@${string}`],
registerRealization?: [{	input: ResolverInputTypes["OrderRealizationInput"]},ResolverInputTypes["OrderRealization"]],
registerProforma?: [{	input: ResolverInputTypes["RegisterProformaInput"]},boolean | `@${string}`],
deleteNewsletterSubscriber?: [{	id: string},boolean | `@${string}`],
markNewsletterAsSeen?: [{	id: string},boolean | `@${string}`],
deleteBackInStockSubscriber?: [{	id: string},boolean | `@${string}`],
markBackInStockAsSeen?: [{	id: string},boolean | `@${string}`],
deleteB2BSubscriber?: [{	id: string},boolean | `@${string}`],
markB2BAsSeen?: [{	id: string},boolean | `@${string}`],
updateModel?: [{	input: ResolverInputTypes["UpdateModelInput"]},ResolverInputTypes["Model"]],
createModel?: [{	input: ResolverInputTypes["CreateModelInput"]},ResolverInputTypes["Model"]],
deleteModel?: [{	input: ResolverInputTypes["DeleteModelInput"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["AdministratorListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["AdministratorSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["AdministratorFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateAdministratorInput"]: {
	firstName: string,
	lastName: string,
	emailAddress: string,
	password: string,
	roleIds: Array<string>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateAdministratorInput"]: {
	id: string,
	firstName?: string | undefined | null,
	lastName?: string | undefined | null,
	emailAddress?: string | undefined | null,
	password?: string | undefined | null,
	roleIds?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateActiveAdministratorInput"]: {
	firstName?: string | undefined | null,
	lastName?: string | undefined | null,
	emailAddress?: string | undefined | null,
	password?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["Administrator"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
	user?:ResolverInputTypes["User"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AdministratorList"]: AliasType<{
	items?:ResolverInputTypes["Administrator"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MimeTypeError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	fileName?:boolean | `@${string}`,
	mimeType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateAssetResult"]: AliasType<{
	Asset?:ResolverInputTypes["Asset"],
	MimeTypeError?:ResolverInputTypes["MimeTypeError"],
		__typename?: boolean | `@${string}`
}>;
	["AssetListOptions"]: {
	tags?: Array<string> | undefined | null,
	tagsOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["AssetSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["AssetFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateAssetInput"]: {
	file: ResolverInputTypes["Upload"],
	tags?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CoordinateInput"]: {
	x: number,
	y: number
};
	["DeleteAssetInput"]: {
	assetId: string,
	force?: boolean | undefined | null,
	deleteFromAllChannels?: boolean | undefined | null
};
	["DeleteAssetsInput"]: {
	assetIds: Array<string>,
	force?: boolean | undefined | null,
	deleteFromAllChannels?: boolean | undefined | null
};
	["UpdateAssetInput"]: {
	id: string,
	name?: string | undefined | null,
	focalPoint?: ResolverInputTypes["CoordinateInput"] | undefined | null,
	tags?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["AssignAssetsToChannelInput"]: {
	assetIds: Array<string>,
	channelId: string
};
	["AuthenticationInput"]: {
	native?: ResolverInputTypes["NativeAuthInput"] | undefined | null
};
	["NativeAuthenticationResult"]: AliasType<{
	CurrentUser?:ResolverInputTypes["CurrentUser"],
	InvalidCredentialsError?:ResolverInputTypes["InvalidCredentialsError"],
	NativeAuthStrategyError?:ResolverInputTypes["NativeAuthStrategyError"],
		__typename?: boolean | `@${string}`
}>;
	["AuthenticationResult"]: AliasType<{
	CurrentUser?:ResolverInputTypes["CurrentUser"],
	InvalidCredentialsError?:ResolverInputTypes["InvalidCredentialsError"],
		__typename?: boolean | `@${string}`
}>;
	["ChannelList"]: AliasType<{
	items?:ResolverInputTypes["Channel"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChannelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ChannelSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ChannelFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateChannelInput"]: {
	code: string,
	token: string,
	defaultLanguageCode: ResolverInputTypes["LanguageCode"],
	availableLanguageCodes?: Array<ResolverInputTypes["LanguageCode"]> | undefined | null,
	pricesIncludeTax: boolean,
	defaultCurrencyCode?: ResolverInputTypes["CurrencyCode"] | undefined | null,
	availableCurrencyCodes?: Array<ResolverInputTypes["CurrencyCode"]> | undefined | null,
	trackInventory?: boolean | undefined | null,
	outOfStockThreshold?: number | undefined | null,
	defaultTaxZoneId: string,
	defaultShippingZoneId: string,
	sellerId?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateChannelInput"]: {
	id: string,
	code?: string | undefined | null,
	token?: string | undefined | null,
	defaultLanguageCode?: ResolverInputTypes["LanguageCode"] | undefined | null,
	availableLanguageCodes?: Array<ResolverInputTypes["LanguageCode"]> | undefined | null,
	pricesIncludeTax?: boolean | undefined | null,
	defaultCurrencyCode?: ResolverInputTypes["CurrencyCode"] | undefined | null,
	availableCurrencyCodes?: Array<ResolverInputTypes["CurrencyCode"]> | undefined | null,
	trackInventory?: boolean | undefined | null,
	outOfStockThreshold?: number | undefined | null,
	defaultTaxZoneId?: string | undefined | null,
	defaultShippingZoneId?: string | undefined | null,
	sellerId?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	/** Returned if attempting to set a Channel's defaultLanguageCode to a language which is not enabled in GlobalSettings */
["LanguageNotAvailableError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateChannelResult"]: AliasType<{
	Channel?:ResolverInputTypes["Channel"],
	LanguageNotAvailableError?:ResolverInputTypes["LanguageNotAvailableError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateChannelResult"]: AliasType<{
	Channel?:ResolverInputTypes["Channel"],
	LanguageNotAvailableError?:ResolverInputTypes["LanguageNotAvailableError"],
		__typename?: boolean | `@${string}`
}>;
	["Collection"]: AliasType<{
	isPrivate?:boolean | `@${string}`,
	inheritFilters?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	breadcrumbs?:ResolverInputTypes["CollectionBreadcrumb"],
	position?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	featuredAsset?:ResolverInputTypes["Asset"],
	assets?:ResolverInputTypes["Asset"],
	parent?:ResolverInputTypes["Collection"],
	parentId?:boolean | `@${string}`,
	children?:ResolverInputTypes["Collection"],
	filters?:ResolverInputTypes["ConfigurableOperation"],
	translations?:ResolverInputTypes["CollectionTranslation"],
productVariants?: [{	options?: ResolverInputTypes["ProductVariantListOptions"] | undefined | null},ResolverInputTypes["ProductVariantList"]],
	customFields?:ResolverInputTypes["CollectionCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionListOptions"]: {
	topLevelOnly?: boolean | undefined | null,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["CollectionSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["CollectionFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["MoveCollectionInput"]: {
	collectionId: string,
	parentId: string,
	index: number
};
	["CreateCollectionTranslationInput"]: {
	languageCode: ResolverInputTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: ResolverInputTypes["CreateCollectionTranslationInputCustomFields"] | undefined | null
};
	["UpdateCollectionTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	slug?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["UpdateCollectionTranslationInputCustomFields"] | undefined | null
};
	["CreateCollectionInput"]: {
	isPrivate?: boolean | undefined | null,
	featuredAssetId?: string | undefined | null,
	assetIds?: Array<string> | undefined | null,
	parentId?: string | undefined | null,
	inheritFilters?: boolean | undefined | null,
	filters: Array<ResolverInputTypes["ConfigurableOperationInput"]>,
	translations: Array<ResolverInputTypes["CreateCollectionTranslationInput"]>,
	customFields?: ResolverInputTypes["CreateCollectionCustomFieldsInput"] | undefined | null
};
	["PreviewCollectionVariantsInput"]: {
	parentId?: string | undefined | null,
	inheritFilters: boolean,
	filters: Array<ResolverInputTypes["ConfigurableOperationInput"]>
};
	["UpdateCollectionInput"]: {
	id: string,
	isPrivate?: boolean | undefined | null,
	featuredAssetId?: string | undefined | null,
	parentId?: string | undefined | null,
	assetIds?: Array<string> | undefined | null,
	inheritFilters?: boolean | undefined | null,
	filters?: Array<ResolverInputTypes["ConfigurableOperationInput"]> | undefined | null,
	translations?: Array<ResolverInputTypes["UpdateCollectionTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["UpdateCollectionCustomFieldsInput"] | undefined | null
};
	["AssignCollectionsToChannelInput"]: {
	collectionIds: Array<string>,
	channelId: string
};
	["RemoveCollectionsFromChannelInput"]: {
	collectionIds: Array<string>,
	channelId: string
};
	["CountryTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateCountryInput"]: {
	code: string,
	translations: Array<ResolverInputTypes["CountryTranslationInput"]>,
	enabled: boolean,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateCountryInput"]: {
	id: string,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["CountryTranslationInput"]> | undefined | null,
	enabled?: boolean | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CountryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["CountrySortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["CountryFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["Customer"]: AliasType<{
	groups?:ResolverInputTypes["CustomerGroup"],
history?: [{	options?: ResolverInputTypes["HistoryEntryListOptions"] | undefined | null},ResolverInputTypes["HistoryEntryList"]],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	phoneNumber?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
	addresses?:ResolverInputTypes["Address"],
orders?: [{	options?: ResolverInputTypes["OrderListOptions"] | undefined | null},ResolverInputTypes["OrderList"]],
	user?:ResolverInputTypes["User"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroupList"]: AliasType<{
	items?:ResolverInputTypes["CustomerGroup"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroupListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["CustomerGroupSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["CustomerGroupFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateCustomerGroupInput"]: {
	name: string,
	customerIds?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateCustomerGroupInput"]: {
	id: string,
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateCustomerInput"]: {
	id: string,
	title?: string | undefined | null,
	firstName?: string | undefined | null,
	lastName?: string | undefined | null,
	phoneNumber?: string | undefined | null,
	emailAddress?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CustomerFilterParameter"]: {
	postalCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	title?: ResolverInputTypes["StringOperators"] | undefined | null,
	firstName?: ResolverInputTypes["StringOperators"] | undefined | null,
	lastName?: ResolverInputTypes["StringOperators"] | undefined | null,
	phoneNumber?: ResolverInputTypes["StringOperators"] | undefined | null,
	emailAddress?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["CustomerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["CustomerSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["CustomerFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["AddNoteToCustomerInput"]: {
	id: string,
	note: string,
	isPublic: boolean
};
	["UpdateCustomerNoteInput"]: {
	noteId: string,
	note: string
};
	["CreateCustomerResult"]: AliasType<{
	Customer?:ResolverInputTypes["Customer"],
	EmailAddressConflictError?:ResolverInputTypes["EmailAddressConflictError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateCustomerResult"]: AliasType<{
	Customer?:ResolverInputTypes["Customer"],
	EmailAddressConflictError?:ResolverInputTypes["EmailAddressConflictError"],
		__typename?: boolean | `@${string}`
}>;
	["Facet"]: AliasType<{
	isPrivate?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	values?:ResolverInputTypes["FacetValue"],
valueList?: [{	options?: ResolverInputTypes["FacetValueListOptions"] | undefined | null},ResolverInputTypes["FacetValueList"]],
	translations?:ResolverInputTypes["FacetTranslation"],
	customFields?:ResolverInputTypes["FacetCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["FacetListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["FacetSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["FacetFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["FacetTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateFacetInput"]: {
	code: string,
	isPrivate: boolean,
	translations: Array<ResolverInputTypes["FacetTranslationInput"]>,
	values?: Array<ResolverInputTypes["CreateFacetValueWithFacetInput"]> | undefined | null,
	customFields?: ResolverInputTypes["CreateFacetCustomFieldsInput"] | undefined | null
};
	["UpdateFacetInput"]: {
	id: string,
	isPrivate?: boolean | undefined | null,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["FacetTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["UpdateFacetCustomFieldsInput"] | undefined | null
};
	["FacetValueTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateFacetValueWithFacetInput"]: {
	code: string,
	translations: Array<ResolverInputTypes["FacetValueTranslationInput"]>
};
	["CreateFacetValueInput"]: {
	facetId: string,
	code: string,
	translations: Array<ResolverInputTypes["FacetValueTranslationInput"]>,
	customFields?: ResolverInputTypes["CreateFacetValueCustomFieldsInput"] | undefined | null
};
	["UpdateFacetValueInput"]: {
	id: string,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["FacetValueTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["UpdateFacetValueCustomFieldsInput"] | undefined | null
};
	["AssignFacetsToChannelInput"]: {
	facetIds: Array<string>,
	channelId: string
};
	["RemoveFacetsFromChannelInput"]: {
	facetIds: Array<string>,
	channelId: string,
	force?: boolean | undefined | null
};
	["FacetInUseError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	facetCode?:boolean | `@${string}`,
	productCount?:boolean | `@${string}`,
	variantCount?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveFacetFromChannelResult"]: AliasType<{
	Facet?:ResolverInputTypes["Facet"],
	FacetInUseError?:ResolverInputTypes["FacetInUseError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateGlobalSettingsInput"]: {
	availableLanguages?: Array<ResolverInputTypes["LanguageCode"]> | undefined | null,
	trackInventory?: boolean | undefined | null,
	outOfStockThreshold?: number | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	/** Returned when the default LanguageCode of a Channel is no longer found in the `availableLanguages`
of the GlobalSettings */
["ChannelDefaultLanguageError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	language?:boolean | `@${string}`,
	channelCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateGlobalSettingsResult"]: AliasType<{
	GlobalSettings?:ResolverInputTypes["GlobalSettings"],
	ChannelDefaultLanguageError?:ResolverInputTypes["ChannelDefaultLanguageError"],
		__typename?: boolean | `@${string}`
}>;
	["GlobalSettings"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	availableLanguages?:boolean | `@${string}`,
	trackInventory?:boolean | `@${string}`,
	outOfStockThreshold?:boolean | `@${string}`,
	serverConfig?:ResolverInputTypes["ServerConfig"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderProcessState"]: AliasType<{
	name?:boolean | `@${string}`,
	to?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PermissionDefinition"]: AliasType<{
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	assignable?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerConfig"]: AliasType<{
	orderProcess?:ResolverInputTypes["OrderProcessState"],
	permittedAssetTypes?:boolean | `@${string}`,
	permissions?:ResolverInputTypes["PermissionDefinition"],
	customFieldConfig?:ResolverInputTypes["CustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntry"]: AliasType<{
	isPublic?:boolean | `@${string}`,
	administrator?:ResolverInputTypes["Administrator"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImportInfo"]: AliasType<{
	errors?:boolean | `@${string}`,
	processed?:boolean | `@${string}`,
	imported?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JobBufferSize"]: AliasType<{
	bufferId?:boolean | `@${string}`,
	size?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** @description
The state of a Job in the JobQueue

@docsCategory common */
["JobState"]:JobState;
	["JobListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["JobSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["JobFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["JobList"]: AliasType<{
	items?:ResolverInputTypes["Job"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Job"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	startedAt?:boolean | `@${string}`,
	settledAt?:boolean | `@${string}`,
	queueName?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	progress?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	result?:boolean | `@${string}`,
	error?:boolean | `@${string}`,
	isSettled?:boolean | `@${string}`,
	duration?:boolean | `@${string}`,
	retries?:boolean | `@${string}`,
	attempts?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JobQueue"]: AliasType<{
	name?:boolean | `@${string}`,
	running?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Order"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	modifications?:ResolverInputTypes["OrderModification"],
	sellerOrders?:ResolverInputTypes["Order"],
	aggregateOrder?:ResolverInputTypes["Order"],
	aggregateOrderId?:boolean | `@${string}`,
	channels?:ResolverInputTypes["Channel"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	/** The date & time that the Order was placed, i.e. the Customer
completed the checkout and the Order is no longer "active" */
	orderPlacedAt?:boolean | `@${string}`,
	/** A unique code for the Order */
	code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	/** An order is active as long as the payment process has not been completed */
	active?:boolean | `@${string}`,
	customer?:ResolverInputTypes["Customer"],
	shippingAddress?:ResolverInputTypes["OrderAddress"],
	billingAddress?:ResolverInputTypes["OrderAddress"],
	lines?:ResolverInputTypes["OrderLine"],
	/** Surcharges are arbitrary modifications to the Order total which are neither
ProductVariants nor discounts resulting from applied Promotions. For example,
one-off discounts based on customer interaction, or surcharges based on payment
methods. */
	surcharges?:ResolverInputTypes["Surcharge"],
	discounts?:ResolverInputTypes["Discount"],
	/** An array of all coupon codes applied to the Order */
	couponCodes?:boolean | `@${string}`,
	/** Promotions applied to the order. Only gets populated after the payment process has completed. */
	promotions?:ResolverInputTypes["Promotion"],
	payments?:ResolverInputTypes["Payment"],
	fulfillments?:ResolverInputTypes["Fulfillment"],
	totalQuantity?:boolean | `@${string}`,
	/** The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
discounts which have been prorated (proportionally distributed) amongst the items of each OrderLine.
To get a total of all OrderLines which does not account for prorated discounts, use the
sum of `OrderLine.discountedLinePrice` values. */
	subTotal?:boolean | `@${string}`,
	/** Same as subTotal, but inclusive of tax */
	subTotalWithTax?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	shippingLines?:ResolverInputTypes["ShippingLine"],
	shipping?:boolean | `@${string}`,
	shippingWithTax?:boolean | `@${string}`,
	/** Equal to subTotal plus shipping */
	total?:boolean | `@${string}`,
	/** The final payable amount. Equal to subTotalWithTax plus shippingWithTax */
	totalWithTax?:boolean | `@${string}`,
	/** A summary of the taxes being applied to this Order */
	taxSummary?:ResolverInputTypes["OrderTaxSummary"],
history?: [{	options?: ResolverInputTypes["HistoryEntryListOptions"] | undefined | null},ResolverInputTypes["HistoryEntryList"]],
	getRealization?:ResolverInputTypes["OrderRealization"],
	getProforma?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["OrderCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["Fulfillment"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	lines?:ResolverInputTypes["FulfillmentLine"],
	summary?:ResolverInputTypes["FulfillmentLine"],
	state?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	trackingCode?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Payment"]: AliasType<{
	nextStates?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	transactionId?:boolean | `@${string}`,
	errorMessage?:boolean | `@${string}`,
	refunds?:ResolverInputTypes["Refund"],
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderModificationLine"]: AliasType<{
	orderLine?:ResolverInputTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	modification?:ResolverInputTypes["OrderModification"],
	modificationId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderModification"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	priceChange?:boolean | `@${string}`,
	note?:boolean | `@${string}`,
	lines?:ResolverInputTypes["OrderModificationLine"],
	surcharges?:ResolverInputTypes["Surcharge"],
	payment?:ResolverInputTypes["Payment"],
	refund?:ResolverInputTypes["Refund"],
	isSettled?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderFilterParameter"]: {
	customerLastName?: ResolverInputTypes["StringOperators"] | undefined | null,
	transactionId?: ResolverInputTypes["StringOperators"] | undefined | null,
	aggregateOrderId?: ResolverInputTypes["IDOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	orderPlacedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	state?: ResolverInputTypes["StringOperators"] | undefined | null,
	active?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	totalQuantity?: ResolverInputTypes["NumberOperators"] | undefined | null,
	subTotal?: ResolverInputTypes["NumberOperators"] | undefined | null,
	subTotalWithTax?: ResolverInputTypes["NumberOperators"] | undefined | null,
	currencyCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	shipping?: ResolverInputTypes["NumberOperators"] | undefined | null,
	shippingWithTax?: ResolverInputTypes["NumberOperators"] | undefined | null,
	total?: ResolverInputTypes["NumberOperators"] | undefined | null,
	totalWithTax?: ResolverInputTypes["NumberOperators"] | undefined | null,
	getProforma?: ResolverInputTypes["StringOperators"] | undefined | null,
	registeredOnCheckout?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	additionalInformation?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["OrderSortParameter"]: {
	customerLastName?: ResolverInputTypes["SortOrder"] | undefined | null,
	transactionId?: ResolverInputTypes["SortOrder"] | undefined | null,
	aggregateOrderId?: ResolverInputTypes["SortOrder"] | undefined | null,
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	orderPlacedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	state?: ResolverInputTypes["SortOrder"] | undefined | null,
	totalQuantity?: ResolverInputTypes["SortOrder"] | undefined | null,
	subTotal?: ResolverInputTypes["SortOrder"] | undefined | null,
	subTotalWithTax?: ResolverInputTypes["SortOrder"] | undefined | null,
	shipping?: ResolverInputTypes["SortOrder"] | undefined | null,
	shippingWithTax?: ResolverInputTypes["SortOrder"] | undefined | null,
	total?: ResolverInputTypes["SortOrder"] | undefined | null,
	totalWithTax?: ResolverInputTypes["SortOrder"] | undefined | null,
	getProforma?: ResolverInputTypes["SortOrder"] | undefined | null,
	registeredOnCheckout?: ResolverInputTypes["SortOrder"] | undefined | null,
	selectedPaymentMethod?: ResolverInputTypes["SortOrder"] | undefined | null,
	additionalInformation?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["OrderListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["OrderSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["OrderFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["UpdateOrderInput"]: {
	id: string,
	customFields?: ResolverInputTypes["UpdateOrderCustomFieldsInput"] | undefined | null
};
	["FulfillOrderInput"]: {
	lines: Array<ResolverInputTypes["OrderLineInput"]>,
	handler: ResolverInputTypes["ConfigurableOperationInput"]
};
	["CancelOrderInput"]: {
	/** The id of the order to be cancelled */
	orderId: string,
	/** Optionally specify which OrderLines to cancel. If not provided, all OrderLines will be cancelled */
	lines?: Array<ResolverInputTypes["OrderLineInput"]> | undefined | null,
	/** Specify whether the shipping charges should also be cancelled. Defaults to false */
	cancelShipping?: boolean | undefined | null,
	reason?: string | undefined | null
};
	["RefundOrderInput"]: {
	lines: Array<ResolverInputTypes["OrderLineInput"]>,
	shipping: ResolverInputTypes["Money"],
	adjustment: ResolverInputTypes["Money"],
	paymentId: string,
	reason?: string | undefined | null
};
	["OrderLineInput"]: {
	orderLineId: string,
	quantity: number,
	customFields?: ResolverInputTypes["OrderLineCustomFieldsInput"] | undefined | null
};
	["SettleRefundInput"]: {
	id: string,
	transactionId: string
};
	["AddNoteToOrderInput"]: {
	id: string,
	note: string,
	isPublic: boolean
};
	["UpdateOrderNoteInput"]: {
	noteId: string,
	note?: string | undefined | null,
	isPublic?: boolean | undefined | null
};
	["AdministratorPaymentInput"]: {
	paymentMethod?: string | undefined | null,
	metadata?: ResolverInputTypes["JSON"] | undefined | null
};
	["AdministratorRefundInput"]: {
	paymentId: string,
	reason?: string | undefined | null
};
	["ModifyOrderOptions"]: {
	freezePromotions?: boolean | undefined | null,
	recalculateShipping?: boolean | undefined | null
};
	["UpdateOrderAddressInput"]: {
	fullName?: string | undefined | null,
	company?: string | undefined | null,
	streetLine1?: string | undefined | null,
	streetLine2?: string | undefined | null,
	city?: string | undefined | null,
	province?: string | undefined | null,
	postalCode?: string | undefined | null,
	countryCode?: string | undefined | null,
	phoneNumber?: string | undefined | null,
	customFields?: ResolverInputTypes["UpdateAddressCustomFieldsInput"] | undefined | null
};
	["ModifyOrderInput"]: {
	dryRun: boolean,
	orderId: string,
	addItems?: Array<ResolverInputTypes["AddItemInput"]> | undefined | null,
	adjustOrderLines?: Array<ResolverInputTypes["OrderLineInput"]> | undefined | null,
	surcharges?: Array<ResolverInputTypes["SurchargeInput"]> | undefined | null,
	updateShippingAddress?: ResolverInputTypes["UpdateOrderAddressInput"] | undefined | null,
	updateBillingAddress?: ResolverInputTypes["UpdateOrderAddressInput"] | undefined | null,
	note?: string | undefined | null,
	refund?: ResolverInputTypes["AdministratorRefundInput"] | undefined | null,
	options?: ResolverInputTypes["ModifyOrderOptions"] | undefined | null,
	couponCodes?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["UpdateOrderCustomFieldsInput"] | undefined | null
};
	["AddItemInput"]: {
	productVariantId: string,
	quantity: number,
	customFields?: ResolverInputTypes["OrderLineCustomFieldsInput"] | undefined | null
};
	["SurchargeInput"]: {
	description: string,
	sku?: string | undefined | null,
	price: ResolverInputTypes["Money"],
	priceIncludesTax: boolean,
	taxRate?: number | undefined | null,
	taxDescription?: string | undefined | null
};
	["ManualPaymentInput"]: {
	orderId: string,
	method: string,
	transactionId?: string | undefined | null,
	metadata?: ResolverInputTypes["JSON"] | undefined | null
};
	["AddItemToDraftOrderInput"]: {
	productVariantId: string,
	quantity: number,
	customFields?: ResolverInputTypes["OrderLineCustomFieldsInput"] | undefined | null
};
	["AdjustDraftOrderLineInput"]: {
	orderLineId: string,
	quantity: number,
	customFields?: ResolverInputTypes["OrderLineCustomFieldsInput"] | undefined | null
};
	/** Returned if the Payment settlement fails */
["SettlePaymentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	paymentErrorMessage?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the Payment cancellation fails */
["CancelPaymentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	paymentErrorMessage?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if no OrderLines have been specified for the operation */
["EmptyOrderLineSelectionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified items are already part of a Fulfillment */
["ItemsAlreadyFulfilledError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified FulfillmentHandler code is not valid */
["InvalidFulfillmentHandlerError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an error is thrown in a FulfillmentHandler's createFulfillment method */
["CreateFulfillmentError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	fulfillmentHandlerError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if attempting to create a Fulfillment when there is insufficient
stockOnHand of a ProductVariant to satisfy the requested quantity. */
["InsufficientStockOnHandError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	productVariantId?:boolean | `@${string}`,
	productVariantName?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an operation has specified OrderLines from multiple Orders */
["MultipleOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to cancel lines from an Order which is still active */
["CancelActiveOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	orderState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund a Payment against OrderLines from a different Order */
["PaymentOrderMismatchError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an Order which is not in the expected state */
["RefundOrderStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	orderState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an Order but neither items nor shipping refund was specified */
["NothingToRefundError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if an attempting to refund an OrderItem which has already been refunded */
["AlreadyRefundedError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	refundId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the specified quantity of an OrderLine is greater than the number of items in that line */
["QuantityTooGreatError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Refund state */
["RefundStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Payment state */
["PaymentStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when there is an error in transitioning the Fulfillment state */
["FulfillmentStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to modify the contents of an Order that is not in the `Modifying` state. */
["OrderModificationStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to specify any changes */
["NoChangesSpecifiedError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to include a paymentMethod even
though the price has increased as a result of the changes. */
["PaymentMethodMissingError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to modifyOrder fails to include a refundPaymentId even
though the price has decreased as a result of the changes. */
["RefundPaymentIdMissingError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when a call to addManualPaymentToOrder is made but the Order
is not in the required state. */
["ManualPaymentStateError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TransitionOrderToStateResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	OrderStateTransitionError?:ResolverInputTypes["OrderStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["SettlePaymentResult"]: AliasType<{
	Payment?:ResolverInputTypes["Payment"],
	SettlePaymentError?:ResolverInputTypes["SettlePaymentError"],
	PaymentStateTransitionError?:ResolverInputTypes["PaymentStateTransitionError"],
	OrderStateTransitionError?:ResolverInputTypes["OrderStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["CancelPaymentResult"]: AliasType<{
	Payment?:ResolverInputTypes["Payment"],
	CancelPaymentError?:ResolverInputTypes["CancelPaymentError"],
	PaymentStateTransitionError?:ResolverInputTypes["PaymentStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["AddFulfillmentToOrderResult"]: AliasType<{
	Fulfillment?:ResolverInputTypes["Fulfillment"],
	EmptyOrderLineSelectionError?:ResolverInputTypes["EmptyOrderLineSelectionError"],
	ItemsAlreadyFulfilledError?:ResolverInputTypes["ItemsAlreadyFulfilledError"],
	InsufficientStockOnHandError?:ResolverInputTypes["InsufficientStockOnHandError"],
	InvalidFulfillmentHandlerError?:ResolverInputTypes["InvalidFulfillmentHandlerError"],
	FulfillmentStateTransitionError?:ResolverInputTypes["FulfillmentStateTransitionError"],
	CreateFulfillmentError?:ResolverInputTypes["CreateFulfillmentError"],
		__typename?: boolean | `@${string}`
}>;
	["CancelOrderResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	EmptyOrderLineSelectionError?:ResolverInputTypes["EmptyOrderLineSelectionError"],
	QuantityTooGreatError?:ResolverInputTypes["QuantityTooGreatError"],
	MultipleOrderError?:ResolverInputTypes["MultipleOrderError"],
	CancelActiveOrderError?:ResolverInputTypes["CancelActiveOrderError"],
	OrderStateTransitionError?:ResolverInputTypes["OrderStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["RefundOrderResult"]: AliasType<{
	Refund?:ResolverInputTypes["Refund"],
	QuantityTooGreatError?:ResolverInputTypes["QuantityTooGreatError"],
	NothingToRefundError?:ResolverInputTypes["NothingToRefundError"],
	OrderStateTransitionError?:ResolverInputTypes["OrderStateTransitionError"],
	MultipleOrderError?:ResolverInputTypes["MultipleOrderError"],
	PaymentOrderMismatchError?:ResolverInputTypes["PaymentOrderMismatchError"],
	RefundOrderStateError?:ResolverInputTypes["RefundOrderStateError"],
	AlreadyRefundedError?:ResolverInputTypes["AlreadyRefundedError"],
	RefundStateTransitionError?:ResolverInputTypes["RefundStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["SettleRefundResult"]: AliasType<{
	Refund?:ResolverInputTypes["Refund"],
	RefundStateTransitionError?:ResolverInputTypes["RefundStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["TransitionFulfillmentToStateResult"]: AliasType<{
	Fulfillment?:ResolverInputTypes["Fulfillment"],
	FulfillmentStateTransitionError?:ResolverInputTypes["FulfillmentStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["TransitionPaymentToStateResult"]: AliasType<{
	Payment?:ResolverInputTypes["Payment"],
	PaymentStateTransitionError?:ResolverInputTypes["PaymentStateTransitionError"],
		__typename?: boolean | `@${string}`
}>;
	["ModifyOrderResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	NoChangesSpecifiedError?:ResolverInputTypes["NoChangesSpecifiedError"],
	OrderModificationStateError?:ResolverInputTypes["OrderModificationStateError"],
	PaymentMethodMissingError?:ResolverInputTypes["PaymentMethodMissingError"],
	RefundPaymentIdMissingError?:ResolverInputTypes["RefundPaymentIdMissingError"],
	OrderLimitError?:ResolverInputTypes["OrderLimitError"],
	NegativeQuantityError?:ResolverInputTypes["NegativeQuantityError"],
	InsufficientStockError?:ResolverInputTypes["InsufficientStockError"],
	CouponCodeExpiredError?:ResolverInputTypes["CouponCodeExpiredError"],
	CouponCodeInvalidError?:ResolverInputTypes["CouponCodeInvalidError"],
	CouponCodeLimitError?:ResolverInputTypes["CouponCodeLimitError"],
		__typename?: boolean | `@${string}`
}>;
	["AddManualPaymentToOrderResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	ManualPaymentStateError?:ResolverInputTypes["ManualPaymentStateError"],
		__typename?: boolean | `@${string}`
}>;
	["SetCustomerForDraftOrderResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	EmailAddressConflictError?:ResolverInputTypes["EmailAddressConflictError"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodList"]: AliasType<{
	items?:ResolverInputTypes["PaymentMethod"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["PaymentMethodSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["PaymentMethodFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["PaymentMethodTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["PaymentMethodTranslationInputCustomFields"] | undefined | null
};
	["CreatePaymentMethodInput"]: {
	code: string,
	enabled: boolean,
	checker?: ResolverInputTypes["ConfigurableOperationInput"] | undefined | null,
	handler: ResolverInputTypes["ConfigurableOperationInput"],
	translations: Array<ResolverInputTypes["PaymentMethodTranslationInput"]>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdatePaymentMethodInput"]: {
	id: string,
	code?: string | undefined | null,
	enabled?: boolean | undefined | null,
	checker?: ResolverInputTypes["ConfigurableOperationInput"] | undefined | null,
	handler?: ResolverInputTypes["ConfigurableOperationInput"] | undefined | null,
	translations?: Array<ResolverInputTypes["PaymentMethodTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["AssignPaymentMethodsToChannelInput"]: {
	paymentMethodIds: Array<string>,
	channelId: string
};
	["RemovePaymentMethodsFromChannelInput"]: {
	paymentMethodIds: Array<string>,
	channelId: string
};
	["Product"]: AliasType<{
	enabled?:boolean | `@${string}`,
	channels?:ResolverInputTypes["Channel"],
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	featuredAsset?:ResolverInputTypes["Asset"],
	assets?:ResolverInputTypes["Asset"],
	/** Returns all ProductVariants */
	variants?:ResolverInputTypes["ProductVariant"],
variantList?: [{	options?: ResolverInputTypes["ProductVariantListOptions"] | undefined | null},ResolverInputTypes["ProductVariantList"]],
	optionGroups?:ResolverInputTypes["ProductOptionGroup"],
	facetValues?:ResolverInputTypes["FacetValue"],
	translations?:ResolverInputTypes["ProductTranslation"],
	collections?:ResolverInputTypes["Collection"],
	customFields?:ResolverInputTypes["ProductCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantPrice"]: AliasType<{
	currencyCode?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariant"]: AliasType<{
	enabled?:boolean | `@${string}`,
	trackInventory?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
	stockAllocated?:boolean | `@${string}`,
	outOfStockThreshold?:boolean | `@${string}`,
	useGlobalOutOfStockThreshold?:boolean | `@${string}`,
	prices?:ResolverInputTypes["ProductVariantPrice"],
	stockLevels?:ResolverInputTypes["StockLevel"],
stockMovements?: [{	options?: ResolverInputTypes["StockMovementListOptions"] | undefined | null},ResolverInputTypes["StockMovementList"]],
	channels?:ResolverInputTypes["Channel"],
	id?:boolean | `@${string}`,
	product?:ResolverInputTypes["Product"],
	productId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	featuredAsset?:ResolverInputTypes["Asset"],
	assets?:ResolverInputTypes["Asset"],
	price?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	stockLevel?:boolean | `@${string}`,
	taxRateApplied?:ResolverInputTypes["TaxRate"],
	taxCategory?:ResolverInputTypes["TaxCategory"],
	options?:ResolverInputTypes["ProductOption"],
	facetValues?:ResolverInputTypes["FacetValue"],
	translations?:ResolverInputTypes["ProductVariantTranslation"],
	omnibusPrice?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroupTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateProductOptionGroupInput"]: {
	code: string,
	translations: Array<ResolverInputTypes["ProductOptionGroupTranslationInput"]>,
	options: Array<ResolverInputTypes["CreateGroupOptionInput"]>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateProductOptionGroupInput"]: {
	id: string,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["ProductOptionGroupTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["ProductOptionTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateGroupOptionInput"]: {
	code: string,
	translations: Array<ResolverInputTypes["ProductOptionGroupTranslationInput"]>
};
	["CreateProductOptionInput"]: {
	productOptionGroupId: string,
	code: string,
	translations: Array<ResolverInputTypes["ProductOptionGroupTranslationInput"]>,
	customFields?: ResolverInputTypes["CreateProductOptionCustomFieldsInput"] | undefined | null
};
	["UpdateProductOptionInput"]: {
	id: string,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["ProductOptionGroupTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["UpdateProductOptionCustomFieldsInput"] | undefined | null
};
	["SearchResult"]: AliasType<{
	enabled?:boolean | `@${string}`,
	/** An array of ids of the Channels in which this result appears */
	channelIds?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	productName?:boolean | `@${string}`,
	productAsset?:ResolverInputTypes["SearchResultAsset"],
	productVariantId?:boolean | `@${string}`,
	productVariantName?:boolean | `@${string}`,
	productVariantAsset?:ResolverInputTypes["SearchResultAsset"],
	price?:ResolverInputTypes["SearchResultPrice"],
	priceWithTax?:ResolverInputTypes["SearchResultPrice"],
	currencyCode?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	facetIds?:boolean | `@${string}`,
	facetValueIds?:boolean | `@${string}`,
	/** An array of ids of the Collections in which this result appears */
	collectionIds?:boolean | `@${string}`,
	/** A relevance score for the result. Differs between database implementations */
	score?:boolean | `@${string}`,
	inStock?:boolean | `@${string}`,
	omnibusPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementListOptions"]: {
	type?: ResolverInputTypes["StockMovementType"] | undefined | null,
	skip?: number | undefined | null,
	take?: number | undefined | null
};
	["ProductListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ProductSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ProductFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["ProductFilterParameter"]: {
	facetValueId?: ResolverInputTypes["IDOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	slug?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	seoTitle?: ResolverInputTypes["StringOperators"] | undefined | null,
	seoDescription?: ResolverInputTypes["StringOperators"] | undefined | null,
	optionsOrder?: ResolverInputTypes["StringOperators"] | undefined | null,
	sizes?: ResolverInputTypes["StringOperators"] | undefined | null,
	finish?: ResolverInputTypes["StringOperators"] | undefined | null,
	materials?: ResolverInputTypes["StringOperators"] | undefined | null,
	payment?: ResolverInputTypes["StringOperators"] | undefined | null,
	delivery?: ResolverInputTypes["StringOperators"] | undefined | null,
	realization?: ResolverInputTypes["StringOperators"] | undefined | null,
	discountBy?: ResolverInputTypes["NumberOperators"] | undefined | null
};
	["ProductVariantListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ProductVariantSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ProductVariantFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["ProductVariantFilterParameter"]: {
	facetValueId?: ResolverInputTypes["IDOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	trackInventory?: ResolverInputTypes["StringOperators"] | undefined | null,
	stockOnHand?: ResolverInputTypes["NumberOperators"] | undefined | null,
	stockAllocated?: ResolverInputTypes["NumberOperators"] | undefined | null,
	outOfStockThreshold?: ResolverInputTypes["NumberOperators"] | undefined | null,
	useGlobalOutOfStockThreshold?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	productId?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	sku?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	price?: ResolverInputTypes["NumberOperators"] | undefined | null,
	currencyCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	priceWithTax?: ResolverInputTypes["NumberOperators"] | undefined | null,
	stockLevel?: ResolverInputTypes["StringOperators"] | undefined | null,
	omnibusPrice?: ResolverInputTypes["NumberOperators"] | undefined | null
};
	["ProductTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	slug?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["ProductTranslationInputCustomFields"] | undefined | null
};
	["CreateProductInput"]: {
	featuredAssetId?: string | undefined | null,
	enabled?: boolean | undefined | null,
	assetIds?: Array<string> | undefined | null,
	facetValueIds?: Array<string> | undefined | null,
	translations: Array<ResolverInputTypes["ProductTranslationInput"]>,
	customFields?: ResolverInputTypes["CreateProductCustomFieldsInput"] | undefined | null
};
	["UpdateProductInput"]: {
	id: string,
	enabled?: boolean | undefined | null,
	featuredAssetId?: string | undefined | null,
	assetIds?: Array<string> | undefined | null,
	facetValueIds?: Array<string> | undefined | null,
	translations?: Array<ResolverInputTypes["ProductTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["UpdateProductCustomFieldsInput"] | undefined | null
};
	["ProductVariantTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateProductVariantOptionInput"]: {
	optionGroupId: string,
	code: string,
	translations: Array<ResolverInputTypes["ProductOptionTranslationInput"]>
};
	["StockLevelInput"]: {
	stockLocationId: string,
	stockOnHand: number
};
	/** Used to set up update the price of a ProductVariant in a particular Channel.
If the `delete` flag is `true`, the price will be deleted for the given Channel. */
["ProductVariantPriceInput"]: {
	currencyCode: ResolverInputTypes["CurrencyCode"],
	price: ResolverInputTypes["Money"],
	delete?: boolean | undefined | null
};
	["CreateProductVariantInput"]: {
	productId: string,
	translations: Array<ResolverInputTypes["ProductVariantTranslationInput"]>,
	facetValueIds?: Array<string> | undefined | null,
	sku: string,
	price?: ResolverInputTypes["Money"] | undefined | null,
	taxCategoryId?: string | undefined | null,
	optionIds?: Array<string> | undefined | null,
	featuredAssetId?: string | undefined | null,
	assetIds?: Array<string> | undefined | null,
	stockOnHand?: number | undefined | null,
	stockLevels?: Array<ResolverInputTypes["StockLevelInput"]> | undefined | null,
	outOfStockThreshold?: number | undefined | null,
	useGlobalOutOfStockThreshold?: boolean | undefined | null,
	trackInventory?: ResolverInputTypes["GlobalFlag"] | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateProductVariantInput"]: {
	id: string,
	enabled?: boolean | undefined | null,
	translations?: Array<ResolverInputTypes["ProductVariantTranslationInput"]> | undefined | null,
	facetValueIds?: Array<string> | undefined | null,
	optionIds?: Array<string> | undefined | null,
	sku?: string | undefined | null,
	taxCategoryId?: string | undefined | null,
	/** Sets the price for the ProductVariant in the Channel's default currency */
	price?: ResolverInputTypes["Money"] | undefined | null,
	/** Allows multiple prices to be set for the ProductVariant in different currencies. */
	prices?: Array<ResolverInputTypes["ProductVariantPriceInput"]> | undefined | null,
	featuredAssetId?: string | undefined | null,
	assetIds?: Array<string> | undefined | null,
	stockOnHand?: number | undefined | null,
	stockLevels?: Array<ResolverInputTypes["StockLevelInput"]> | undefined | null,
	outOfStockThreshold?: number | undefined | null,
	useGlobalOutOfStockThreshold?: boolean | undefined | null,
	trackInventory?: ResolverInputTypes["GlobalFlag"] | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["AssignProductsToChannelInput"]: {
	productIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined | null
};
	["RemoveProductsFromChannelInput"]: {
	productIds: Array<string>,
	channelId: string
};
	["AssignProductVariantsToChannelInput"]: {
	productVariantIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined | null
};
	["RemoveProductVariantsFromChannelInput"]: {
	productVariantIds: Array<string>,
	channelId: string
};
	["ProductOptionInUseError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	optionGroupCode?:boolean | `@${string}`,
	productVariantCount?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveOptionGroupFromProductResult"]: AliasType<{
	Product?:ResolverInputTypes["Product"],
	ProductOptionInUseError?:ResolverInputTypes["ProductOptionInUseError"],
		__typename?: boolean | `@${string}`
}>;
	["PromotionListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["PromotionSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["PromotionFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["PromotionTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreatePromotionInput"]: {
	enabled: boolean,
	startsAt?: ResolverInputTypes["DateTime"] | undefined | null,
	endsAt?: ResolverInputTypes["DateTime"] | undefined | null,
	couponCode?: string | undefined | null,
	perCustomerUsageLimit?: number | undefined | null,
	usageLimit?: number | undefined | null,
	conditions: Array<ResolverInputTypes["ConfigurableOperationInput"]>,
	actions: Array<ResolverInputTypes["ConfigurableOperationInput"]>,
	translations: Array<ResolverInputTypes["PromotionTranslationInput"]>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdatePromotionInput"]: {
	id: string,
	enabled?: boolean | undefined | null,
	startsAt?: ResolverInputTypes["DateTime"] | undefined | null,
	endsAt?: ResolverInputTypes["DateTime"] | undefined | null,
	couponCode?: string | undefined | null,
	perCustomerUsageLimit?: number | undefined | null,
	usageLimit?: number | undefined | null,
	conditions?: Array<ResolverInputTypes["ConfigurableOperationInput"]> | undefined | null,
	actions?: Array<ResolverInputTypes["ConfigurableOperationInput"]> | undefined | null,
	translations?: Array<ResolverInputTypes["PromotionTranslationInput"]> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["AssignPromotionsToChannelInput"]: {
	promotionIds: Array<string>,
	channelId: string
};
	["RemovePromotionsFromChannelInput"]: {
	promotionIds: Array<string>,
	channelId: string
};
	/** Returned if a PromotionCondition has neither a couponCode nor any conditions set */
["MissingConditionsError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreatePromotionResult"]: AliasType<{
	Promotion?:ResolverInputTypes["Promotion"],
	MissingConditionsError?:ResolverInputTypes["MissingConditionsError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdatePromotionResult"]: AliasType<{
	Promotion?:ResolverInputTypes["Promotion"],
	MissingConditionsError?:ResolverInputTypes["MissingConditionsError"],
		__typename?: boolean | `@${string}`
}>;
	["ProvinceTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["CreateProvinceInput"]: {
	code: string,
	translations: Array<ResolverInputTypes["ProvinceTranslationInput"]>,
	enabled: boolean,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateProvinceInput"]: {
	id: string,
	code?: string | undefined | null,
	translations?: Array<ResolverInputTypes["ProvinceTranslationInput"]> | undefined | null,
	enabled?: boolean | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["ProvinceListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ProvinceSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ProvinceFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["RoleListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["RoleSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["RoleFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateRoleInput"]: {
	code: string,
	description: string,
	permissions: Array<ResolverInputTypes["Permission"]>,
	channelIds?: Array<string> | undefined | null
};
	["UpdateRoleInput"]: {
	id: string,
	code?: string | undefined | null,
	description?: string | undefined | null,
	permissions?: Array<ResolverInputTypes["Permission"]> | undefined | null,
	channelIds?: Array<string> | undefined | null
};
	["SellerList"]: AliasType<{
	items?:ResolverInputTypes["Seller"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SellerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["SellerSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["SellerFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateSellerInput"]: {
	name: string,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateSellerInput"]: {
	id: string,
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["ShippingMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ShippingMethodSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ShippingMethodFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["ShippingMethodTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	name?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["ShippingMethodTranslationInputCustomFields"] | undefined | null
};
	["CreateShippingMethodInput"]: {
	code: string,
	fulfillmentHandler: string,
	checker: ResolverInputTypes["ConfigurableOperationInput"],
	calculator: ResolverInputTypes["ConfigurableOperationInput"],
	translations: Array<ResolverInputTypes["ShippingMethodTranslationInput"]>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateShippingMethodInput"]: {
	id: string,
	code?: string | undefined | null,
	fulfillmentHandler?: string | undefined | null,
	checker?: ResolverInputTypes["ConfigurableOperationInput"] | undefined | null,
	calculator?: ResolverInputTypes["ConfigurableOperationInput"] | undefined | null,
	translations: Array<ResolverInputTypes["ShippingMethodTranslationInput"]>,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["TestShippingMethodInput"]: {
	checker: ResolverInputTypes["ConfigurableOperationInput"],
	calculator: ResolverInputTypes["ConfigurableOperationInput"],
	shippingAddress: ResolverInputTypes["CreateAddressInput"],
	lines: Array<ResolverInputTypes["TestShippingMethodOrderLineInput"]>
};
	["TestEligibleShippingMethodsInput"]: {
	shippingAddress: ResolverInputTypes["CreateAddressInput"],
	lines: Array<ResolverInputTypes["TestShippingMethodOrderLineInput"]>
};
	["TestShippingMethodOrderLineInput"]: {
	productVariantId: string,
	quantity: number
};
	["TestShippingMethodResult"]: AliasType<{
	eligible?:boolean | `@${string}`,
	quote?:ResolverInputTypes["TestShippingMethodQuote"],
		__typename?: boolean | `@${string}`
}>;
	["TestShippingMethodQuote"]: AliasType<{
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssignShippingMethodsToChannelInput"]: {
	shippingMethodIds: Array<string>,
	channelId: string
};
	["RemoveShippingMethodsFromChannelInput"]: {
	shippingMethodIds: Array<string>,
	channelId: string
};
	["StockLevel"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	stockLocationId?:boolean | `@${string}`,
	stockOnHand?:boolean | `@${string}`,
	stockAllocated?:boolean | `@${string}`,
	stockLocation?:ResolverInputTypes["StockLocation"],
		__typename?: boolean | `@${string}`
}>;
	["StockLocationListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["StockLocationSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["StockLocationFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["StockLocationList"]: AliasType<{
	items?:ResolverInputTypes["StockLocation"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateStockLocationInput"]: {
	name: string,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateStockLocationInput"]: {
	id: string,
	name?: string | undefined | null,
	description?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["DeleteStockLocationInput"]: {
	id: string,
	transferToLocationId?: string | undefined | null
};
	["AssignStockLocationsToChannelInput"]: {
	stockLocationIds: Array<string>,
	channelId: string
};
	["RemoveStockLocationsFromChannelInput"]: {
	stockLocationIds: Array<string>,
	channelId: string
};
	["StockLocation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementType"]:StockMovementType;
	["StockMovement"]:AliasType<{
		id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`;
		['...on StockAdjustment']?: Omit<ResolverInputTypes["StockAdjustment"],keyof ResolverInputTypes["StockMovement"]>;
		['...on Allocation']?: Omit<ResolverInputTypes["Allocation"],keyof ResolverInputTypes["StockMovement"]>;
		['...on Sale']?: Omit<ResolverInputTypes["Sale"],keyof ResolverInputTypes["StockMovement"]>;
		['...on Cancellation']?: Omit<ResolverInputTypes["Cancellation"],keyof ResolverInputTypes["StockMovement"]>;
		['...on Return']?: Omit<ResolverInputTypes["Return"],keyof ResolverInputTypes["StockMovement"]>;
		['...on Release']?: Omit<ResolverInputTypes["Release"],keyof ResolverInputTypes["StockMovement"]>;
		__typename?: boolean | `@${string}`
}>;
	["StockAdjustment"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Allocation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	orderLine?:ResolverInputTypes["OrderLine"],
		__typename?: boolean | `@${string}`
}>;
	["Sale"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Cancellation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	orderLine?:ResolverInputTypes["OrderLine"],
		__typename?: boolean | `@${string}`
}>;
	["Return"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Release"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	type?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StockMovementItem"]: AliasType<{
	StockAdjustment?:ResolverInputTypes["StockAdjustment"],
	Allocation?:ResolverInputTypes["Allocation"],
	Sale?:ResolverInputTypes["Sale"],
	Cancellation?:ResolverInputTypes["Cancellation"],
	Return?:ResolverInputTypes["Return"],
	Release?:ResolverInputTypes["Release"],
		__typename?: boolean | `@${string}`
}>;
	["StockMovementList"]: AliasType<{
	items?:ResolverInputTypes["StockMovementItem"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TagListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["TagSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["TagFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateTagInput"]: {
	value: string
};
	["UpdateTagInput"]: {
	id: string,
	value?: string | undefined | null
};
	["TaxCategoryList"]: AliasType<{
	items?:ResolverInputTypes["TaxCategory"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxCategoryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["TaxCategorySortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["TaxCategoryFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateTaxCategoryInput"]: {
	name: string,
	isDefault?: boolean | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateTaxCategoryInput"]: {
	id: string,
	name?: string | undefined | null,
	isDefault?: boolean | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["TaxRateListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["TaxRateSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["TaxRateFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateTaxRateInput"]: {
	name: string,
	enabled: boolean,
	value: number,
	categoryId: string,
	zoneId: string,
	customerGroupId?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateTaxRateInput"]: {
	id: string,
	name?: string | undefined | null,
	value?: number | undefined | null,
	enabled?: boolean | undefined | null,
	categoryId?: string | undefined | null,
	zoneId?: string | undefined | null,
	customerGroupId?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["ZoneList"]: AliasType<{
	items?:ResolverInputTypes["Zone"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ZoneListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ZoneSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ZoneFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["CreateZoneInput"]: {
	name: string,
	memberIds?: Array<string> | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["UpdateZoneInput"]: {
	id: string,
	name?: string | undefined | null,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	["Address"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	company?:boolean | `@${string}`,
	streetLine1?:boolean | `@${string}`,
	streetLine2?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	province?:boolean | `@${string}`,
	postalCode?:boolean | `@${string}`,
	country?:ResolverInputTypes["Country"],
	phoneNumber?:boolean | `@${string}`,
	defaultShippingAddress?:boolean | `@${string}`,
	defaultBillingAddress?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["AddressCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["Asset"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	fileSize?:boolean | `@${string}`,
	mimeType?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
	height?:boolean | `@${string}`,
	source?:boolean | `@${string}`,
	preview?:boolean | `@${string}`,
	focalPoint?:ResolverInputTypes["Coordinate"],
	tags?:ResolverInputTypes["Tag"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Coordinate"]: AliasType<{
	x?:boolean | `@${string}`,
	y?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssetList"]: AliasType<{
	items?:ResolverInputTypes["Asset"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AssetType"]:AssetType;
	["CurrentUser"]: AliasType<{
	id?:boolean | `@${string}`,
	identifier?:boolean | `@${string}`,
	channels?:ResolverInputTypes["CurrentUserChannel"],
		__typename?: boolean | `@${string}`
}>;
	["CurrentUserChannel"]: AliasType<{
	id?:boolean | `@${string}`,
	token?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	permissions?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Channel"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	token?:boolean | `@${string}`,
	defaultTaxZone?:ResolverInputTypes["Zone"],
	defaultShippingZone?:ResolverInputTypes["Zone"],
	defaultLanguageCode?:boolean | `@${string}`,
	availableLanguageCodes?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
	defaultCurrencyCode?:boolean | `@${string}`,
	availableCurrencyCodes?:boolean | `@${string}`,
	/** Not yet used - will be implemented in a future release. */
	trackInventory?:boolean | `@${string}`,
	/** Not yet used - will be implemented in a future release. */
	outOfStockThreshold?:boolean | `@${string}`,
	pricesIncludeTax?:boolean | `@${string}`,
	seller?:ResolverInputTypes["Seller"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CollectionBreadcrumb"]: AliasType<{
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CollectionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["CollectionTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionList"]: AliasType<{
	items?:ResolverInputTypes["Collection"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GlobalFlag"]:GlobalFlag;
	["AdjustmentType"]:AdjustmentType;
	["DeletionResult"]:DeletionResult;
	/** @description
Permissions for administrators and customers. Used to control access to
GraphQL resolvers via the {@link Allow} decorator.

## Understanding Permission.Owner

`Permission.Owner` is a special permission which is used in some Vendure resolvers to indicate that that resolver should only
be accessible to the "owner" of that resource.

For example, the Shop API `activeCustomer` query resolver should only return the Customer object for the "owner" of that Customer, i.e.
based on the activeUserId of the current session. As a result, the resolver code looks like this:

@example
```TypeScript
\@Query()
\@Allow(Permission.Owner)
async activeCustomer(\@Ctx() ctx: RequestContext): Promise<Customer | undefined> {
  const userId = ctx.activeUserId;
  if (userId) {
    return this.customerService.findOneByUserId(ctx, userId);
  }
}
```

Here we can see that the "ownership" must be enforced by custom logic inside the resolver. Since "ownership" cannot be defined generally
nor statically encoded at build-time, any resolvers using `Permission.Owner` **must** include logic to enforce that only the owner
of the resource has access. If not, then it is the equivalent of using `Permission.Public`.


@docsCategory common */
["Permission"]:Permission;
	["SortOrder"]:SortOrder;
	["ErrorCode"]:ErrorCode;
	["LogicalOperator"]:LogicalOperator;
	/** Returned when attempting an operation that relies on the NativeAuthStrategy, if that strategy is not configured. */
["NativeAuthStrategyError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the user authentication credentials are not valid */
["InvalidCredentialsError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	authenticationError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if there is an error in transitioning the Order state */
["OrderStateTransitionError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	transitionError?:boolean | `@${string}`,
	fromState?:boolean | `@${string}`,
	toState?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to create a Customer with an email address already registered to an existing User. */
["EmailAddressConflictError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set the Customer on a guest checkout when the configured GuestCheckoutStrategy does not allow it. */
["GuestCheckoutError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	errorDetail?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when the maximum order size limit has been reached. */
["OrderLimitError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	maxItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set a negative OrderLine quantity. */
["NegativeQuantityError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to add more items to the Order than are available */
["InsufficientStockError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	quantityAvailable?:boolean | `@${string}`,
	order?:ResolverInputTypes["Order"],
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeInvalidError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeExpiredError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned if the provided coupon code is invalid */
["CouponCodeLimitError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
	limit?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to modify the contents of an Order that is not in the `AddingItems` state. */
["OrderModificationError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when attempting to set a ShippingMethod for which the Order is not eligible */
["IneligibleShippingMethodError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Returned when invoking a mutation which depends on there being an active Order on the
current session. */
["NoActiveOrderError"]: AliasType<{
	errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
["JSON"]:unknown;
	/** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
["DateTime"]:unknown;
	/** The `Upload` scalar type represents a file upload. */
["Upload"]:unknown;
	/** The `Money` scalar type represents monetary values and supports signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
["Money"]:unknown;
	["PaginatedList"]:AliasType<{
		items?:ResolverInputTypes["Node"],
	totalItems?:boolean | `@${string}`;
		['...on AdministratorList']?: Omit<ResolverInputTypes["AdministratorList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ChannelList']?: Omit<ResolverInputTypes["ChannelList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on CustomerGroupList']?: Omit<ResolverInputTypes["CustomerGroupList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on JobList']?: Omit<ResolverInputTypes["JobList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on PaymentMethodList']?: Omit<ResolverInputTypes["PaymentMethodList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on SellerList']?: Omit<ResolverInputTypes["SellerList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on StockLocationList']?: Omit<ResolverInputTypes["StockLocationList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on TaxCategoryList']?: Omit<ResolverInputTypes["TaxCategoryList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ZoneList']?: Omit<ResolverInputTypes["ZoneList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on AssetList']?: Omit<ResolverInputTypes["AssetList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on CollectionList']?: Omit<ResolverInputTypes["CollectionList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on CustomerList']?: Omit<ResolverInputTypes["CustomerList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on FacetList']?: Omit<ResolverInputTypes["FacetList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on FacetValueList']?: Omit<ResolverInputTypes["FacetValueList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on HistoryEntryList']?: Omit<ResolverInputTypes["HistoryEntryList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on OrderList']?: Omit<ResolverInputTypes["OrderList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ProductList']?: Omit<ResolverInputTypes["ProductList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ProductVariantList']?: Omit<ResolverInputTypes["ProductVariantList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on PromotionList']?: Omit<ResolverInputTypes["PromotionList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on CountryList']?: Omit<ResolverInputTypes["CountryList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ProvinceList']?: Omit<ResolverInputTypes["ProvinceList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on RoleList']?: Omit<ResolverInputTypes["RoleList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ShippingMethodList']?: Omit<ResolverInputTypes["ShippingMethodList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on TagList']?: Omit<ResolverInputTypes["TagList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on TaxRateList']?: Omit<ResolverInputTypes["TaxRateList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on PageList']?: Omit<ResolverInputTypes["PageList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on AnnouncementBarList']?: Omit<ResolverInputTypes["AnnouncementBarList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on WishlistList']?: Omit<ResolverInputTypes["WishlistList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on NewsletterSubscriberList']?: Omit<ResolverInputTypes["NewsletterSubscriberList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on BackInStockSubscriberList']?: Omit<ResolverInputTypes["BackInStockSubscriberList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on B2BSubscriberList']?: Omit<ResolverInputTypes["B2BSubscriberList"],keyof ResolverInputTypes["PaginatedList"]>;
		['...on ModelList']?: Omit<ResolverInputTypes["ModelList"],keyof ResolverInputTypes["PaginatedList"]>;
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		id?:boolean | `@${string}`;
		['...on Administrator']?: Omit<ResolverInputTypes["Administrator"],keyof ResolverInputTypes["Node"]>;
		['...on Collection']?: Omit<ResolverInputTypes["Collection"],keyof ResolverInputTypes["Node"]>;
		['...on Customer']?: Omit<ResolverInputTypes["Customer"],keyof ResolverInputTypes["Node"]>;
		['...on Facet']?: Omit<ResolverInputTypes["Facet"],keyof ResolverInputTypes["Node"]>;
		['...on HistoryEntry']?: Omit<ResolverInputTypes["HistoryEntry"],keyof ResolverInputTypes["Node"]>;
		['...on Job']?: Omit<ResolverInputTypes["Job"],keyof ResolverInputTypes["Node"]>;
		['...on Order']?: Omit<ResolverInputTypes["Order"],keyof ResolverInputTypes["Node"]>;
		['...on Fulfillment']?: Omit<ResolverInputTypes["Fulfillment"],keyof ResolverInputTypes["Node"]>;
		['...on Payment']?: Omit<ResolverInputTypes["Payment"],keyof ResolverInputTypes["Node"]>;
		['...on OrderModification']?: Omit<ResolverInputTypes["OrderModification"],keyof ResolverInputTypes["Node"]>;
		['...on Product']?: Omit<ResolverInputTypes["Product"],keyof ResolverInputTypes["Node"]>;
		['...on ProductVariant']?: Omit<ResolverInputTypes["ProductVariant"],keyof ResolverInputTypes["Node"]>;
		['...on StockLevel']?: Omit<ResolverInputTypes["StockLevel"],keyof ResolverInputTypes["Node"]>;
		['...on StockLocation']?: Omit<ResolverInputTypes["StockLocation"],keyof ResolverInputTypes["Node"]>;
		['...on StockAdjustment']?: Omit<ResolverInputTypes["StockAdjustment"],keyof ResolverInputTypes["Node"]>;
		['...on Allocation']?: Omit<ResolverInputTypes["Allocation"],keyof ResolverInputTypes["Node"]>;
		['...on Sale']?: Omit<ResolverInputTypes["Sale"],keyof ResolverInputTypes["Node"]>;
		['...on Cancellation']?: Omit<ResolverInputTypes["Cancellation"],keyof ResolverInputTypes["Node"]>;
		['...on Return']?: Omit<ResolverInputTypes["Return"],keyof ResolverInputTypes["Node"]>;
		['...on Release']?: Omit<ResolverInputTypes["Release"],keyof ResolverInputTypes["Node"]>;
		['...on Address']?: Omit<ResolverInputTypes["Address"],keyof ResolverInputTypes["Node"]>;
		['...on Asset']?: Omit<ResolverInputTypes["Asset"],keyof ResolverInputTypes["Node"]>;
		['...on Channel']?: Omit<ResolverInputTypes["Channel"],keyof ResolverInputTypes["Node"]>;
		['...on CustomerGroup']?: Omit<ResolverInputTypes["CustomerGroup"],keyof ResolverInputTypes["Node"]>;
		['...on FacetValue']?: Omit<ResolverInputTypes["FacetValue"],keyof ResolverInputTypes["Node"]>;
		['...on OrderLine']?: Omit<ResolverInputTypes["OrderLine"],keyof ResolverInputTypes["Node"]>;
		['...on Refund']?: Omit<ResolverInputTypes["Refund"],keyof ResolverInputTypes["Node"]>;
		['...on Surcharge']?: Omit<ResolverInputTypes["Surcharge"],keyof ResolverInputTypes["Node"]>;
		['...on PaymentMethod']?: Omit<ResolverInputTypes["PaymentMethod"],keyof ResolverInputTypes["Node"]>;
		['...on ProductOptionGroup']?: Omit<ResolverInputTypes["ProductOptionGroup"],keyof ResolverInputTypes["Node"]>;
		['...on ProductOption']?: Omit<ResolverInputTypes["ProductOption"],keyof ResolverInputTypes["Node"]>;
		['...on Promotion']?: Omit<ResolverInputTypes["Promotion"],keyof ResolverInputTypes["Node"]>;
		['...on Region']?: Omit<ResolverInputTypes["Region"],keyof ResolverInputTypes["Node"]>;
		['...on Country']?: Omit<ResolverInputTypes["Country"],keyof ResolverInputTypes["Node"]>;
		['...on Province']?: Omit<ResolverInputTypes["Province"],keyof ResolverInputTypes["Node"]>;
		['...on Role']?: Omit<ResolverInputTypes["Role"],keyof ResolverInputTypes["Node"]>;
		['...on Seller']?: Omit<ResolverInputTypes["Seller"],keyof ResolverInputTypes["Node"]>;
		['...on ShippingMethod']?: Omit<ResolverInputTypes["ShippingMethod"],keyof ResolverInputTypes["Node"]>;
		['...on Tag']?: Omit<ResolverInputTypes["Tag"],keyof ResolverInputTypes["Node"]>;
		['...on TaxCategory']?: Omit<ResolverInputTypes["TaxCategory"],keyof ResolverInputTypes["Node"]>;
		['...on TaxRate']?: Omit<ResolverInputTypes["TaxRate"],keyof ResolverInputTypes["Node"]>;
		['...on User']?: Omit<ResolverInputTypes["User"],keyof ResolverInputTypes["Node"]>;
		['...on AuthenticationMethod']?: Omit<ResolverInputTypes["AuthenticationMethod"],keyof ResolverInputTypes["Node"]>;
		['...on Zone']?: Omit<ResolverInputTypes["Zone"],keyof ResolverInputTypes["Node"]>;
		['...on Page']?: Omit<ResolverInputTypes["Page"],keyof ResolverInputTypes["Node"]>;
		['...on AnnouncementBar']?: Omit<ResolverInputTypes["AnnouncementBar"],keyof ResolverInputTypes["Node"]>;
		['...on WishlistItem']?: Omit<ResolverInputTypes["WishlistItem"],keyof ResolverInputTypes["Node"]>;
		['...on Wishlist']?: Omit<ResolverInputTypes["Wishlist"],keyof ResolverInputTypes["Node"]>;
		['...on NewsletterSubscriber']?: Omit<ResolverInputTypes["NewsletterSubscriber"],keyof ResolverInputTypes["Node"]>;
		['...on BackInStockSubscriber']?: Omit<ResolverInputTypes["BackInStockSubscriber"],keyof ResolverInputTypes["Node"]>;
		['...on B2BSubscriber']?: Omit<ResolverInputTypes["B2BSubscriber"],keyof ResolverInputTypes["Node"]>;
		['...on Model']?: Omit<ResolverInputTypes["Model"],keyof ResolverInputTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["ErrorResult"]:AliasType<{
		errorCode?:boolean | `@${string}`,
	message?:boolean | `@${string}`;
		['...on MimeTypeError']?: Omit<ResolverInputTypes["MimeTypeError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on LanguageNotAvailableError']?: Omit<ResolverInputTypes["LanguageNotAvailableError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on FacetInUseError']?: Omit<ResolverInputTypes["FacetInUseError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on ChannelDefaultLanguageError']?: Omit<ResolverInputTypes["ChannelDefaultLanguageError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on SettlePaymentError']?: Omit<ResolverInputTypes["SettlePaymentError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CancelPaymentError']?: Omit<ResolverInputTypes["CancelPaymentError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on EmptyOrderLineSelectionError']?: Omit<ResolverInputTypes["EmptyOrderLineSelectionError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on ItemsAlreadyFulfilledError']?: Omit<ResolverInputTypes["ItemsAlreadyFulfilledError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on InvalidFulfillmentHandlerError']?: Omit<ResolverInputTypes["InvalidFulfillmentHandlerError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CreateFulfillmentError']?: Omit<ResolverInputTypes["CreateFulfillmentError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on InsufficientStockOnHandError']?: Omit<ResolverInputTypes["InsufficientStockOnHandError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on MultipleOrderError']?: Omit<ResolverInputTypes["MultipleOrderError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CancelActiveOrderError']?: Omit<ResolverInputTypes["CancelActiveOrderError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on PaymentOrderMismatchError']?: Omit<ResolverInputTypes["PaymentOrderMismatchError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on RefundOrderStateError']?: Omit<ResolverInputTypes["RefundOrderStateError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on NothingToRefundError']?: Omit<ResolverInputTypes["NothingToRefundError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on AlreadyRefundedError']?: Omit<ResolverInputTypes["AlreadyRefundedError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on QuantityTooGreatError']?: Omit<ResolverInputTypes["QuantityTooGreatError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on RefundStateTransitionError']?: Omit<ResolverInputTypes["RefundStateTransitionError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on PaymentStateTransitionError']?: Omit<ResolverInputTypes["PaymentStateTransitionError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on FulfillmentStateTransitionError']?: Omit<ResolverInputTypes["FulfillmentStateTransitionError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on OrderModificationStateError']?: Omit<ResolverInputTypes["OrderModificationStateError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on NoChangesSpecifiedError']?: Omit<ResolverInputTypes["NoChangesSpecifiedError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on PaymentMethodMissingError']?: Omit<ResolverInputTypes["PaymentMethodMissingError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on RefundPaymentIdMissingError']?: Omit<ResolverInputTypes["RefundPaymentIdMissingError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on ManualPaymentStateError']?: Omit<ResolverInputTypes["ManualPaymentStateError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on ProductOptionInUseError']?: Omit<ResolverInputTypes["ProductOptionInUseError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on MissingConditionsError']?: Omit<ResolverInputTypes["MissingConditionsError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on NativeAuthStrategyError']?: Omit<ResolverInputTypes["NativeAuthStrategyError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on InvalidCredentialsError']?: Omit<ResolverInputTypes["InvalidCredentialsError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on OrderStateTransitionError']?: Omit<ResolverInputTypes["OrderStateTransitionError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on EmailAddressConflictError']?: Omit<ResolverInputTypes["EmailAddressConflictError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on GuestCheckoutError']?: Omit<ResolverInputTypes["GuestCheckoutError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on OrderLimitError']?: Omit<ResolverInputTypes["OrderLimitError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on NegativeQuantityError']?: Omit<ResolverInputTypes["NegativeQuantityError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on InsufficientStockError']?: Omit<ResolverInputTypes["InsufficientStockError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CouponCodeInvalidError']?: Omit<ResolverInputTypes["CouponCodeInvalidError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CouponCodeExpiredError']?: Omit<ResolverInputTypes["CouponCodeExpiredError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on CouponCodeLimitError']?: Omit<ResolverInputTypes["CouponCodeLimitError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on OrderModificationError']?: Omit<ResolverInputTypes["OrderModificationError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on IneligibleShippingMethodError']?: Omit<ResolverInputTypes["IneligibleShippingMethodError"],keyof ResolverInputTypes["ErrorResult"]>;
		['...on NoActiveOrderError']?: Omit<ResolverInputTypes["NoActiveOrderError"],keyof ResolverInputTypes["ErrorResult"]>;
		__typename?: boolean | `@${string}`
}>;
	["Adjustment"]: AliasType<{
	adjustmentSource?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxLine"]: AliasType<{
	description?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArg"]: AliasType<{
	name?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArgDefinition"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	required?:boolean | `@${string}`,
	defaultValue?:boolean | `@${string}`,
	label?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigurableOperation"]: AliasType<{
	code?:boolean | `@${string}`,
	args?:ResolverInputTypes["ConfigArg"],
		__typename?: boolean | `@${string}`
}>;
	["ConfigurableOperationDefinition"]: AliasType<{
	code?:boolean | `@${string}`,
	args?:ResolverInputTypes["ConfigArgDefinition"],
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DeletionResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConfigArgInput"]: {
	name: string,
	/** A JSON stringified representation of the actual value */
	value: string
};
	["ConfigurableOperationInput"]: {
	code: string,
	arguments: Array<ResolverInputTypes["ConfigArgInput"]>
};
	/** Operators for filtering on a String field */
["StringOperators"]: {
	eq?: string | undefined | null,
	notEq?: string | undefined | null,
	contains?: string | undefined | null,
	notContains?: string | undefined | null,
	in?: Array<string> | undefined | null,
	notIn?: Array<string> | undefined | null,
	regex?: string | undefined | null,
	isNull?: boolean | undefined | null
};
	/** Operators for filtering on an ID field */
["IDOperators"]: {
	eq?: string | undefined | null,
	notEq?: string | undefined | null,
	in?: Array<string> | undefined | null,
	notIn?: Array<string> | undefined | null,
	isNull?: boolean | undefined | null
};
	/** Operators for filtering on a Boolean field */
["BooleanOperators"]: {
	eq?: boolean | undefined | null,
	isNull?: boolean | undefined | null
};
	["NumberRange"]: {
	start: number,
	end: number
};
	/** Operators for filtering on a Int or Float field */
["NumberOperators"]: {
	eq?: number | undefined | null,
	lt?: number | undefined | null,
	lte?: number | undefined | null,
	gt?: number | undefined | null,
	gte?: number | undefined | null,
	between?: ResolverInputTypes["NumberRange"] | undefined | null,
	isNull?: boolean | undefined | null
};
	["DateRange"]: {
	start: ResolverInputTypes["DateTime"],
	end: ResolverInputTypes["DateTime"]
};
	/** Operators for filtering on a DateTime field */
["DateOperators"]: {
	eq?: ResolverInputTypes["DateTime"] | undefined | null,
	before?: ResolverInputTypes["DateTime"] | undefined | null,
	after?: ResolverInputTypes["DateTime"] | undefined | null,
	between?: ResolverInputTypes["DateRange"] | undefined | null,
	isNull?: boolean | undefined | null
};
	/** Operators for filtering on a list of String fields */
["StringListOperators"]: {
	inList: string
};
	/** Operators for filtering on a list of Number fields */
["NumberListOperators"]: {
	inList: number
};
	/** Operators for filtering on a list of Boolean fields */
["BooleanListOperators"]: {
	inList: boolean
};
	/** Operators for filtering on a list of ID fields */
["IDListOperators"]: {
	inList: string
};
	/** Operators for filtering on a list of Date fields */
["DateListOperators"]: {
	inList: ResolverInputTypes["DateTime"]
};
	/** Used to construct boolean expressions for filtering search results
by FacetValue ID. Examples:

* ID=1 OR ID=2: `{ facetValueFilters: [{ or: [1,2] }] }`
* ID=1 AND ID=2: `{ facetValueFilters: [{ and: 1 }, { and: 2 }] }`
* ID=1 AND (ID=2 OR ID=3): `{ facetValueFilters: [{ and: 1 }, { or: [2,3] }] }` */
["FacetValueFilterInput"]: {
	and?: string | undefined | null,
	or?: Array<string> | undefined | null
};
	["SearchInput"]: {
	term?: string | undefined | null,
	facetValueFilters?: Array<ResolverInputTypes["FacetValueFilterInput"]> | undefined | null,
	collectionId?: string | undefined | null,
	collectionSlug?: string | undefined | null,
	groupByProduct?: boolean | undefined | null,
	take?: number | undefined | null,
	skip?: number | undefined | null,
	sort?: ResolverInputTypes["SearchResultSortParameter"] | undefined | null,
	inStock?: boolean | undefined | null,
	minPrice?: number | undefined | null,
	maxPrice?: number | undefined | null
};
	["SearchResultSortParameter"]: {
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	price?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["CreateCustomerInput"]: {
	title?: string | undefined | null,
	firstName: string,
	lastName: string,
	phoneNumber?: string | undefined | null,
	emailAddress: string,
	customFields?: ResolverInputTypes["JSON"] | undefined | null
};
	/** Input used to create an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["CreateAddressInput"]: {
	fullName?: string | undefined | null,
	company?: string | undefined | null,
	streetLine1: string,
	streetLine2?: string | undefined | null,
	city?: string | undefined | null,
	province?: string | undefined | null,
	postalCode?: string | undefined | null,
	countryCode: string,
	phoneNumber?: string | undefined | null,
	defaultShippingAddress?: boolean | undefined | null,
	defaultBillingAddress?: boolean | undefined | null,
	customFields?: ResolverInputTypes["CreateAddressCustomFieldsInput"] | undefined | null
};
	/** Input used to update an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["UpdateAddressInput"]: {
	id: string,
	fullName?: string | undefined | null,
	company?: string | undefined | null,
	streetLine1?: string | undefined | null,
	streetLine2?: string | undefined | null,
	city?: string | undefined | null,
	province?: string | undefined | null,
	postalCode?: string | undefined | null,
	countryCode?: string | undefined | null,
	phoneNumber?: string | undefined | null,
	defaultShippingAddress?: boolean | undefined | null,
	defaultBillingAddress?: boolean | undefined | null,
	customFields?: ResolverInputTypes["UpdateAddressCustomFieldsInput"] | undefined | null
};
	/** Indicates that an operation succeeded, where we do not want to return any more specific information. */
["Success"]: AliasType<{
	success?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodQuote"]: AliasType<{
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	/** Any optional metadata returned by the ShippingCalculator in the ShippingCalculationResult */
	metadata?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["ShippingMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodQuote"]: AliasType<{
	id?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	isEligible?:boolean | `@${string}`,
	eligibilityMessage?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["PaymentMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderItemsResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	OrderModificationError?:ResolverInputTypes["OrderModificationError"],
	OrderLimitError?:ResolverInputTypes["OrderLimitError"],
	NegativeQuantityError?:ResolverInputTypes["NegativeQuantityError"],
	InsufficientStockError?:ResolverInputTypes["InsufficientStockError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveOrderItemsResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	OrderModificationError?:ResolverInputTypes["OrderModificationError"],
		__typename?: boolean | `@${string}`
}>;
	["SetOrderShippingMethodResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	OrderModificationError?:ResolverInputTypes["OrderModificationError"],
	IneligibleShippingMethodError?:ResolverInputTypes["IneligibleShippingMethodError"],
	NoActiveOrderError?:ResolverInputTypes["NoActiveOrderError"],
		__typename?: boolean | `@${string}`
}>;
	["ApplyCouponCodeResult"]: AliasType<{
	Order?:ResolverInputTypes["Order"],
	CouponCodeExpiredError?:ResolverInputTypes["CouponCodeExpiredError"],
	CouponCodeInvalidError?:ResolverInputTypes["CouponCodeInvalidError"],
	CouponCodeLimitError?:ResolverInputTypes["CouponCodeLimitError"],
		__typename?: boolean | `@${string}`
}>;
	/** @description
ISO 4217 currency code

@docsCategory common */
["CurrencyCode"]:CurrencyCode;
	["CustomField"]:AliasType<{
		name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`;
		['...on StringCustomFieldConfig']?: Omit<ResolverInputTypes["StringCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on LocaleStringCustomFieldConfig']?: Omit<ResolverInputTypes["LocaleStringCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on IntCustomFieldConfig']?: Omit<ResolverInputTypes["IntCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on FloatCustomFieldConfig']?: Omit<ResolverInputTypes["FloatCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on BooleanCustomFieldConfig']?: Omit<ResolverInputTypes["BooleanCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on DateTimeCustomFieldConfig']?: Omit<ResolverInputTypes["DateTimeCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on RelationCustomFieldConfig']?: Omit<ResolverInputTypes["RelationCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on TextCustomFieldConfig']?: Omit<ResolverInputTypes["TextCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		['...on LocaleTextCustomFieldConfig']?: Omit<ResolverInputTypes["LocaleTextCustomFieldConfig"],keyof ResolverInputTypes["CustomField"]>;
		__typename?: boolean | `@${string}`
}>;
	["StringCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	pattern?:boolean | `@${string}`,
	options?:ResolverInputTypes["StringFieldOption"],
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StringFieldOption"]: AliasType<{
	value?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
		__typename?: boolean | `@${string}`
}>;
	["LocaleStringCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	pattern?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IntCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FloatCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BooleanCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Expects the same validation formats as the `<input type="datetime-local">` HTML element.
See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#Additional_attributes */
["DateTimeCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
	step?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RelationCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	entity?:boolean | `@${string}`,
	scalarFields?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TextCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LocaleTextCustomFieldConfig"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	label?:ResolverInputTypes["LocalizedString"],
	description?:ResolverInputTypes["LocalizedString"],
	readonly?:boolean | `@${string}`,
	internal?:boolean | `@${string}`,
	nullable?:boolean | `@${string}`,
	ui?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LocalizedString"]: AliasType<{
	languageCode?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomFieldConfig"]: AliasType<{
	StringCustomFieldConfig?:ResolverInputTypes["StringCustomFieldConfig"],
	LocaleStringCustomFieldConfig?:ResolverInputTypes["LocaleStringCustomFieldConfig"],
	IntCustomFieldConfig?:ResolverInputTypes["IntCustomFieldConfig"],
	FloatCustomFieldConfig?:ResolverInputTypes["FloatCustomFieldConfig"],
	BooleanCustomFieldConfig?:ResolverInputTypes["BooleanCustomFieldConfig"],
	DateTimeCustomFieldConfig?:ResolverInputTypes["DateTimeCustomFieldConfig"],
	RelationCustomFieldConfig?:ResolverInputTypes["RelationCustomFieldConfig"],
	TextCustomFieldConfig?:ResolverInputTypes["TextCustomFieldConfig"],
	LocaleTextCustomFieldConfig?:ResolverInputTypes["LocaleTextCustomFieldConfig"],
		__typename?: boolean | `@${string}`
}>;
	["CustomerGroup"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
customers?: [{	options?: ResolverInputTypes["CustomerListOptions"] | undefined | null},ResolverInputTypes["CustomerList"]],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CustomerList"]: AliasType<{
	items?:ResolverInputTypes["Customer"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetValue"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	facet?:ResolverInputTypes["Facet"],
	facetId?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	translations?:ResolverInputTypes["FacetValueTranslation"],
	customFields?:ResolverInputTypes["FacetValueCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["FacetValueTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetList"]: AliasType<{
	items?:ResolverInputTypes["Facet"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FacetValueListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["FacetValueSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["FacetValueFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["FacetValueList"]: AliasType<{
	items?:ResolverInputTypes["FacetValue"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntryType"]:HistoryEntryType;
	["HistoryEntryList"]: AliasType<{
	items?:ResolverInputTypes["HistoryEntry"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["HistoryEntryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["HistoryEntrySortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["HistoryEntryFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	/** @description
Languages in the form of a ISO 639-1 language code with optional
region or script modifier (e.g. de_AT). The selection available is based
on the [Unicode CLDR summary list](https://unicode-org.github.io/cldr-staging/charts/37/summary/root.html)
and includes the major spoken languages of the world and any widely-used variants.

@docsCategory common */
["LanguageCode"]:LanguageCode;
	["OrderType"]:OrderType;
	/** A summary of the taxes being applied to this order, grouped
by taxRate. */
["OrderTaxSummary"]: AliasType<{
	/** A description of this tax */
	description?:boolean | `@${string}`,
	/** The taxRate as a percentage */
	taxRate?:boolean | `@${string}`,
	/** The total net price of OrderLines to which this taxRate applies */
	taxBase?:boolean | `@${string}`,
	/** The total tax being applied to the Order at this taxRate */
	taxTotal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderAddress"]: AliasType<{
	fullName?:boolean | `@${string}`,
	company?:boolean | `@${string}`,
	streetLine1?:boolean | `@${string}`,
	streetLine2?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	province?:boolean | `@${string}`,
	postalCode?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	countryCode?:boolean | `@${string}`,
	phoneNumber?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["AddressCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["OrderList"]: AliasType<{
	items?:ResolverInputTypes["Order"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingLine"]: AliasType<{
	id?:boolean | `@${string}`,
	shippingMethod?:ResolverInputTypes["ShippingMethod"],
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	discountedPrice?:boolean | `@${string}`,
	discountedPriceWithTax?:boolean | `@${string}`,
	discounts?:ResolverInputTypes["Discount"],
		__typename?: boolean | `@${string}`
}>;
	["Discount"]: AliasType<{
	adjustmentSource?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	amount?:boolean | `@${string}`,
	amountWithTax?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["OrderLine"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	productVariant?:ResolverInputTypes["ProductVariant"],
	featuredAsset?:ResolverInputTypes["Asset"],
	/** The price of a single unit, excluding tax and discounts */
	unitPrice?:boolean | `@${string}`,
	/** The price of a single unit, including tax but excluding discounts */
	unitPriceWithTax?:boolean | `@${string}`,
	/** Non-zero if the unitPrice has changed since it was initially added to Order */
	unitPriceChangeSinceAdded?:boolean | `@${string}`,
	/** Non-zero if the unitPriceWithTax has changed since it was initially added to Order */
	unitPriceWithTaxChangeSinceAdded?:boolean | `@${string}`,
	/** The price of a single unit including discounts, excluding tax.

If Order-level discounts have been applied, this will not be the
actual taxable unit price (see `proratedUnitPrice`), but is generally the
correct price to display to customers to avoid confusion
about the internal handling of distributed Order-level discounts. */
	discountedUnitPrice?:boolean | `@${string}`,
	/** The price of a single unit including discounts and tax */
	discountedUnitPriceWithTax?:boolean | `@${string}`,
	/** The actual unit price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderItem, and is used in tax
and refund calculations. */
	proratedUnitPrice?:boolean | `@${string}`,
	/** The proratedUnitPrice including tax */
	proratedUnitPriceWithTax?:boolean | `@${string}`,
	/** The quantity of items purchased */
	quantity?:boolean | `@${string}`,
	/** The quantity at the time the Order was placed */
	orderPlacedQuantity?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
	/** The total price of the line excluding tax and discounts. */
	linePrice?:boolean | `@${string}`,
	/** The total price of the line including tax but excluding discounts. */
	linePriceWithTax?:boolean | `@${string}`,
	/** The price of the line including discounts, excluding tax */
	discountedLinePrice?:boolean | `@${string}`,
	/** The price of the line including discounts and tax */
	discountedLinePriceWithTax?:boolean | `@${string}`,
	/** The actual line price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderLine, and is used in tax
and refund calculations. */
	proratedLinePrice?:boolean | `@${string}`,
	/** The proratedLinePrice including tax */
	proratedLinePriceWithTax?:boolean | `@${string}`,
	/** The total tax on this line */
	lineTax?:boolean | `@${string}`,
	discounts?:ResolverInputTypes["Discount"],
	taxLines?:ResolverInputTypes["TaxLine"],
	order?:ResolverInputTypes["Order"],
	fulfillmentLines?:ResolverInputTypes["FulfillmentLine"],
	customFields?:ResolverInputTypes["OrderLineCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["RefundLine"]: AliasType<{
	orderLine?:ResolverInputTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	refund?:ResolverInputTypes["Refund"],
	refundId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Refund"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	items?:boolean | `@${string}`,
	shipping?:boolean | `@${string}`,
	adjustment?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
	method?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
	transactionId?:boolean | `@${string}`,
	reason?:boolean | `@${string}`,
	lines?:ResolverInputTypes["RefundLine"],
	paymentId?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FulfillmentLine"]: AliasType<{
	orderLine?:ResolverInputTypes["OrderLine"],
	orderLineId?:boolean | `@${string}`,
	quantity?:boolean | `@${string}`,
	fulfillment?:ResolverInputTypes["Fulfillment"],
	fulfillmentId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Surcharge"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	sku?:boolean | `@${string}`,
	taxLines?:ResolverInputTypes["TaxLine"],
	price?:boolean | `@${string}`,
	priceWithTax?:boolean | `@${string}`,
	taxRate?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	checker?:ResolverInputTypes["ConfigurableOperation"],
	handler?:ResolverInputTypes["ConfigurableOperation"],
	translations?:ResolverInputTypes["PaymentMethodTranslation"],
	customFields?:ResolverInputTypes["PaymentMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["PaymentMethodTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroup"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	options?:ResolverInputTypes["ProductOption"],
	translations?:ResolverInputTypes["ProductOptionGroupTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionGroupTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductOption"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	groupId?:boolean | `@${string}`,
	group?:ResolverInputTypes["ProductOptionGroup"],
	translations?:ResolverInputTypes["ProductOptionTranslation"],
	customFields?:ResolverInputTypes["ProductOptionCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductOptionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchReindexResponse"]: AliasType<{
	success?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchResponse"]: AliasType<{
	items?:ResolverInputTypes["SearchResult"],
	totalItems?:boolean | `@${string}`,
	facetValues?:ResolverInputTypes["FacetValueResult"],
	collections?:ResolverInputTypes["CollectionResult"],
	minPrice?:boolean | `@${string}`,
	maxPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Which FacetValues are present in the products returned
by the search, and in what quantity. */
["FacetValueResult"]: AliasType<{
	facetValue?:ResolverInputTypes["FacetValue"],
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Which Collections are present in the products returned
by the search, and in what quantity. */
["CollectionResult"]: AliasType<{
	collection?:ResolverInputTypes["Collection"],
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SearchResultAsset"]: AliasType<{
	id?:boolean | `@${string}`,
	preview?:boolean | `@${string}`,
	focalPoint?:ResolverInputTypes["Coordinate"],
		__typename?: boolean | `@${string}`
}>;
	/** The price of a search result product, either as a range or as a single price */
["SearchResultPrice"]: AliasType<{
	PriceRange?:ResolverInputTypes["PriceRange"],
	SinglePrice?:ResolverInputTypes["SinglePrice"],
		__typename?: boolean | `@${string}`
}>;
	/** The price value where the result has a single price */
["SinglePrice"]: AliasType<{
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** The price range where the result has more than one price */
["PriceRange"]: AliasType<{
	min?:boolean | `@${string}`,
	max?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["ProductTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ProductList"]: AliasType<{
	items?:ResolverInputTypes["Product"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantList"]: AliasType<{
	items?:ResolverInputTypes["ProductVariant"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductVariantTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Promotion"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	startsAt?:boolean | `@${string}`,
	endsAt?:boolean | `@${string}`,
	couponCode?:boolean | `@${string}`,
	perCustomerUsageLimit?:boolean | `@${string}`,
	usageLimit?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	conditions?:ResolverInputTypes["ConfigurableOperation"],
	actions?:ResolverInputTypes["ConfigurableOperation"],
	translations?:ResolverInputTypes["PromotionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PromotionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PromotionList"]: AliasType<{
	items?:ResolverInputTypes["Promotion"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Region"]:AliasType<{
		id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ResolverInputTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ResolverInputTypes["RegionTranslation"];
		['...on Country']?: Omit<ResolverInputTypes["Country"],keyof ResolverInputTypes["Region"]>;
		['...on Province']?: Omit<ResolverInputTypes["Province"],keyof ResolverInputTypes["Region"]>;
		__typename?: boolean | `@${string}`
}>;
	["RegionTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** A Country of the world which your shop operates in.

The `code` field is typically a 2-character ISO code such as "GB", "US", "DE" etc. This code is used in certain inputs such as
`UpdateAddressInput` and `CreateAddressInput` to specify the country. */
["Country"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ResolverInputTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ResolverInputTypes["RegionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CountryList"]: AliasType<{
	items?:ResolverInputTypes["Country"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Province"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	parent?:ResolverInputTypes["Region"],
	parentId?:boolean | `@${string}`,
	translations?:ResolverInputTypes["RegionTranslation"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProvinceList"]: AliasType<{
	items?:ResolverInputTypes["Province"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Role"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	permissions?:boolean | `@${string}`,
	channels?:ResolverInputTypes["Channel"],
		__typename?: boolean | `@${string}`
}>;
	["RoleList"]: AliasType<{
	items?:ResolverInputTypes["Role"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Seller"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	code?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	fulfillmentHandlerCode?:boolean | `@${string}`,
	checker?:ResolverInputTypes["ConfigurableOperation"],
	calculator?:ResolverInputTypes["ConfigurableOperation"],
	translations?:ResolverInputTypes["ShippingMethodTranslation"],
	customFields?:ResolverInputTypes["ShippingMethodCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	customFields?:ResolverInputTypes["ShippingMethodTranslationCustomFields"],
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodList"]: AliasType<{
	items?:ResolverInputTypes["ShippingMethod"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Tag"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TagList"]: AliasType<{
	items?:ResolverInputTypes["Tag"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxCategory"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	isDefault?:boolean | `@${string}`,
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxRate"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
	category?:ResolverInputTypes["TaxCategory"],
	zone?:ResolverInputTypes["Zone"],
	customerGroup?:ResolverInputTypes["CustomerGroup"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxRateList"]: AliasType<{
	items?:ResolverInputTypes["TaxRate"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	identifier?:boolean | `@${string}`,
	verified?:boolean | `@${string}`,
	roles?:ResolverInputTypes["Role"],
	lastLogin?:boolean | `@${string}`,
	authenticationMethods?:ResolverInputTypes["AuthenticationMethod"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AuthenticationMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	strategy?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Zone"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	members?:ResolverInputTypes["Region"],
	customFields?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MetricSummary"]: AliasType<{
	interval?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	entries?:ResolverInputTypes["MetricSummaryEntry"],
		__typename?: boolean | `@${string}`
}>;
	["MetricInterval"]:MetricInterval;
	["MetricType"]:MetricType;
	["MetricSummaryEntry"]: AliasType<{
	label?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MetricSummaryInput"]: {
	interval: ResolverInputTypes["MetricInterval"],
	types: Array<ResolverInputTypes["MetricType"]>,
	refresh?: boolean | undefined | null
};
	["PageType"]:PageType;
	["Author"]: AliasType<{
	firstName?:boolean | `@${string}`,
	lastName?:boolean | `@${string}`,
	emailAddress?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Page"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	asset?:ResolverInputTypes["Asset"],
	position?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	author?:ResolverInputTypes["Author"],
translations?: [{	languageCode?: ResolverInputTypes["LanguageCode"] | undefined | null},ResolverInputTypes["PageTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["PageTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	tags?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageList"]: AliasType<{
	items?:ResolverInputTypes["Page"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["PageSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["PageFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["PageTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	content: string,
	slug: string,
	title: string,
	description: string,
	tags?: string | undefined | null
};
	["UpdatePageInput"]: {
	id: string,
	position?: number | undefined | null,
	enabled?: boolean | undefined | null,
	assetId?: string | undefined | null,
	translations?: Array<ResolverInputTypes["PageTranslationInput"]> | undefined | null
};
	["CreatePageInput"]: {
	position?: number | undefined | null,
	enabled?: boolean | undefined | null,
	type: ResolverInputTypes["PageType"],
	assetId?: string | undefined | null,
	authorId?: string | undefined | null,
	translations: Array<ResolverInputTypes["PageTranslationInput"]>
};
	["DeletePageInput"]: {
	id: string
};
	["AnnouncementBarEntryTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	text?:boolean | `@${string}`,
	redirectUrl?:boolean | `@${string}`,
	icon?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarEntry"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	text?:boolean | `@${string}`,
	redirectUrl?:boolean | `@${string}`,
	icon?:boolean | `@${string}`,
	colorIcon?:boolean | `@${string}`,
	colorText?:boolean | `@${string}`,
translations?: [{	languageCode?: ResolverInputTypes["LanguageCode"] | undefined | null},ResolverInputTypes["AnnouncementBarEntryTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBar"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	enabled?:boolean | `@${string}`,
	startDate?:boolean | `@${string}`,
	endDate?:boolean | `@${string}`,
	speed?:boolean | `@${string}`,
	spaceBetween?:boolean | `@${string}`,
	colorBackground?:boolean | `@${string}`,
	nowActive?:boolean | `@${string}`,
	entries?:ResolverInputTypes["AnnouncementBarEntry"],
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarList"]: AliasType<{
	items?:ResolverInputTypes["AnnouncementBar"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AnnouncementBarListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["AnnouncementBarSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["AnnouncementBarFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["AnnouncementBarEntryTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	text: string,
	redirectUrl: string,
	icon: string
};
	["AnnouncementBarEntryInput"]: {
	id?: string | undefined | null,
	colorIcon?: string | undefined | null,
	colorText?: string | undefined | null,
	translations?: Array<ResolverInputTypes["AnnouncementBarEntryTranslationInput"]> | undefined | null
};
	["UpdateAnnouncementBarInput"]: {
	id: string,
	title?: string | undefined | null,
	enabled?: boolean | undefined | null,
	startDate?: ResolverInputTypes["DateTime"] | undefined | null,
	endDate?: ResolverInputTypes["DateTime"] | undefined | null,
	speed?: number | undefined | null,
	spaceBetween?: number | undefined | null,
	colorBackground?: string | undefined | null,
	entries?: Array<ResolverInputTypes["AnnouncementBarEntryInput"]> | undefined | null
};
	["CreateAnnouncementBarInput"]: {
	title?: string | undefined | null,
	enabled?: boolean | undefined | null,
	startDate?: ResolverInputTypes["DateTime"] | undefined | null,
	endDate?: ResolverInputTypes["DateTime"] | undefined | null,
	speed?: number | undefined | null,
	spaceBetween?: number | undefined | null,
	colorBackground?: string | undefined | null,
	entries?: Array<ResolverInputTypes["AnnouncementBarEntryInput"]> | undefined | null
};
	["DeleteAnnouncementBarInput"]: {
	id: string
};
	["ChangeStatusAnnouncementBarInput"]: {
	id: string,
	enabled: boolean
};
	["WishlistItem"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	product?:ResolverInputTypes["Product"],
	wishlistId?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	minVariantPrice?:boolean | `@${string}`,
	maxVariantPrice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistList"]: AliasType<{
	items?:ResolverInputTypes["WishlistItem"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["WishlistSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["WishlistFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["Wishlist"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	currencyCode?:boolean | `@${string}`,
entries?: [{	options?: ResolverInputTypes["WishlistListOptions"] | undefined | null},ResolverInputTypes["WishlistList"]],
		__typename?: boolean | `@${string}`
}>;
	["WishlistEntryID"]: AliasType<{
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["WishlistIDs"]: AliasType<{
	id?:boolean | `@${string}`,
	entries?:ResolverInputTypes["WishlistEntryID"],
		__typename?: boolean | `@${string}`
}>;
	["OrderRealization"]: AliasType<{
	orderID?:boolean | `@${string}`,
	assetID?:boolean | `@${string}`,
	plannedAt?:boolean | `@${string}`,
	finalPlannedAt?:boolean | `@${string}`,
	note?:boolean | `@${string}`,
	color?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DiscountedPriceMetadata"]: AliasType<{
	price?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	isCustomerGroup?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DiscountedPrice"]: AliasType<{
	value?:boolean | `@${string}`,
	metadata?:ResolverInputTypes["DiscountedPriceMetadata"],
		__typename?: boolean | `@${string}`
}>;
	["ShopOrderRealization"]: AliasType<{
	note?:boolean | `@${string}`,
	plannedAt?:boolean | `@${string}`,
	finalPlannedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RealizationAssetInput"]: {
	id: string,
	orderLineID: string,
	preview: string
};
	["OrderRealizationInput"]: {
	orderID: string,
	assets: Array<ResolverInputTypes["RealizationAssetInput"]>,
	plannedAt: string,
	finalPlannedAt: string,
	note: string,
	color: string
};
	["RegisterProformaInput"]: {
	orderID: string
};
	["NewsletterSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	customer?:ResolverInputTypes["Customer"],
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BackInStockSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	data?:boolean | `@${string}`,
	registerToNewsletter?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	customer?:ResolverInputTypes["Customer"],
	variant?:ResolverInputTypes["ProductVariant"],
	product?:ResolverInputTypes["Product"],
	images?:boolean | `@${string}`,
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["B2BSubscriber"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	NIP?:boolean | `@${string}`,
	city?:boolean | `@${string}`,
	number?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	seen?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NewsletterSubscriberList"]: AliasType<{
	items?:ResolverInputTypes["NewsletterSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BackInStockSubscriberList"]: AliasType<{
	items?:ResolverInputTypes["BackInStockSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["B2BSubscriberList"]: AliasType<{
	items?:ResolverInputTypes["B2BSubscriber"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NewsletterSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["NewsletterSubscriberSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["NewsletterSubscriberFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["BackInStockSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["BackInStockSubscriberSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["BackInStockSubscriberFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["B2BSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["B2BSubscriberSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["B2BSubscriberFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["Model"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	product?:ResolverInputTypes["Product"],
translations?: [{	languageCode?: ResolverInputTypes["LanguageCode"] | undefined | null},ResolverInputTypes["ModelTranslation"]],
		__typename?: boolean | `@${string}`
}>;
	["ModelTranslation"]: AliasType<{
	id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	languageCode?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	content?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelList"]: AliasType<{
	items?:ResolverInputTypes["Model"],
	totalItems?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined | null,
	/** Takes n results, for use in pagination */
	take?: number | undefined | null,
	/** Specifies which properties to sort the results by */
	sort?: ResolverInputTypes["ModelSortParameter"] | undefined | null,
	/** Allows the results to be filtered */
	filter?: ResolverInputTypes["ModelFilterParameter"] | undefined | null,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ResolverInputTypes["LogicalOperator"] | undefined | null
};
	["ModelTranslationInput"]: {
	id?: string | undefined | null,
	languageCode: ResolverInputTypes["LanguageCode"],
	title: string,
	content: string
};
	["UpdateModelInput"]: {
	id: string,
	productId?: string | undefined | null,
	translations?: Array<ResolverInputTypes["ModelTranslationInput"]> | undefined | null
};
	["CreateModelInput"]: {
	file: ResolverInputTypes["Upload"],
	productId?: string | undefined | null,
	translations: Array<ResolverInputTypes["ModelTranslationInput"]>
};
	["DeleteModelInput"]: {
	id: string
};
	["AdministratorFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	firstName?: ResolverInputTypes["StringOperators"] | undefined | null,
	lastName?: ResolverInputTypes["StringOperators"] | undefined | null,
	emailAddress?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["AdministratorSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	firstName?: ResolverInputTypes["SortOrder"] | undefined | null,
	lastName?: ResolverInputTypes["SortOrder"] | undefined | null,
	emailAddress?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["AssetFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	fileSize?: ResolverInputTypes["NumberOperators"] | undefined | null,
	mimeType?: ResolverInputTypes["StringOperators"] | undefined | null,
	width?: ResolverInputTypes["NumberOperators"] | undefined | null,
	height?: ResolverInputTypes["NumberOperators"] | undefined | null,
	source?: ResolverInputTypes["StringOperators"] | undefined | null,
	preview?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["AssetSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	fileSize?: ResolverInputTypes["SortOrder"] | undefined | null,
	mimeType?: ResolverInputTypes["SortOrder"] | undefined | null,
	width?: ResolverInputTypes["SortOrder"] | undefined | null,
	height?: ResolverInputTypes["SortOrder"] | undefined | null,
	source?: ResolverInputTypes["SortOrder"] | undefined | null,
	preview?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ChannelFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	token?: ResolverInputTypes["StringOperators"] | undefined | null,
	defaultLanguageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	currencyCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	defaultCurrencyCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	trackInventory?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	outOfStockThreshold?: ResolverInputTypes["NumberOperators"] | undefined | null,
	pricesIncludeTax?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["ChannelSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	token?: ResolverInputTypes["SortOrder"] | undefined | null,
	outOfStockThreshold?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["CollectionFilterParameter"]: {
	isPrivate?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	inheritFilters?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	slug?: ResolverInputTypes["StringOperators"] | undefined | null,
	position?: ResolverInputTypes["NumberOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	parentId?: ResolverInputTypes["IDOperators"] | undefined | null,
	seoTitle?: ResolverInputTypes["StringOperators"] | undefined | null,
	seoDescription?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["CollectionSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	slug?: ResolverInputTypes["SortOrder"] | undefined | null,
	position?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null,
	parentId?: ResolverInputTypes["SortOrder"] | undefined | null,
	seoTitle?: ResolverInputTypes["SortOrder"] | undefined | null,
	seoDescription?: ResolverInputTypes["SortOrder"] | undefined | null,
	facebookImage?: ResolverInputTypes["SortOrder"] | undefined | null,
	twitterImage?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ProductVariantSortParameter"]: {
	stockOnHand?: ResolverInputTypes["SortOrder"] | undefined | null,
	stockAllocated?: ResolverInputTypes["SortOrder"] | undefined | null,
	outOfStockThreshold?: ResolverInputTypes["SortOrder"] | undefined | null,
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	productId?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	sku?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	price?: ResolverInputTypes["SortOrder"] | undefined | null,
	priceWithTax?: ResolverInputTypes["SortOrder"] | undefined | null,
	stockLevel?: ResolverInputTypes["SortOrder"] | undefined | null,
	omnibusPrice?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["CountryFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	parentId?: ResolverInputTypes["IDOperators"] | undefined | null
};
	["CountrySortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	type?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	parentId?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["CustomerGroupFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["CustomerGroupSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["CustomerSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	title?: ResolverInputTypes["SortOrder"] | undefined | null,
	firstName?: ResolverInputTypes["SortOrder"] | undefined | null,
	lastName?: ResolverInputTypes["SortOrder"] | undefined | null,
	phoneNumber?: ResolverInputTypes["SortOrder"] | undefined | null,
	emailAddress?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["FacetFilterParameter"]: {
	isPrivate?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	usedForColors?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	usedForProductCreations?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	colorsCollection?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["FacetSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	usedForColors?: ResolverInputTypes["SortOrder"] | undefined | null,
	usedForProductCreations?: ResolverInputTypes["SortOrder"] | undefined | null,
	colorsCollection?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["FacetValueFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	facetId?: ResolverInputTypes["IDOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	hexColor?: ResolverInputTypes["StringOperators"] | undefined | null,
	isNew?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["FacetValueSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	facetId?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	image?: ResolverInputTypes["SortOrder"] | undefined | null,
	hexColor?: ResolverInputTypes["SortOrder"] | undefined | null,
	isNew?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["JobFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	startedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	settledAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	queueName?: ResolverInputTypes["StringOperators"] | undefined | null,
	state?: ResolverInputTypes["StringOperators"] | undefined | null,
	progress?: ResolverInputTypes["NumberOperators"] | undefined | null,
	isSettled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	duration?: ResolverInputTypes["NumberOperators"] | undefined | null,
	retries?: ResolverInputTypes["NumberOperators"] | undefined | null,
	attempts?: ResolverInputTypes["NumberOperators"] | undefined | null
};
	["JobSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	startedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	settledAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	queueName?: ResolverInputTypes["SortOrder"] | undefined | null,
	progress?: ResolverInputTypes["SortOrder"] | undefined | null,
	duration?: ResolverInputTypes["SortOrder"] | undefined | null,
	retries?: ResolverInputTypes["SortOrder"] | undefined | null,
	attempts?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["PaymentMethodFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	modalTitle?: ResolverInputTypes["StringOperators"] | undefined | null,
	modalDescription?: ResolverInputTypes["StringOperators"] | undefined | null,
	modalAdditionalDescription?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["PaymentMethodSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalTitle?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalDescription?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalAdditionalDescription?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ProductSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	slug?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null,
	seoTitle?: ResolverInputTypes["SortOrder"] | undefined | null,
	seoDescription?: ResolverInputTypes["SortOrder"] | undefined | null,
	facebookImage?: ResolverInputTypes["SortOrder"] | undefined | null,
	twitterImage?: ResolverInputTypes["SortOrder"] | undefined | null,
	optionsOrder?: ResolverInputTypes["SortOrder"] | undefined | null,
	sizes?: ResolverInputTypes["SortOrder"] | undefined | null,
	finish?: ResolverInputTypes["SortOrder"] | undefined | null,
	materials?: ResolverInputTypes["SortOrder"] | undefined | null,
	payment?: ResolverInputTypes["SortOrder"] | undefined | null,
	delivery?: ResolverInputTypes["SortOrder"] | undefined | null,
	realization?: ResolverInputTypes["SortOrder"] | undefined | null,
	discountBy?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["PromotionFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	startsAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	endsAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	couponCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	perCustomerUsageLimit?: ResolverInputTypes["NumberOperators"] | undefined | null,
	usageLimit?: ResolverInputTypes["NumberOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["PromotionSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	startsAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	endsAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	couponCode?: ResolverInputTypes["SortOrder"] | undefined | null,
	perCustomerUsageLimit?: ResolverInputTypes["SortOrder"] | undefined | null,
	usageLimit?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ProvinceFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	parentId?: ResolverInputTypes["IDOperators"] | undefined | null
};
	["ProvinceSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	type?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	parentId?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["RoleFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["RoleSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["SellerFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["SellerSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ShippingMethodFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	languageCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	code?: ResolverInputTypes["StringOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	fulfillmentHandlerCode?: ResolverInputTypes["StringOperators"] | undefined | null,
	modalTitle?: ResolverInputTypes["StringOperators"] | undefined | null,
	modalDescription?: ResolverInputTypes["StringOperators"] | undefined | null,
	modalAdditionalDescription?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["ShippingMethodSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	code?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null,
	fulfillmentHandlerCode?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalTitle?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalDescription?: ResolverInputTypes["SortOrder"] | undefined | null,
	modalAdditionalDescription?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["StockLocationFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["StockLocationSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["TagFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	value?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["TagSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	value?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["TaxCategoryFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	isDefault?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["TaxCategorySortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["TaxRateFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	value?: ResolverInputTypes["NumberOperators"] | undefined | null
};
	["TaxRateSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	value?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ZoneFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["ZoneSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["PageFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	content?: ResolverInputTypes["StringOperators"] | undefined | null,
	title?: ResolverInputTypes["StringOperators"] | undefined | null,
	description?: ResolverInputTypes["StringOperators"] | undefined | null,
	slug?: ResolverInputTypes["StringOperators"] | undefined | null,
	position?: ResolverInputTypes["NumberOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["PageSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	content?: ResolverInputTypes["SortOrder"] | undefined | null,
	title?: ResolverInputTypes["SortOrder"] | undefined | null,
	description?: ResolverInputTypes["SortOrder"] | undefined | null,
	slug?: ResolverInputTypes["SortOrder"] | undefined | null,
	position?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["AnnouncementBarFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	title?: ResolverInputTypes["StringOperators"] | undefined | null,
	enabled?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	startDate?: ResolverInputTypes["DateOperators"] | undefined | null,
	endDate?: ResolverInputTypes["DateOperators"] | undefined | null,
	speed?: ResolverInputTypes["NumberOperators"] | undefined | null,
	spaceBetween?: ResolverInputTypes["NumberOperators"] | undefined | null,
	colorBackground?: ResolverInputTypes["StringOperators"] | undefined | null,
	nowActive?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["AnnouncementBarSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	title?: ResolverInputTypes["SortOrder"] | undefined | null,
	startDate?: ResolverInputTypes["SortOrder"] | undefined | null,
	endDate?: ResolverInputTypes["SortOrder"] | undefined | null,
	speed?: ResolverInputTypes["SortOrder"] | undefined | null,
	spaceBetween?: ResolverInputTypes["SortOrder"] | undefined | null,
	colorBackground?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["WishlistFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	currencyCode?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["WishlistSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["NewsletterSubscriberFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	email?: ResolverInputTypes["StringOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null,
	data?: ResolverInputTypes["StringOperators"] | undefined | null,
	seen?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["NewsletterSubscriberSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	email?: ResolverInputTypes["SortOrder"] | undefined | null,
	type?: ResolverInputTypes["SortOrder"] | undefined | null,
	data?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["BackInStockSubscriberFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	email?: ResolverInputTypes["StringOperators"] | undefined | null,
	data?: ResolverInputTypes["StringOperators"] | undefined | null,
	registerToNewsletter?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	options?: ResolverInputTypes["StringOperators"] | undefined | null,
	seen?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["BackInStockSubscriberSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	email?: ResolverInputTypes["SortOrder"] | undefined | null,
	data?: ResolverInputTypes["SortOrder"] | undefined | null,
	options?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["B2BSubscriberFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	name?: ResolverInputTypes["StringOperators"] | undefined | null,
	email?: ResolverInputTypes["StringOperators"] | undefined | null,
	NIP?: ResolverInputTypes["StringOperators"] | undefined | null,
	city?: ResolverInputTypes["StringOperators"] | undefined | null,
	number?: ResolverInputTypes["StringOperators"] | undefined | null,
	message?: ResolverInputTypes["StringOperators"] | undefined | null,
	seen?: ResolverInputTypes["BooleanOperators"] | undefined | null
};
	["B2BSubscriberSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	name?: ResolverInputTypes["SortOrder"] | undefined | null,
	email?: ResolverInputTypes["SortOrder"] | undefined | null,
	NIP?: ResolverInputTypes["SortOrder"] | undefined | null,
	city?: ResolverInputTypes["SortOrder"] | undefined | null,
	number?: ResolverInputTypes["SortOrder"] | undefined | null,
	message?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["ModelFilterParameter"]: {
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	title?: ResolverInputTypes["StringOperators"] | undefined | null,
	content?: ResolverInputTypes["StringOperators"] | undefined | null,
	url?: ResolverInputTypes["StringOperators"] | undefined | null,
	key?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["ModelSortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	title?: ResolverInputTypes["SortOrder"] | undefined | null,
	content?: ResolverInputTypes["SortOrder"] | undefined | null,
	url?: ResolverInputTypes["SortOrder"] | undefined | null,
	key?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["HistoryEntryFilterParameter"]: {
	isPublic?: ResolverInputTypes["BooleanOperators"] | undefined | null,
	id?: ResolverInputTypes["IDOperators"] | undefined | null,
	createdAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	updatedAt?: ResolverInputTypes["DateOperators"] | undefined | null,
	type?: ResolverInputTypes["StringOperators"] | undefined | null
};
	["HistoryEntrySortParameter"]: {
	id?: ResolverInputTypes["SortOrder"] | undefined | null,
	createdAt?: ResolverInputTypes["SortOrder"] | undefined | null,
	updatedAt?: ResolverInputTypes["SortOrder"] | undefined | null
};
	["AddressCustomFields"]: AliasType<{
	companyName?:boolean | `@${string}`,
	companyTaxId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateAddressCustomFieldsInput"]: {
	companyName?: string | undefined | null,
	companyTaxId?: string | undefined | null
};
	["UpdateAddressCustomFieldsInput"]: {
	companyName?: string | undefined | null,
	companyTaxId?: string | undefined | null
};
	["CollectionCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	facebookImage?:ResolverInputTypes["Asset"],
	twitterImage?:ResolverInputTypes["Asset"],
		__typename?: boolean | `@${string}`
}>;
	["CollectionTranslationCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null,
	twitterImageId?: string | undefined | null
};
	["UpdateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null,
	twitterImageId?: string | undefined | null
};
	["CreateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null,
	seoDescription?: string | undefined | null
};
	["UpdateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null,
	seoDescription?: string | undefined | null
};
	["FacetCustomFields"]: AliasType<{
	usedForColors?:boolean | `@${string}`,
	usedForProductCreations?:boolean | `@${string}`,
	colorsCollection?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined | null,
	usedForProductCreations?: boolean | undefined | null,
	colorsCollection?: boolean | undefined | null
};
	["UpdateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined | null,
	usedForProductCreations?: boolean | undefined | null,
	colorsCollection?: boolean | undefined | null
};
	["FacetValueCustomFields"]: AliasType<{
	image?:ResolverInputTypes["Asset"],
	hexColor?:boolean | `@${string}`,
	isNew?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined | null,
	hexColor?: string | undefined | null,
	isNew?: boolean | undefined | null
};
	["UpdateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined | null,
	hexColor?: string | undefined | null,
	isNew?: boolean | undefined | null
};
	["OrderCustomFields"]: AliasType<{
	registeredOnCheckout?:boolean | `@${string}`,
	selectedPaymentMethod?:ResolverInputTypes["PaymentMethod"],
	additionalInformation?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderCustomFieldsInput"]: {
	registeredOnCheckout?: boolean | undefined | null,
	selectedPaymentMethodId?: string | undefined | null,
	additionalInformation?: string | undefined | null
};
	["OrderLineCustomFields"]: AliasType<{
	attributes?:boolean | `@${string}`,
	discountBy?:boolean | `@${string}`,
	selectedImage?:ResolverInputTypes["Asset"],
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslationCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined | null,
	modalDescription?: string | undefined | null,
	modalAdditionalDescription?: string | undefined | null
};
	["ProductCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	facebookImage?:ResolverInputTypes["Asset"],
	twitterImage?:ResolverInputTypes["Asset"],
	optionsOrder?:boolean | `@${string}`,
	sizes?:boolean | `@${string}`,
	finish?:boolean | `@${string}`,
	materials?:boolean | `@${string}`,
	payment?:boolean | `@${string}`,
	delivery?:boolean | `@${string}`,
	realization?:boolean | `@${string}`,
	discountBy?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductTranslationCustomFields"]: AliasType<{
	seoTitle?:boolean | `@${string}`,
	seoDescription?:boolean | `@${string}`,
	sizes?:boolean | `@${string}`,
	finish?:boolean | `@${string}`,
	materials?:boolean | `@${string}`,
	payment?:boolean | `@${string}`,
	delivery?:boolean | `@${string}`,
	realization?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null,
	twitterImageId?: string | undefined | null,
	optionsOrder?: string | undefined | null,
	discountBy?: number | undefined | null
};
	["UpdateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined | null,
	twitterImageId?: string | undefined | null,
	optionsOrder?: string | undefined | null,
	discountBy?: number | undefined | null
};
	["ProductTranslationInputCustomFields"]: {
	seoTitle?: string | undefined | null,
	seoDescription?: string | undefined | null,
	sizes?: string | undefined | null,
	finish?: string | undefined | null,
	materials?: string | undefined | null,
	payment?: string | undefined | null,
	delivery?: string | undefined | null,
	realization?: string | undefined | null
};
	["ProductOptionCustomFields"]: AliasType<{
	image?:ResolverInputTypes["Asset"],
	hexColor?:boolean | `@${string}`,
	isNew?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined | null,
	hexColor?: string | undefined | null,
	isNew?: boolean | undefined | null
};
	["UpdateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined | null,
	hexColor?: string | undefined | null,
	isNew?: boolean | undefined | null
};
	["ShippingMethodCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslationCustomFields"]: AliasType<{
	modalTitle?:boolean | `@${string}`,
	modalDescription?:boolean | `@${string}`,
	modalAdditionalDescription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ShippingMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined | null,
	modalDescription?: string | undefined | null,
	modalAdditionalDescription?: string | undefined | null
};
	["OrderLineCustomFieldsInput"]: {
	attributes?: string | undefined | null,
	discountBy?: number | undefined | null,
	selectedImageId?: string | undefined | null
};
	["NativeAuthInput"]: {
	username: string,
	password: string
};
	["CustomFields"]: AliasType<{
	Address?:ResolverInputTypes["CustomFieldConfig"],
	Administrator?:ResolverInputTypes["CustomFieldConfig"],
	Asset?:ResolverInputTypes["CustomFieldConfig"],
	Channel?:ResolverInputTypes["CustomFieldConfig"],
	Collection?:ResolverInputTypes["CustomFieldConfig"],
	Customer?:ResolverInputTypes["CustomFieldConfig"],
	CustomerGroup?:ResolverInputTypes["CustomFieldConfig"],
	Facet?:ResolverInputTypes["CustomFieldConfig"],
	FacetValue?:ResolverInputTypes["CustomFieldConfig"],
	Fulfillment?:ResolverInputTypes["CustomFieldConfig"],
	GlobalSettings?:ResolverInputTypes["CustomFieldConfig"],
	Order?:ResolverInputTypes["CustomFieldConfig"],
	OrderLine?:ResolverInputTypes["CustomFieldConfig"],
	PaymentMethod?:ResolverInputTypes["CustomFieldConfig"],
	Product?:ResolverInputTypes["CustomFieldConfig"],
	ProductOption?:ResolverInputTypes["CustomFieldConfig"],
	ProductOptionGroup?:ResolverInputTypes["CustomFieldConfig"],
	ProductVariant?:ResolverInputTypes["CustomFieldConfig"],
	Promotion?:ResolverInputTypes["CustomFieldConfig"],
	Region?:ResolverInputTypes["CustomFieldConfig"],
	Seller?:ResolverInputTypes["CustomFieldConfig"],
	ShippingMethod?:ResolverInputTypes["CustomFieldConfig"],
	StockLocation?:ResolverInputTypes["CustomFieldConfig"],
	TaxCategory?:ResolverInputTypes["CustomFieldConfig"],
	TaxRate?:ResolverInputTypes["CustomFieldConfig"],
	User?:ResolverInputTypes["CustomFieldConfig"],
	Zone?:ResolverInputTypes["CustomFieldConfig"],
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		administrators: ModelTypes["AdministratorList"],
	administrator?: ModelTypes["Administrator"] | undefined,
	activeAdministrator?: ModelTypes["Administrator"] | undefined,
	/** Get a list of Assets */
	assets: ModelTypes["AssetList"],
	/** Get a single Asset by id */
	asset?: ModelTypes["Asset"] | undefined,
	me?: ModelTypes["CurrentUser"] | undefined,
	channels: ModelTypes["ChannelList"],
	channel?: ModelTypes["Channel"] | undefined,
	activeChannel: ModelTypes["Channel"],
	collections: ModelTypes["CollectionList"],
	/** Get a Collection either by id or slug. If neither id nor slug is specified, an error will result. */
	collection?: ModelTypes["Collection"] | undefined,
	collectionFilters: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	/** Used for real-time previews of the contents of a Collection */
	previewCollectionVariants: ModelTypes["ProductVariantList"],
	countries: ModelTypes["CountryList"],
	country?: ModelTypes["Country"] | undefined,
	customerGroups: ModelTypes["CustomerGroupList"],
	customerGroup?: ModelTypes["CustomerGroup"] | undefined,
	customers: ModelTypes["CustomerList"],
	customer?: ModelTypes["Customer"] | undefined,
	facets: ModelTypes["FacetList"],
	facet?: ModelTypes["Facet"] | undefined,
	facetValues: ModelTypes["FacetValueList"],
	globalSettings: ModelTypes["GlobalSettings"],
	job?: ModelTypes["Job"] | undefined,
	jobs: ModelTypes["JobList"],
	jobsById: Array<ModelTypes["Job"]>,
	jobQueues: Array<ModelTypes["JobQueue"]>,
	jobBufferSize: Array<ModelTypes["JobBufferSize"]>,
	order?: ModelTypes["Order"] | undefined,
	orders: ModelTypes["OrderList"],
	/** Returns a list of eligible shipping methods for the draft Order */
	eligibleShippingMethodsForDraftOrder: Array<ModelTypes["ShippingMethodQuote"]>,
	paymentMethods: ModelTypes["PaymentMethodList"],
	paymentMethod?: ModelTypes["PaymentMethod"] | undefined,
	paymentMethodEligibilityCheckers: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	paymentMethodHandlers: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	productOptionGroups: Array<ModelTypes["ProductOptionGroup"]>,
	productOptionGroup?: ModelTypes["ProductOptionGroup"] | undefined,
	search: ModelTypes["SearchResponse"],
	pendingSearchIndexUpdates: number,
	/** List Products */
	products: ModelTypes["ProductList"],
	/** Get a Product either by id or slug. If neither id nor slug is specified, an error will result. */
	product?: ModelTypes["Product"] | undefined,
	/** List ProductVariants either all or for the specific product. */
	productVariants: ModelTypes["ProductVariantList"],
	/** Get a ProductVariant by id */
	productVariant?: ModelTypes["ProductVariant"] | undefined,
	promotion?: ModelTypes["Promotion"] | undefined,
	promotions: ModelTypes["PromotionList"],
	promotionConditions: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	promotionActions: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	provinces: ModelTypes["ProvinceList"],
	province?: ModelTypes["Province"] | undefined,
	roles: ModelTypes["RoleList"],
	role?: ModelTypes["Role"] | undefined,
	sellers: ModelTypes["SellerList"],
	seller?: ModelTypes["Seller"] | undefined,
	shippingMethods: ModelTypes["ShippingMethodList"],
	shippingMethod?: ModelTypes["ShippingMethod"] | undefined,
	shippingEligibilityCheckers: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	shippingCalculators: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	fulfillmentHandlers: Array<ModelTypes["ConfigurableOperationDefinition"]>,
	testShippingMethod: ModelTypes["TestShippingMethodResult"],
	testEligibleShippingMethods: Array<ModelTypes["ShippingMethodQuote"]>,
	stockLocation?: ModelTypes["StockLocation"] | undefined,
	stockLocations: ModelTypes["StockLocationList"],
	tag: ModelTypes["Tag"],
	tags: ModelTypes["TagList"],
	taxCategories: ModelTypes["TaxCategoryList"],
	taxCategory?: ModelTypes["TaxCategory"] | undefined,
	taxRates: ModelTypes["TaxRateList"],
	taxRate?: ModelTypes["TaxRate"] | undefined,
	zones: ModelTypes["ZoneList"],
	zone?: ModelTypes["Zone"] | undefined,
	/** Get metrics for the given interval and metric types. */
	metricSummary: Array<ModelTypes["MetricSummary"]>,
	page?: ModelTypes["Page"] | undefined,
	pages: ModelTypes["PageList"],
	announcementBar?: ModelTypes["AnnouncementBar"] | undefined,
	announcementBars: ModelTypes["AnnouncementBarList"],
	getActiveAnnouncementBar?: ModelTypes["AnnouncementBar"] | undefined,
	wishlist?: ModelTypes["Wishlist"] | undefined,
	wishlists: ModelTypes["WishlistList"],
	mostWishedProducts: ModelTypes["ProductList"],
	getRealizationURL?: string | undefined,
	getProformaURL?: string | undefined,
	newsletterSubscribers: ModelTypes["NewsletterSubscriberList"],
	backInStockSubscribers: ModelTypes["BackInStockSubscriberList"],
	b2bSubscribers: ModelTypes["B2BSubscriberList"],
	haveNotSeenNewsletterSubscribers: boolean,
	haveNotSeenBackInStockSubscribers: boolean,
	haveNotSeenB2BSubscribers: boolean,
	model?: ModelTypes["Model"] | undefined,
	models: ModelTypes["ModelList"]
};
	["Mutation"]: {
		/** Create a new Administrator */
	createAdministrator: ModelTypes["Administrator"],
	/** Update an existing Administrator */
	updateAdministrator: ModelTypes["Administrator"],
	/** Update the active (currently logged-in) Administrator */
	updateActiveAdministrator: ModelTypes["Administrator"],
	/** Delete an Administrator */
	deleteAdministrator: ModelTypes["DeletionResponse"],
	/** Delete multiple Administrators */
	deleteAdministrators: Array<ModelTypes["DeletionResponse"]>,
	/** Assign a Role to an Administrator */
	assignRoleToAdministrator: ModelTypes["Administrator"],
	/** Create a new Asset */
	createAssets: Array<ModelTypes["CreateAssetResult"]>,
	/** Update an existing Asset */
	updateAsset: ModelTypes["Asset"],
	/** Delete an Asset */
	deleteAsset: ModelTypes["DeletionResponse"],
	/** Delete multiple Assets */
	deleteAssets: ModelTypes["DeletionResponse"],
	/** Assign assets to channel */
	assignAssetsToChannel: Array<ModelTypes["Asset"]>,
	/** Authenticates the user using the native authentication strategy. This mutation is an alias for `authenticate({ native: { ... }})` */
	login: ModelTypes["NativeAuthenticationResult"],
	/** Authenticates the user using a named authentication strategy */
	authenticate: ModelTypes["AuthenticationResult"],
	logout: ModelTypes["Success"],
	/** Create a new Channel */
	createChannel: ModelTypes["CreateChannelResult"],
	/** Update an existing Channel */
	updateChannel: ModelTypes["UpdateChannelResult"],
	/** Delete a Channel */
	deleteChannel: ModelTypes["DeletionResponse"],
	/** Delete multiple Channels */
	deleteChannels: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new Collection */
	createCollection: ModelTypes["Collection"],
	/** Update an existing Collection */
	updateCollection: ModelTypes["Collection"],
	/** Delete a Collection and all of its descendants */
	deleteCollection: ModelTypes["DeletionResponse"],
	/** Delete multiple Collections and all of their descendants */
	deleteCollections: Array<ModelTypes["DeletionResponse"]>,
	/** Move a Collection to a different parent or index */
	moveCollection: ModelTypes["Collection"],
	/** Assigns Collections to the specified Channel */
	assignCollectionsToChannel: Array<ModelTypes["Collection"]>,
	/** Removes Collections from the specified Channel */
	removeCollectionsFromChannel: Array<ModelTypes["Collection"]>,
	/** Create a new Country */
	createCountry: ModelTypes["Country"],
	/** Update an existing Country */
	updateCountry: ModelTypes["Country"],
	/** Delete a Country */
	deleteCountry: ModelTypes["DeletionResponse"],
	/** Delete multiple Countries */
	deleteCountries: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new CustomerGroup */
	createCustomerGroup: ModelTypes["CustomerGroup"],
	/** Update an existing CustomerGroup */
	updateCustomerGroup: ModelTypes["CustomerGroup"],
	/** Delete a CustomerGroup */
	deleteCustomerGroup: ModelTypes["DeletionResponse"],
	/** Delete multiple CustomerGroups */
	deleteCustomerGroups: Array<ModelTypes["DeletionResponse"]>,
	/** Add Customers to a CustomerGroup */
	addCustomersToGroup: ModelTypes["CustomerGroup"],
	/** Remove Customers from a CustomerGroup */
	removeCustomersFromGroup: ModelTypes["CustomerGroup"],
	/** Create a new Customer. If a password is provided, a new User will also be created an linked to the Customer. */
	createCustomer: ModelTypes["CreateCustomerResult"],
	/** Update an existing Customer */
	updateCustomer: ModelTypes["UpdateCustomerResult"],
	/** Delete a Customer */
	deleteCustomer: ModelTypes["DeletionResponse"],
	/** Deletes Customers */
	deleteCustomers: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new Address and associate it with the Customer specified by customerId */
	createCustomerAddress: ModelTypes["Address"],
	/** Update an existing Address */
	updateCustomerAddress: ModelTypes["Address"],
	/** Update an existing Address */
	deleteCustomerAddress: ModelTypes["Success"],
	addNoteToCustomer: ModelTypes["Customer"],
	updateCustomerNote: ModelTypes["HistoryEntry"],
	deleteCustomerNote: ModelTypes["DeletionResponse"],
	/** Create a new Facet */
	createFacet: ModelTypes["Facet"],
	/** Update an existing Facet */
	updateFacet: ModelTypes["Facet"],
	/** Delete an existing Facet */
	deleteFacet: ModelTypes["DeletionResponse"],
	/** Delete multiple existing Facets */
	deleteFacets: Array<ModelTypes["DeletionResponse"]>,
	/** Create one or more FacetValues */
	createFacetValues: Array<ModelTypes["FacetValue"]>,
	/** Update one or more FacetValues */
	updateFacetValues: Array<ModelTypes["FacetValue"]>,
	/** Delete one or more FacetValues */
	deleteFacetValues: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns Facets to the specified Channel */
	assignFacetsToChannel: Array<ModelTypes["Facet"]>,
	/** Removes Facets from the specified Channel */
	removeFacetsFromChannel: Array<ModelTypes["RemoveFacetFromChannelResult"]>,
	updateGlobalSettings: ModelTypes["UpdateGlobalSettingsResult"],
	importProducts?: ModelTypes["ImportInfo"] | undefined,
	/** Remove all settled jobs in the given queues older than the given date. Returns the number of jobs deleted. */
	removeSettledJobs: number,
	cancelJob: ModelTypes["Job"],
	flushBufferedJobs: ModelTypes["Success"],
	settlePayment: ModelTypes["SettlePaymentResult"],
	cancelPayment: ModelTypes["CancelPaymentResult"],
	addFulfillmentToOrder: ModelTypes["AddFulfillmentToOrderResult"],
	cancelOrder: ModelTypes["CancelOrderResult"],
	refundOrder: ModelTypes["RefundOrderResult"],
	settleRefund: ModelTypes["SettleRefundResult"],
	addNoteToOrder: ModelTypes["Order"],
	updateOrderNote: ModelTypes["HistoryEntry"],
	deleteOrderNote: ModelTypes["DeletionResponse"],
	transitionOrderToState?: ModelTypes["TransitionOrderToStateResult"] | undefined,
	transitionFulfillmentToState: ModelTypes["TransitionFulfillmentToStateResult"],
	transitionPaymentToState: ModelTypes["TransitionPaymentToStateResult"],
	setOrderCustomFields?: ModelTypes["Order"] | undefined,
	/** Allows an Order to be modified after it has been completed by the Customer. The Order must first
be in the `Modifying` state. */
	modifyOrder: ModelTypes["ModifyOrderResult"],
	/** Used to manually create a new Payment against an Order.
This can be used by an Administrator when an Order is in the ArrangingPayment state.

It is also used when a completed Order
has been modified (using `modifyOrder`) and the price has increased. The extra payment
can then be manually arranged by the administrator, and the details used to create a new
Payment. */
	addManualPaymentToOrder: ModelTypes["AddManualPaymentToOrderResult"],
	/** Creates a draft Order */
	createDraftOrder: ModelTypes["Order"],
	/** Deletes a draft Order */
	deleteDraftOrder: ModelTypes["DeletionResponse"],
	/** Adds an item to the draft Order. */
	addItemToDraftOrder: ModelTypes["UpdateOrderItemsResult"],
	/** Adjusts a draft OrderLine. If custom fields are defined on the OrderLine entity, a third argument 'customFields' of type `OrderLineCustomFieldsInput` will be available. */
	adjustDraftOrderLine: ModelTypes["UpdateOrderItemsResult"],
	/** Remove an OrderLine from the draft Order */
	removeDraftOrderLine: ModelTypes["RemoveOrderItemsResult"],
	setCustomerForDraftOrder: ModelTypes["SetCustomerForDraftOrderResult"],
	/** Sets the shipping address for a draft Order */
	setDraftOrderShippingAddress: ModelTypes["Order"],
	/** Sets the billing address for a draft Order */
	setDraftOrderBillingAddress: ModelTypes["Order"],
	/** Allows any custom fields to be set for the active order */
	setDraftOrderCustomFields: ModelTypes["Order"],
	/** Applies the given coupon code to the draft Order */
	applyCouponCodeToDraftOrder: ModelTypes["ApplyCouponCodeResult"],
	/** Removes the given coupon code from the draft Order */
	removeCouponCodeFromDraftOrder?: ModelTypes["Order"] | undefined,
	/** Sets the shipping method by id, which can be obtained with the `eligibleShippingMethodsForDraftOrder` query */
	setDraftOrderShippingMethod: ModelTypes["SetOrderShippingMethodResult"],
	/** Create existing PaymentMethod */
	createPaymentMethod: ModelTypes["PaymentMethod"],
	/** Update an existing PaymentMethod */
	updatePaymentMethod: ModelTypes["PaymentMethod"],
	/** Delete a PaymentMethod */
	deletePaymentMethod: ModelTypes["DeletionResponse"],
	/** Delete multiple PaymentMethods */
	deletePaymentMethods: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns PaymentMethods to the specified Channel */
	assignPaymentMethodsToChannel: Array<ModelTypes["PaymentMethod"]>,
	/** Removes PaymentMethods from the specified Channel */
	removePaymentMethodsFromChannel: Array<ModelTypes["PaymentMethod"]>,
	/** Create a new ProductOptionGroup */
	createProductOptionGroup: ModelTypes["ProductOptionGroup"],
	/** Update an existing ProductOptionGroup */
	updateProductOptionGroup: ModelTypes["ProductOptionGroup"],
	/** Create a new ProductOption within a ProductOptionGroup */
	createProductOption: ModelTypes["ProductOption"],
	/** Create a new ProductOption within a ProductOptionGroup */
	updateProductOption: ModelTypes["ProductOption"],
	/** Delete a ProductOption */
	deleteProductOption: ModelTypes["DeletionResponse"],
	reindex: ModelTypes["Job"],
	runPendingSearchIndexUpdates: ModelTypes["Success"],
	/** Create a new Product */
	createProduct: ModelTypes["Product"],
	/** Update an existing Product */
	updateProduct: ModelTypes["Product"],
	/** Update multiple existing Products */
	updateProducts: Array<ModelTypes["Product"]>,
	/** Delete a Product */
	deleteProduct: ModelTypes["DeletionResponse"],
	/** Delete multiple Products */
	deleteProducts: Array<ModelTypes["DeletionResponse"]>,
	/** Add an OptionGroup to a Product */
	addOptionGroupToProduct: ModelTypes["Product"],
	/** Remove an OptionGroup from a Product. If the OptionGroup is in use by any ProductVariants
the mutation will return a ProductOptionInUseError, and the OptionGroup will not be removed.
Setting the `force` argument to `true` will override this and remove the OptionGroup anyway,
as well as removing any of the group's options from the Product's ProductVariants. */
	removeOptionGroupFromProduct: ModelTypes["RemoveOptionGroupFromProductResult"],
	/** Create a set of ProductVariants based on the OptionGroups assigned to the given Product */
	createProductVariants: Array<ModelTypes["ProductVariant"] | undefined>,
	/** Update existing ProductVariants */
	updateProductVariants: Array<ModelTypes["ProductVariant"] | undefined>,
	/** Delete a ProductVariant */
	deleteProductVariant: ModelTypes["DeletionResponse"],
	/** Delete multiple ProductVariants */
	deleteProductVariants: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns all ProductVariants of Product to the specified Channel */
	assignProductsToChannel: Array<ModelTypes["Product"]>,
	/** Removes all ProductVariants of Product from the specified Channel */
	removeProductsFromChannel: Array<ModelTypes["Product"]>,
	/** Assigns ProductVariants to the specified Channel */
	assignProductVariantsToChannel: Array<ModelTypes["ProductVariant"]>,
	/** Removes ProductVariants from the specified Channel */
	removeProductVariantsFromChannel: Array<ModelTypes["ProductVariant"]>,
	createPromotion: ModelTypes["CreatePromotionResult"],
	updatePromotion: ModelTypes["UpdatePromotionResult"],
	deletePromotion: ModelTypes["DeletionResponse"],
	deletePromotions: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns Promotions to the specified Channel */
	assignPromotionsToChannel: Array<ModelTypes["Promotion"]>,
	/** Removes Promotions from the specified Channel */
	removePromotionsFromChannel: Array<ModelTypes["Promotion"]>,
	/** Create a new Province */
	createProvince: ModelTypes["Province"],
	/** Update an existing Province */
	updateProvince: ModelTypes["Province"],
	/** Delete a Province */
	deleteProvince: ModelTypes["DeletionResponse"],
	/** Create a new Role */
	createRole: ModelTypes["Role"],
	/** Update an existing Role */
	updateRole: ModelTypes["Role"],
	/** Delete an existing Role */
	deleteRole: ModelTypes["DeletionResponse"],
	/** Delete multiple Roles */
	deleteRoles: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new Seller */
	createSeller: ModelTypes["Seller"],
	/** Update an existing Seller */
	updateSeller: ModelTypes["Seller"],
	/** Delete a Seller */
	deleteSeller: ModelTypes["DeletionResponse"],
	/** Delete multiple Sellers */
	deleteSellers: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new ShippingMethod */
	createShippingMethod: ModelTypes["ShippingMethod"],
	/** Update an existing ShippingMethod */
	updateShippingMethod: ModelTypes["ShippingMethod"],
	/** Delete a ShippingMethod */
	deleteShippingMethod: ModelTypes["DeletionResponse"],
	/** Delete multiple ShippingMethods */
	deleteShippingMethods: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns ShippingMethods to the specified Channel */
	assignShippingMethodsToChannel: Array<ModelTypes["ShippingMethod"]>,
	/** Removes ShippingMethods from the specified Channel */
	removeShippingMethodsFromChannel: Array<ModelTypes["ShippingMethod"]>,
	createStockLocation: ModelTypes["StockLocation"],
	updateStockLocation: ModelTypes["StockLocation"],
	deleteStockLocation: ModelTypes["DeletionResponse"],
	deleteStockLocations: Array<ModelTypes["DeletionResponse"]>,
	/** Assigns StockLocations to the specified Channel */
	assignStockLocationsToChannel: Array<ModelTypes["StockLocation"]>,
	/** Removes StockLocations from the specified Channel */
	removeStockLocationsFromChannel: Array<ModelTypes["StockLocation"]>,
	/** Create a new Tag */
	createTag: ModelTypes["Tag"],
	/** Update an existing Tag */
	updateTag: ModelTypes["Tag"],
	/** Delete an existing Tag */
	deleteTag: ModelTypes["DeletionResponse"],
	/** Create a new TaxCategory */
	createTaxCategory: ModelTypes["TaxCategory"],
	/** Update an existing TaxCategory */
	updateTaxCategory: ModelTypes["TaxCategory"],
	/** Deletes a TaxCategory */
	deleteTaxCategory: ModelTypes["DeletionResponse"],
	/** Deletes multiple TaxCategories */
	deleteTaxCategories: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new TaxRate */
	createTaxRate: ModelTypes["TaxRate"],
	/** Update an existing TaxRate */
	updateTaxRate: ModelTypes["TaxRate"],
	/** Delete a TaxRate */
	deleteTaxRate: ModelTypes["DeletionResponse"],
	/** Delete multiple TaxRates */
	deleteTaxRates: Array<ModelTypes["DeletionResponse"]>,
	/** Create a new Zone */
	createZone: ModelTypes["Zone"],
	/** Update an existing Zone */
	updateZone: ModelTypes["Zone"],
	/** Delete a Zone */
	deleteZone: ModelTypes["DeletionResponse"],
	/** Delete a Zone */
	deleteZones: Array<ModelTypes["DeletionResponse"]>,
	/** Add members to a Zone */
	addMembersToZone: ModelTypes["Zone"],
	/** Remove members from a Zone */
	removeMembersFromZone: ModelTypes["Zone"],
	updatePage: ModelTypes["Page"],
	createPage: ModelTypes["Page"],
	deletePage?: boolean | undefined,
	updateAnnouncementBar: ModelTypes["AnnouncementBar"],
	createAnnouncementBar: ModelTypes["AnnouncementBar"],
	deleteAnnouncementBar?: boolean | undefined,
	changeStatusAnnouncementBar: boolean,
	registerRealization?: ModelTypes["OrderRealization"] | undefined,
	registerProforma?: string | undefined,
	deleteNewsletterSubscriber: boolean,
	markNewsletterAsSeen: boolean,
	deleteBackInStockSubscriber: boolean,
	markBackInStockAsSeen: boolean,
	deleteB2BSubscriber: boolean,
	markB2BAsSeen: boolean,
	updateModel: ModelTypes["Model"],
	createModel: ModelTypes["Model"],
	deleteModel?: boolean | undefined
};
	["AdministratorListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["AdministratorSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["AdministratorFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateAdministratorInput"]: {
	firstName: string,
	lastName: string,
	emailAddress: string,
	password: string,
	roleIds: Array<string>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateAdministratorInput"]: {
	id: string,
	firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined,
	password?: string | undefined,
	roleIds?: Array<string> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateActiveAdministratorInput"]: {
	firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined,
	password?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["Administrator"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	firstName: string,
	lastName: string,
	emailAddress: string,
	user: ModelTypes["User"],
	customFields?: ModelTypes["JSON"] | undefined
};
	["AdministratorList"]: {
		items: Array<ModelTypes["Administrator"]>,
	totalItems: number
};
	["MimeTypeError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	fileName: string,
	mimeType: string
};
	["CreateAssetResult"]:ModelTypes["Asset"] | ModelTypes["MimeTypeError"];
	["AssetListOptions"]: {
	tags?: Array<string> | undefined,
	tagsOperator?: ModelTypes["LogicalOperator"] | undefined,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["AssetSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["AssetFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateAssetInput"]: {
	file: ModelTypes["Upload"],
	tags?: Array<string> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CoordinateInput"]: {
	x: number,
	y: number
};
	["DeleteAssetInput"]: {
	assetId: string,
	force?: boolean | undefined,
	deleteFromAllChannels?: boolean | undefined
};
	["DeleteAssetsInput"]: {
	assetIds: Array<string>,
	force?: boolean | undefined,
	deleteFromAllChannels?: boolean | undefined
};
	["UpdateAssetInput"]: {
	id: string,
	name?: string | undefined,
	focalPoint?: ModelTypes["CoordinateInput"] | undefined,
	tags?: Array<string> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["AssignAssetsToChannelInput"]: {
	assetIds: Array<string>,
	channelId: string
};
	["AuthenticationInput"]: {
	native?: ModelTypes["NativeAuthInput"] | undefined
};
	["NativeAuthenticationResult"]:ModelTypes["CurrentUser"] | ModelTypes["InvalidCredentialsError"] | ModelTypes["NativeAuthStrategyError"];
	["AuthenticationResult"]:ModelTypes["CurrentUser"] | ModelTypes["InvalidCredentialsError"];
	["ChannelList"]: {
		items: Array<ModelTypes["Channel"]>,
	totalItems: number
};
	["ChannelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ChannelSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ChannelFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateChannelInput"]: {
	code: string,
	token: string,
	defaultLanguageCode: ModelTypes["LanguageCode"],
	availableLanguageCodes?: Array<ModelTypes["LanguageCode"]> | undefined,
	pricesIncludeTax: boolean,
	defaultCurrencyCode?: ModelTypes["CurrencyCode"] | undefined,
	availableCurrencyCodes?: Array<ModelTypes["CurrencyCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	defaultTaxZoneId: string,
	defaultShippingZoneId: string,
	sellerId?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateChannelInput"]: {
	id: string,
	code?: string | undefined,
	token?: string | undefined,
	defaultLanguageCode?: ModelTypes["LanguageCode"] | undefined,
	availableLanguageCodes?: Array<ModelTypes["LanguageCode"]> | undefined,
	pricesIncludeTax?: boolean | undefined,
	defaultCurrencyCode?: ModelTypes["CurrencyCode"] | undefined,
	availableCurrencyCodes?: Array<ModelTypes["CurrencyCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	defaultTaxZoneId?: string | undefined,
	defaultShippingZoneId?: string | undefined,
	sellerId?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	/** Returned if attempting to set a Channel's defaultLanguageCode to a language which is not enabled in GlobalSettings */
["LanguageNotAvailableError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	languageCode: string
};
	["CreateChannelResult"]:ModelTypes["Channel"] | ModelTypes["LanguageNotAvailableError"];
	["UpdateChannelResult"]:ModelTypes["Channel"] | ModelTypes["LanguageNotAvailableError"];
	["Collection"]: {
		isPrivate: boolean,
	inheritFilters: boolean,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode?: ModelTypes["LanguageCode"] | undefined,
	name: string,
	slug: string,
	breadcrumbs: Array<ModelTypes["CollectionBreadcrumb"]>,
	position: number,
	description: string,
	featuredAsset?: ModelTypes["Asset"] | undefined,
	assets: Array<ModelTypes["Asset"]>,
	parent?: ModelTypes["Collection"] | undefined,
	parentId: string,
	children?: Array<ModelTypes["Collection"]> | undefined,
	filters: Array<ModelTypes["ConfigurableOperation"]>,
	translations: Array<ModelTypes["CollectionTranslation"]>,
	productVariants: ModelTypes["ProductVariantList"],
	customFields?: ModelTypes["CollectionCustomFields"] | undefined
};
	["CollectionListOptions"]: {
	topLevelOnly?: boolean | undefined,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["CollectionSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["CollectionFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["MoveCollectionInput"]: {
	collectionId: string,
	parentId: string,
	index: number
};
	["CreateCollectionTranslationInput"]: {
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: ModelTypes["CreateCollectionTranslationInputCustomFields"] | undefined
};
	["UpdateCollectionTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	slug?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["UpdateCollectionTranslationInputCustomFields"] | undefined
};
	["CreateCollectionInput"]: {
	isPrivate?: boolean | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	parentId?: string | undefined,
	inheritFilters?: boolean | undefined,
	filters: Array<ModelTypes["ConfigurableOperationInput"]>,
	translations: Array<ModelTypes["CreateCollectionTranslationInput"]>,
	customFields?: ModelTypes["CreateCollectionCustomFieldsInput"] | undefined
};
	["PreviewCollectionVariantsInput"]: {
	parentId?: string | undefined,
	inheritFilters: boolean,
	filters: Array<ModelTypes["ConfigurableOperationInput"]>
};
	["UpdateCollectionInput"]: {
	id: string,
	isPrivate?: boolean | undefined,
	featuredAssetId?: string | undefined,
	parentId?: string | undefined,
	assetIds?: Array<string> | undefined,
	inheritFilters?: boolean | undefined,
	filters?: Array<ModelTypes["ConfigurableOperationInput"]> | undefined,
	translations?: Array<ModelTypes["UpdateCollectionTranslationInput"]> | undefined,
	customFields?: ModelTypes["UpdateCollectionCustomFieldsInput"] | undefined
};
	["AssignCollectionsToChannelInput"]: {
	collectionIds: Array<string>,
	channelId: string
};
	["RemoveCollectionsFromChannelInput"]: {
	collectionIds: Array<string>,
	channelId: string
};
	["CountryTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateCountryInput"]: {
	code: string,
	translations: Array<ModelTypes["CountryTranslationInput"]>,
	enabled: boolean,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateCountryInput"]: {
	id: string,
	code?: string | undefined,
	translations?: Array<ModelTypes["CountryTranslationInput"]> | undefined,
	enabled?: boolean | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CountryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["CountrySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["CountryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["Customer"]: {
		groups: Array<ModelTypes["CustomerGroup"]>,
	history: ModelTypes["HistoryEntryList"],
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	title?: string | undefined,
	firstName: string,
	lastName: string,
	phoneNumber?: string | undefined,
	emailAddress: string,
	addresses?: Array<ModelTypes["Address"]> | undefined,
	orders: ModelTypes["OrderList"],
	user?: ModelTypes["User"] | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CustomerGroupList"]: {
		items: Array<ModelTypes["CustomerGroup"]>,
	totalItems: number
};
	["CustomerGroupListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["CustomerGroupSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["CustomerGroupFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateCustomerGroupInput"]: {
	name: string,
	customerIds?: Array<string> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateCustomerGroupInput"]: {
	id: string,
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateCustomerInput"]: {
	id: string,
	title?: string | undefined,
	firstName?: string | undefined,
	lastName?: string | undefined,
	phoneNumber?: string | undefined,
	emailAddress?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CustomerFilterParameter"]: {
	postalCode?: ModelTypes["StringOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	title?: ModelTypes["StringOperators"] | undefined,
	firstName?: ModelTypes["StringOperators"] | undefined,
	lastName?: ModelTypes["StringOperators"] | undefined,
	phoneNumber?: ModelTypes["StringOperators"] | undefined,
	emailAddress?: ModelTypes["StringOperators"] | undefined
};
	["CustomerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["CustomerSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["CustomerFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["AddNoteToCustomerInput"]: {
	id: string,
	note: string,
	isPublic: boolean
};
	["UpdateCustomerNoteInput"]: {
	noteId: string,
	note: string
};
	["CreateCustomerResult"]:ModelTypes["Customer"] | ModelTypes["EmailAddressConflictError"];
	["UpdateCustomerResult"]:ModelTypes["Customer"] | ModelTypes["EmailAddressConflictError"];
	["Facet"]: {
		isPrivate: boolean,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	code: string,
	values: Array<ModelTypes["FacetValue"]>,
	/** Returns a paginated, sortable, filterable list of the Facet's values. Added in v2.1.0. */
	valueList: ModelTypes["FacetValueList"],
	translations: Array<ModelTypes["FacetTranslation"]>,
	customFields?: ModelTypes["FacetCustomFields"] | undefined
};
	["FacetListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["FacetSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["FacetFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["FacetTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateFacetInput"]: {
	code: string,
	isPrivate: boolean,
	translations: Array<ModelTypes["FacetTranslationInput"]>,
	values?: Array<ModelTypes["CreateFacetValueWithFacetInput"]> | undefined,
	customFields?: ModelTypes["CreateFacetCustomFieldsInput"] | undefined
};
	["UpdateFacetInput"]: {
	id: string,
	isPrivate?: boolean | undefined,
	code?: string | undefined,
	translations?: Array<ModelTypes["FacetTranslationInput"]> | undefined,
	customFields?: ModelTypes["UpdateFacetCustomFieldsInput"] | undefined
};
	["FacetValueTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateFacetValueWithFacetInput"]: {
	code: string,
	translations: Array<ModelTypes["FacetValueTranslationInput"]>
};
	["CreateFacetValueInput"]: {
	facetId: string,
	code: string,
	translations: Array<ModelTypes["FacetValueTranslationInput"]>,
	customFields?: ModelTypes["CreateFacetValueCustomFieldsInput"] | undefined
};
	["UpdateFacetValueInput"]: {
	id: string,
	code?: string | undefined,
	translations?: Array<ModelTypes["FacetValueTranslationInput"]> | undefined,
	customFields?: ModelTypes["UpdateFacetValueCustomFieldsInput"] | undefined
};
	["AssignFacetsToChannelInput"]: {
	facetIds: Array<string>,
	channelId: string
};
	["RemoveFacetsFromChannelInput"]: {
	facetIds: Array<string>,
	channelId: string,
	force?: boolean | undefined
};
	["FacetInUseError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	facetCode: string,
	productCount: number,
	variantCount: number
};
	["RemoveFacetFromChannelResult"]:ModelTypes["Facet"] | ModelTypes["FacetInUseError"];
	["UpdateGlobalSettingsInput"]: {
	availableLanguages?: Array<ModelTypes["LanguageCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	/** Returned when the default LanguageCode of a Channel is no longer found in the `availableLanguages`
of the GlobalSettings */
["ChannelDefaultLanguageError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	language: string,
	channelCode: string
};
	["UpdateGlobalSettingsResult"]:ModelTypes["GlobalSettings"] | ModelTypes["ChannelDefaultLanguageError"];
	["GlobalSettings"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	availableLanguages: Array<ModelTypes["LanguageCode"]>,
	trackInventory: boolean,
	outOfStockThreshold: number,
	serverConfig: ModelTypes["ServerConfig"],
	customFields?: ModelTypes["JSON"] | undefined
};
	["OrderProcessState"]: {
		name: string,
	to: Array<string>
};
	["PermissionDefinition"]: {
		name: string,
	description: string,
	assignable: boolean
};
	["ServerConfig"]: {
		orderProcess: Array<ModelTypes["OrderProcessState"]>,
	permittedAssetTypes: Array<string>,
	permissions: Array<ModelTypes["PermissionDefinition"]>,
	customFieldConfig: ModelTypes["CustomFields"]
};
	["HistoryEntry"]: {
		isPublic: boolean,
	administrator?: ModelTypes["Administrator"] | undefined,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	type: ModelTypes["HistoryEntryType"],
	data: ModelTypes["JSON"]
};
	["ImportInfo"]: {
		errors?: Array<string> | undefined,
	processed: number,
	imported: number
};
	["JobBufferSize"]: {
		bufferId: string,
	size: number
};
	["JobState"]:JobState;
	["JobListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["JobSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["JobFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["JobList"]: {
		items: Array<ModelTypes["Job"]>,
	totalItems: number
};
	["Job"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	startedAt?: ModelTypes["DateTime"] | undefined,
	settledAt?: ModelTypes["DateTime"] | undefined,
	queueName: string,
	state: ModelTypes["JobState"],
	progress: number,
	data?: ModelTypes["JSON"] | undefined,
	result?: ModelTypes["JSON"] | undefined,
	error?: ModelTypes["JSON"] | undefined,
	isSettled: boolean,
	duration: number,
	retries: number,
	attempts: number
};
	["JobQueue"]: {
		name: string,
	running: boolean
};
	["Order"]: {
		nextStates: Array<string>,
	modifications: Array<ModelTypes["OrderModification"]>,
	sellerOrders?: Array<ModelTypes["Order"]> | undefined,
	aggregateOrder?: ModelTypes["Order"] | undefined,
	aggregateOrderId?: string | undefined,
	channels: Array<ModelTypes["Channel"]>,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	type: ModelTypes["OrderType"],
	/** The date & time that the Order was placed, i.e. the Customer
completed the checkout and the Order is no longer "active" */
	orderPlacedAt?: ModelTypes["DateTime"] | undefined,
	/** A unique code for the Order */
	code: string,
	state: string,
	/** An order is active as long as the payment process has not been completed */
	active: boolean,
	customer?: ModelTypes["Customer"] | undefined,
	shippingAddress?: ModelTypes["OrderAddress"] | undefined,
	billingAddress?: ModelTypes["OrderAddress"] | undefined,
	lines: Array<ModelTypes["OrderLine"]>,
	/** Surcharges are arbitrary modifications to the Order total which are neither
ProductVariants nor discounts resulting from applied Promotions. For example,
one-off discounts based on customer interaction, or surcharges based on payment
methods. */
	surcharges: Array<ModelTypes["Surcharge"]>,
	discounts: Array<ModelTypes["Discount"]>,
	/** An array of all coupon codes applied to the Order */
	couponCodes: Array<string>,
	/** Promotions applied to the order. Only gets populated after the payment process has completed. */
	promotions: Array<ModelTypes["Promotion"]>,
	payments?: Array<ModelTypes["Payment"]> | undefined,
	fulfillments?: Array<ModelTypes["Fulfillment"]> | undefined,
	totalQuantity: number,
	/** The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
discounts which have been prorated (proportionally distributed) amongst the items of each OrderLine.
To get a total of all OrderLines which does not account for prorated discounts, use the
sum of `OrderLine.discountedLinePrice` values. */
	subTotal: ModelTypes["Money"],
	/** Same as subTotal, but inclusive of tax */
	subTotalWithTax: ModelTypes["Money"],
	currencyCode: ModelTypes["CurrencyCode"],
	shippingLines: Array<ModelTypes["ShippingLine"]>,
	shipping: ModelTypes["Money"],
	shippingWithTax: ModelTypes["Money"],
	/** Equal to subTotal plus shipping */
	total: ModelTypes["Money"],
	/** The final payable amount. Equal to subTotalWithTax plus shippingWithTax */
	totalWithTax: ModelTypes["Money"],
	/** A summary of the taxes being applied to this Order */
	taxSummary: Array<ModelTypes["OrderTaxSummary"]>,
	history: ModelTypes["HistoryEntryList"],
	getRealization?: ModelTypes["OrderRealization"] | undefined,
	getProforma?: string | undefined,
	customFields?: ModelTypes["OrderCustomFields"] | undefined
};
	["Fulfillment"]: {
		nextStates: Array<string>,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	lines: Array<ModelTypes["FulfillmentLine"]>,
	summary: Array<ModelTypes["FulfillmentLine"]>,
	state: string,
	method: string,
	trackingCode?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["Payment"]: {
		nextStates: Array<string>,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	method: string,
	amount: ModelTypes["Money"],
	state: string,
	transactionId?: string | undefined,
	errorMessage?: string | undefined,
	refunds: Array<ModelTypes["Refund"]>,
	metadata?: ModelTypes["JSON"] | undefined
};
	["OrderModificationLine"]: {
		orderLine: ModelTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	modification: ModelTypes["OrderModification"],
	modificationId: string
};
	["OrderModification"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	priceChange: ModelTypes["Money"],
	note: string,
	lines: Array<ModelTypes["OrderModificationLine"]>,
	surcharges?: Array<ModelTypes["Surcharge"]> | undefined,
	payment?: ModelTypes["Payment"] | undefined,
	refund?: ModelTypes["Refund"] | undefined,
	isSettled: boolean
};
	["OrderFilterParameter"]: {
	customerLastName?: ModelTypes["StringOperators"] | undefined,
	transactionId?: ModelTypes["StringOperators"] | undefined,
	aggregateOrderId?: ModelTypes["IDOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	orderPlacedAt?: ModelTypes["DateOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	state?: ModelTypes["StringOperators"] | undefined,
	active?: ModelTypes["BooleanOperators"] | undefined,
	totalQuantity?: ModelTypes["NumberOperators"] | undefined,
	subTotal?: ModelTypes["NumberOperators"] | undefined,
	subTotalWithTax?: ModelTypes["NumberOperators"] | undefined,
	currencyCode?: ModelTypes["StringOperators"] | undefined,
	shipping?: ModelTypes["NumberOperators"] | undefined,
	shippingWithTax?: ModelTypes["NumberOperators"] | undefined,
	total?: ModelTypes["NumberOperators"] | undefined,
	totalWithTax?: ModelTypes["NumberOperators"] | undefined,
	getProforma?: ModelTypes["StringOperators"] | undefined,
	registeredOnCheckout?: ModelTypes["BooleanOperators"] | undefined,
	additionalInformation?: ModelTypes["StringOperators"] | undefined
};
	["OrderSortParameter"]: {
	customerLastName?: ModelTypes["SortOrder"] | undefined,
	transactionId?: ModelTypes["SortOrder"] | undefined,
	aggregateOrderId?: ModelTypes["SortOrder"] | undefined,
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	orderPlacedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	state?: ModelTypes["SortOrder"] | undefined,
	totalQuantity?: ModelTypes["SortOrder"] | undefined,
	subTotal?: ModelTypes["SortOrder"] | undefined,
	subTotalWithTax?: ModelTypes["SortOrder"] | undefined,
	shipping?: ModelTypes["SortOrder"] | undefined,
	shippingWithTax?: ModelTypes["SortOrder"] | undefined,
	total?: ModelTypes["SortOrder"] | undefined,
	totalWithTax?: ModelTypes["SortOrder"] | undefined,
	getProforma?: ModelTypes["SortOrder"] | undefined,
	registeredOnCheckout?: ModelTypes["SortOrder"] | undefined,
	selectedPaymentMethod?: ModelTypes["SortOrder"] | undefined,
	additionalInformation?: ModelTypes["SortOrder"] | undefined
};
	["OrderListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["OrderSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["OrderFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["UpdateOrderInput"]: {
	id: string,
	customFields?: ModelTypes["UpdateOrderCustomFieldsInput"] | undefined
};
	["FulfillOrderInput"]: {
	lines: Array<ModelTypes["OrderLineInput"]>,
	handler: ModelTypes["ConfigurableOperationInput"]
};
	["CancelOrderInput"]: {
	/** The id of the order to be cancelled */
	orderId: string,
	/** Optionally specify which OrderLines to cancel. If not provided, all OrderLines will be cancelled */
	lines?: Array<ModelTypes["OrderLineInput"]> | undefined,
	/** Specify whether the shipping charges should also be cancelled. Defaults to false */
	cancelShipping?: boolean | undefined,
	reason?: string | undefined
};
	["RefundOrderInput"]: {
	lines: Array<ModelTypes["OrderLineInput"]>,
	shipping: ModelTypes["Money"],
	adjustment: ModelTypes["Money"],
	paymentId: string,
	reason?: string | undefined
};
	["OrderLineInput"]: {
	orderLineId: string,
	quantity: number,
	customFields?: ModelTypes["OrderLineCustomFieldsInput"] | undefined
};
	["SettleRefundInput"]: {
	id: string,
	transactionId: string
};
	["AddNoteToOrderInput"]: {
	id: string,
	note: string,
	isPublic: boolean
};
	["UpdateOrderNoteInput"]: {
	noteId: string,
	note?: string | undefined,
	isPublic?: boolean | undefined
};
	["AdministratorPaymentInput"]: {
	paymentMethod?: string | undefined,
	metadata?: ModelTypes["JSON"] | undefined
};
	["AdministratorRefundInput"]: {
	paymentId: string,
	reason?: string | undefined
};
	["ModifyOrderOptions"]: {
	freezePromotions?: boolean | undefined,
	recalculateShipping?: boolean | undefined
};
	["UpdateOrderAddressInput"]: {
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	customFields?: ModelTypes["UpdateAddressCustomFieldsInput"] | undefined
};
	["ModifyOrderInput"]: {
	dryRun: boolean,
	orderId: string,
	addItems?: Array<ModelTypes["AddItemInput"]> | undefined,
	adjustOrderLines?: Array<ModelTypes["OrderLineInput"]> | undefined,
	surcharges?: Array<ModelTypes["SurchargeInput"]> | undefined,
	updateShippingAddress?: ModelTypes["UpdateOrderAddressInput"] | undefined,
	updateBillingAddress?: ModelTypes["UpdateOrderAddressInput"] | undefined,
	note?: string | undefined,
	refund?: ModelTypes["AdministratorRefundInput"] | undefined,
	options?: ModelTypes["ModifyOrderOptions"] | undefined,
	couponCodes?: Array<string> | undefined,
	customFields?: ModelTypes["UpdateOrderCustomFieldsInput"] | undefined
};
	["AddItemInput"]: {
	productVariantId: string,
	quantity: number,
	customFields?: ModelTypes["OrderLineCustomFieldsInput"] | undefined
};
	["SurchargeInput"]: {
	description: string,
	sku?: string | undefined,
	price: ModelTypes["Money"],
	priceIncludesTax: boolean,
	taxRate?: number | undefined,
	taxDescription?: string | undefined
};
	["ManualPaymentInput"]: {
	orderId: string,
	method: string,
	transactionId?: string | undefined,
	metadata?: ModelTypes["JSON"] | undefined
};
	["AddItemToDraftOrderInput"]: {
	productVariantId: string,
	quantity: number,
	customFields?: ModelTypes["OrderLineCustomFieldsInput"] | undefined
};
	["AdjustDraftOrderLineInput"]: {
	orderLineId: string,
	quantity: number,
	customFields?: ModelTypes["OrderLineCustomFieldsInput"] | undefined
};
	/** Returned if the Payment settlement fails */
["SettlePaymentError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	paymentErrorMessage: string
};
	/** Returned if the Payment cancellation fails */
["CancelPaymentError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	paymentErrorMessage: string
};
	/** Returned if no OrderLines have been specified for the operation */
["EmptyOrderLineSelectionError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if the specified items are already part of a Fulfillment */
["ItemsAlreadyFulfilledError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if the specified FulfillmentHandler code is not valid */
["InvalidFulfillmentHandlerError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if an error is thrown in a FulfillmentHandler's createFulfillment method */
["CreateFulfillmentError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	fulfillmentHandlerError: string
};
	/** Returned if attempting to create a Fulfillment when there is insufficient
stockOnHand of a ProductVariant to satisfy the requested quantity. */
["InsufficientStockOnHandError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	productVariantId: string,
	productVariantName: string,
	stockOnHand: number
};
	/** Returned if an operation has specified OrderLines from multiple Orders */
["MultipleOrderError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to cancel lines from an Order which is still active */
["CancelActiveOrderError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	orderState: string
};
	/** Returned if an attempting to refund a Payment against OrderLines from a different Order */
["PaymentOrderMismatchError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to refund an Order which is not in the expected state */
["RefundOrderStateError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	orderState: string
};
	/** Returned if an attempting to refund an Order but neither items nor shipping refund was specified */
["NothingToRefundError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to refund an OrderItem which has already been refunded */
["AlreadyRefundedError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	refundId: string
};
	/** Returned if the specified quantity of an OrderLine is greater than the number of items in that line */
["QuantityTooGreatError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when there is an error in transitioning the Refund state */
["RefundStateTransitionError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when there is an error in transitioning the Payment state */
["PaymentStateTransitionError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when there is an error in transitioning the Fulfillment state */
["FulfillmentStateTransitionError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when attempting to modify the contents of an Order that is not in the `Modifying` state. */
["OrderModificationStateError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to specify any changes */
["NoChangesSpecifiedError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to include a paymentMethod even
though the price has increased as a result of the changes. */
["PaymentMethodMissingError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to include a refundPaymentId even
though the price has decreased as a result of the changes. */
["RefundPaymentIdMissingError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to addManualPaymentToOrder is made but the Order
is not in the required state. */
["ManualPaymentStateError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	["TransitionOrderToStateResult"]:ModelTypes["Order"] | ModelTypes["OrderStateTransitionError"];
	["SettlePaymentResult"]:ModelTypes["Payment"] | ModelTypes["SettlePaymentError"] | ModelTypes["PaymentStateTransitionError"] | ModelTypes["OrderStateTransitionError"];
	["CancelPaymentResult"]:ModelTypes["Payment"] | ModelTypes["CancelPaymentError"] | ModelTypes["PaymentStateTransitionError"];
	["AddFulfillmentToOrderResult"]:ModelTypes["Fulfillment"] | ModelTypes["EmptyOrderLineSelectionError"] | ModelTypes["ItemsAlreadyFulfilledError"] | ModelTypes["InsufficientStockOnHandError"] | ModelTypes["InvalidFulfillmentHandlerError"] | ModelTypes["FulfillmentStateTransitionError"] | ModelTypes["CreateFulfillmentError"];
	["CancelOrderResult"]:ModelTypes["Order"] | ModelTypes["EmptyOrderLineSelectionError"] | ModelTypes["QuantityTooGreatError"] | ModelTypes["MultipleOrderError"] | ModelTypes["CancelActiveOrderError"] | ModelTypes["OrderStateTransitionError"];
	["RefundOrderResult"]:ModelTypes["Refund"] | ModelTypes["QuantityTooGreatError"] | ModelTypes["NothingToRefundError"] | ModelTypes["OrderStateTransitionError"] | ModelTypes["MultipleOrderError"] | ModelTypes["PaymentOrderMismatchError"] | ModelTypes["RefundOrderStateError"] | ModelTypes["AlreadyRefundedError"] | ModelTypes["RefundStateTransitionError"];
	["SettleRefundResult"]:ModelTypes["Refund"] | ModelTypes["RefundStateTransitionError"];
	["TransitionFulfillmentToStateResult"]:ModelTypes["Fulfillment"] | ModelTypes["FulfillmentStateTransitionError"];
	["TransitionPaymentToStateResult"]:ModelTypes["Payment"] | ModelTypes["PaymentStateTransitionError"];
	["ModifyOrderResult"]:ModelTypes["Order"] | ModelTypes["NoChangesSpecifiedError"] | ModelTypes["OrderModificationStateError"] | ModelTypes["PaymentMethodMissingError"] | ModelTypes["RefundPaymentIdMissingError"] | ModelTypes["OrderLimitError"] | ModelTypes["NegativeQuantityError"] | ModelTypes["InsufficientStockError"] | ModelTypes["CouponCodeExpiredError"] | ModelTypes["CouponCodeInvalidError"] | ModelTypes["CouponCodeLimitError"];
	["AddManualPaymentToOrderResult"]:ModelTypes["Order"] | ModelTypes["ManualPaymentStateError"];
	["SetCustomerForDraftOrderResult"]:ModelTypes["Order"] | ModelTypes["EmailAddressConflictError"];
	["PaymentMethodList"]: {
		items: Array<ModelTypes["PaymentMethod"]>,
	totalItems: number
};
	["PaymentMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["PaymentMethodSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["PaymentMethodFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["PaymentMethodTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["PaymentMethodTranslationInputCustomFields"] | undefined
};
	["CreatePaymentMethodInput"]: {
	code: string,
	enabled: boolean,
	checker?: ModelTypes["ConfigurableOperationInput"] | undefined,
	handler: ModelTypes["ConfigurableOperationInput"],
	translations: Array<ModelTypes["PaymentMethodTranslationInput"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdatePaymentMethodInput"]: {
	id: string,
	code?: string | undefined,
	enabled?: boolean | undefined,
	checker?: ModelTypes["ConfigurableOperationInput"] | undefined,
	handler?: ModelTypes["ConfigurableOperationInput"] | undefined,
	translations?: Array<ModelTypes["PaymentMethodTranslationInput"]> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["AssignPaymentMethodsToChannelInput"]: {
	paymentMethodIds: Array<string>,
	channelId: string
};
	["RemovePaymentMethodsFromChannelInput"]: {
	paymentMethodIds: Array<string>,
	channelId: string
};
	["Product"]: {
		enabled: boolean,
	channels: Array<ModelTypes["Channel"]>,
	id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	featuredAsset?: ModelTypes["Asset"] | undefined,
	assets: Array<ModelTypes["Asset"]>,
	/** Returns all ProductVariants */
	variants: Array<ModelTypes["ProductVariant"]>,
	/** Returns a paginated, sortable, filterable list of ProductVariants */
	variantList: ModelTypes["ProductVariantList"],
	optionGroups: Array<ModelTypes["ProductOptionGroup"]>,
	facetValues: Array<ModelTypes["FacetValue"]>,
	translations: Array<ModelTypes["ProductTranslation"]>,
	collections: Array<ModelTypes["Collection"]>,
	customFields?: ModelTypes["ProductCustomFields"] | undefined
};
	["ProductVariantPrice"]: {
		currencyCode: ModelTypes["CurrencyCode"],
	price: ModelTypes["Money"]
};
	["ProductVariant"]: {
		enabled: boolean,
	trackInventory: ModelTypes["GlobalFlag"],
	stockOnHand: number,
	stockAllocated: number,
	outOfStockThreshold: number,
	useGlobalOutOfStockThreshold: boolean,
	prices: Array<ModelTypes["ProductVariantPrice"]>,
	stockLevels: Array<ModelTypes["StockLevel"]>,
	stockMovements: ModelTypes["StockMovementList"],
	channels: Array<ModelTypes["Channel"]>,
	id: string,
	product: ModelTypes["Product"],
	productId: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	sku: string,
	name: string,
	featuredAsset?: ModelTypes["Asset"] | undefined,
	assets: Array<ModelTypes["Asset"]>,
	price: ModelTypes["Money"],
	currencyCode: ModelTypes["CurrencyCode"],
	priceWithTax: ModelTypes["Money"],
	stockLevel: string,
	taxRateApplied: ModelTypes["TaxRate"],
	taxCategory: ModelTypes["TaxCategory"],
	options: Array<ModelTypes["ProductOption"]>,
	facetValues: Array<ModelTypes["FacetValue"]>,
	translations: Array<ModelTypes["ProductVariantTranslation"]>,
	omnibusPrice: number,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ProductOptionGroupTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateProductOptionGroupInput"]: {
	code: string,
	translations: Array<ModelTypes["ProductOptionGroupTranslationInput"]>,
	options: Array<ModelTypes["CreateGroupOptionInput"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateProductOptionGroupInput"]: {
	id: string,
	code?: string | undefined,
	translations?: Array<ModelTypes["ProductOptionGroupTranslationInput"]> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ProductOptionTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateGroupOptionInput"]: {
	code: string,
	translations: Array<ModelTypes["ProductOptionGroupTranslationInput"]>
};
	["CreateProductOptionInput"]: {
	productOptionGroupId: string,
	code: string,
	translations: Array<ModelTypes["ProductOptionGroupTranslationInput"]>,
	customFields?: ModelTypes["CreateProductOptionCustomFieldsInput"] | undefined
};
	["UpdateProductOptionInput"]: {
	id: string,
	code?: string | undefined,
	translations?: Array<ModelTypes["ProductOptionGroupTranslationInput"]> | undefined,
	customFields?: ModelTypes["UpdateProductOptionCustomFieldsInput"] | undefined
};
	["SearchResult"]: {
		enabled: boolean,
	/** An array of ids of the Channels in which this result appears */
	channelIds: Array<string>,
	sku: string,
	slug: string,
	productId: string,
	productName: string,
	productAsset?: ModelTypes["SearchResultAsset"] | undefined,
	productVariantId: string,
	productVariantName: string,
	productVariantAsset?: ModelTypes["SearchResultAsset"] | undefined,
	price: ModelTypes["SearchResultPrice"],
	priceWithTax: ModelTypes["SearchResultPrice"],
	currencyCode: ModelTypes["CurrencyCode"],
	description: string,
	facetIds: Array<string>,
	facetValueIds: Array<string>,
	/** An array of ids of the Collections in which this result appears */
	collectionIds: Array<string>,
	/** A relevance score for the result. Differs between database implementations */
	score: number,
	inStock: boolean,
	omnibusPrice: number
};
	["StockMovementListOptions"]: {
	type?: ModelTypes["StockMovementType"] | undefined,
	skip?: number | undefined,
	take?: number | undefined
};
	["ProductListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ProductSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ProductFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["ProductFilterParameter"]: {
	facetValueId?: ModelTypes["IDOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	slug?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	seoTitle?: ModelTypes["StringOperators"] | undefined,
	seoDescription?: ModelTypes["StringOperators"] | undefined,
	optionsOrder?: ModelTypes["StringOperators"] | undefined,
	sizes?: ModelTypes["StringOperators"] | undefined,
	finish?: ModelTypes["StringOperators"] | undefined,
	materials?: ModelTypes["StringOperators"] | undefined,
	payment?: ModelTypes["StringOperators"] | undefined,
	delivery?: ModelTypes["StringOperators"] | undefined,
	realization?: ModelTypes["StringOperators"] | undefined,
	discountBy?: ModelTypes["NumberOperators"] | undefined
};
	["ProductVariantListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ProductVariantSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ProductVariantFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["ProductVariantFilterParameter"]: {
	facetValueId?: ModelTypes["IDOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	trackInventory?: ModelTypes["StringOperators"] | undefined,
	stockOnHand?: ModelTypes["NumberOperators"] | undefined,
	stockAllocated?: ModelTypes["NumberOperators"] | undefined,
	outOfStockThreshold?: ModelTypes["NumberOperators"] | undefined,
	useGlobalOutOfStockThreshold?: ModelTypes["BooleanOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	productId?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	sku?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	price?: ModelTypes["NumberOperators"] | undefined,
	currencyCode?: ModelTypes["StringOperators"] | undefined,
	priceWithTax?: ModelTypes["NumberOperators"] | undefined,
	stockLevel?: ModelTypes["StringOperators"] | undefined,
	omnibusPrice?: ModelTypes["NumberOperators"] | undefined
};
	["ProductTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	slug?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["ProductTranslationInputCustomFields"] | undefined
};
	["CreateProductInput"]: {
	featuredAssetId?: string | undefined,
	enabled?: boolean | undefined,
	assetIds?: Array<string> | undefined,
	facetValueIds?: Array<string> | undefined,
	translations: Array<ModelTypes["ProductTranslationInput"]>,
	customFields?: ModelTypes["CreateProductCustomFieldsInput"] | undefined
};
	["UpdateProductInput"]: {
	id: string,
	enabled?: boolean | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	facetValueIds?: Array<string> | undefined,
	translations?: Array<ModelTypes["ProductTranslationInput"]> | undefined,
	customFields?: ModelTypes["UpdateProductCustomFieldsInput"] | undefined
};
	["ProductVariantTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateProductVariantOptionInput"]: {
	optionGroupId: string,
	code: string,
	translations: Array<ModelTypes["ProductOptionTranslationInput"]>
};
	["StockLevelInput"]: {
	stockLocationId: string,
	stockOnHand: number
};
	/** Used to set up update the price of a ProductVariant in a particular Channel.
If the `delete` flag is `true`, the price will be deleted for the given Channel. */
["ProductVariantPriceInput"]: {
	currencyCode: ModelTypes["CurrencyCode"],
	price: ModelTypes["Money"],
	delete?: boolean | undefined
};
	["CreateProductVariantInput"]: {
	productId: string,
	translations: Array<ModelTypes["ProductVariantTranslationInput"]>,
	facetValueIds?: Array<string> | undefined,
	sku: string,
	price?: ModelTypes["Money"] | undefined,
	taxCategoryId?: string | undefined,
	optionIds?: Array<string> | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	stockOnHand?: number | undefined,
	stockLevels?: Array<ModelTypes["StockLevelInput"]> | undefined,
	outOfStockThreshold?: number | undefined,
	useGlobalOutOfStockThreshold?: boolean | undefined,
	trackInventory?: ModelTypes["GlobalFlag"] | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateProductVariantInput"]: {
	id: string,
	enabled?: boolean | undefined,
	translations?: Array<ModelTypes["ProductVariantTranslationInput"]> | undefined,
	facetValueIds?: Array<string> | undefined,
	optionIds?: Array<string> | undefined,
	sku?: string | undefined,
	taxCategoryId?: string | undefined,
	/** Sets the price for the ProductVariant in the Channel's default currency */
	price?: ModelTypes["Money"] | undefined,
	/** Allows multiple prices to be set for the ProductVariant in different currencies. */
	prices?: Array<ModelTypes["ProductVariantPriceInput"]> | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	stockOnHand?: number | undefined,
	stockLevels?: Array<ModelTypes["StockLevelInput"]> | undefined,
	outOfStockThreshold?: number | undefined,
	useGlobalOutOfStockThreshold?: boolean | undefined,
	trackInventory?: ModelTypes["GlobalFlag"] | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["AssignProductsToChannelInput"]: {
	productIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined
};
	["RemoveProductsFromChannelInput"]: {
	productIds: Array<string>,
	channelId: string
};
	["AssignProductVariantsToChannelInput"]: {
	productVariantIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined
};
	["RemoveProductVariantsFromChannelInput"]: {
	productVariantIds: Array<string>,
	channelId: string
};
	["ProductOptionInUseError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	optionGroupCode: string,
	productVariantCount: number
};
	["RemoveOptionGroupFromProductResult"]:ModelTypes["Product"] | ModelTypes["ProductOptionInUseError"];
	["PromotionListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["PromotionSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["PromotionFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["PromotionTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreatePromotionInput"]: {
	enabled: boolean,
	startsAt?: ModelTypes["DateTime"] | undefined,
	endsAt?: ModelTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	conditions: Array<ModelTypes["ConfigurableOperationInput"]>,
	actions: Array<ModelTypes["ConfigurableOperationInput"]>,
	translations: Array<ModelTypes["PromotionTranslationInput"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdatePromotionInput"]: {
	id: string,
	enabled?: boolean | undefined,
	startsAt?: ModelTypes["DateTime"] | undefined,
	endsAt?: ModelTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	conditions?: Array<ModelTypes["ConfigurableOperationInput"]> | undefined,
	actions?: Array<ModelTypes["ConfigurableOperationInput"]> | undefined,
	translations?: Array<ModelTypes["PromotionTranslationInput"]> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["AssignPromotionsToChannelInput"]: {
	promotionIds: Array<string>,
	channelId: string
};
	["RemovePromotionsFromChannelInput"]: {
	promotionIds: Array<string>,
	channelId: string
};
	/** Returned if a PromotionCondition has neither a couponCode nor any conditions set */
["MissingConditionsError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	["CreatePromotionResult"]:ModelTypes["Promotion"] | ModelTypes["MissingConditionsError"];
	["UpdatePromotionResult"]:ModelTypes["Promotion"] | ModelTypes["MissingConditionsError"];
	["ProvinceTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CreateProvinceInput"]: {
	code: string,
	translations: Array<ModelTypes["ProvinceTranslationInput"]>,
	enabled: boolean,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateProvinceInput"]: {
	id: string,
	code?: string | undefined,
	translations?: Array<ModelTypes["ProvinceTranslationInput"]> | undefined,
	enabled?: boolean | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ProvinceListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ProvinceSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ProvinceFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["RoleListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["RoleSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["RoleFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateRoleInput"]: {
	code: string,
	description: string,
	permissions: Array<ModelTypes["Permission"]>,
	channelIds?: Array<string> | undefined
};
	["UpdateRoleInput"]: {
	id: string,
	code?: string | undefined,
	description?: string | undefined,
	permissions?: Array<ModelTypes["Permission"]> | undefined,
	channelIds?: Array<string> | undefined
};
	["SellerList"]: {
		items: Array<ModelTypes["Seller"]>,
	totalItems: number
};
	["SellerListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["SellerSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["SellerFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateSellerInput"]: {
	name: string,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateSellerInput"]: {
	id: string,
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ShippingMethodListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ShippingMethodSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ShippingMethodFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["ShippingMethodTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["ShippingMethodTranslationInputCustomFields"] | undefined
};
	["CreateShippingMethodInput"]: {
	code: string,
	fulfillmentHandler: string,
	checker: ModelTypes["ConfigurableOperationInput"],
	calculator: ModelTypes["ConfigurableOperationInput"],
	translations: Array<ModelTypes["ShippingMethodTranslationInput"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateShippingMethodInput"]: {
	id: string,
	code?: string | undefined,
	fulfillmentHandler?: string | undefined,
	checker?: ModelTypes["ConfigurableOperationInput"] | undefined,
	calculator?: ModelTypes["ConfigurableOperationInput"] | undefined,
	translations: Array<ModelTypes["ShippingMethodTranslationInput"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["TestShippingMethodInput"]: {
	checker: ModelTypes["ConfigurableOperationInput"],
	calculator: ModelTypes["ConfigurableOperationInput"],
	shippingAddress: ModelTypes["CreateAddressInput"],
	lines: Array<ModelTypes["TestShippingMethodOrderLineInput"]>
};
	["TestEligibleShippingMethodsInput"]: {
	shippingAddress: ModelTypes["CreateAddressInput"],
	lines: Array<ModelTypes["TestShippingMethodOrderLineInput"]>
};
	["TestShippingMethodOrderLineInput"]: {
	productVariantId: string,
	quantity: number
};
	["TestShippingMethodResult"]: {
		eligible: boolean,
	quote?: ModelTypes["TestShippingMethodQuote"] | undefined
};
	["TestShippingMethodQuote"]: {
		price: ModelTypes["Money"],
	priceWithTax: ModelTypes["Money"],
	metadata?: ModelTypes["JSON"] | undefined
};
	["AssignShippingMethodsToChannelInput"]: {
	shippingMethodIds: Array<string>,
	channelId: string
};
	["RemoveShippingMethodsFromChannelInput"]: {
	shippingMethodIds: Array<string>,
	channelId: string
};
	["StockLevel"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	stockLocationId: string,
	stockOnHand: number,
	stockAllocated: number,
	stockLocation: ModelTypes["StockLocation"]
};
	["StockLocationListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["StockLocationSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["StockLocationFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["StockLocationList"]: {
		items: Array<ModelTypes["StockLocation"]>,
	totalItems: number
};
	["CreateStockLocationInput"]: {
	name: string,
	description?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateStockLocationInput"]: {
	id: string,
	name?: string | undefined,
	description?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["DeleteStockLocationInput"]: {
	id: string,
	transferToLocationId?: string | undefined
};
	["AssignStockLocationsToChannelInput"]: {
	stockLocationIds: Array<string>,
	channelId: string
};
	["RemoveStockLocationsFromChannelInput"]: {
	stockLocationIds: Array<string>,
	channelId: string
};
	["StockLocation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	description: string,
	customFields?: ModelTypes["JSON"] | undefined
};
	["StockMovementType"]:StockMovementType;
	["StockMovement"]: ModelTypes["StockAdjustment"] | ModelTypes["Allocation"] | ModelTypes["Sale"] | ModelTypes["Cancellation"] | ModelTypes["Return"] | ModelTypes["Release"];
	["StockAdjustment"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number
};
	["Allocation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number,
	orderLine: ModelTypes["OrderLine"]
};
	["Sale"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number
};
	["Cancellation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number,
	orderLine: ModelTypes["OrderLine"]
};
	["Return"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number
};
	["Release"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	type: ModelTypes["StockMovementType"],
	quantity: number
};
	["StockMovementItem"]:ModelTypes["StockAdjustment"] | ModelTypes["Allocation"] | ModelTypes["Sale"] | ModelTypes["Cancellation"] | ModelTypes["Return"] | ModelTypes["Release"];
	["StockMovementList"]: {
		items: Array<ModelTypes["StockMovementItem"]>,
	totalItems: number
};
	["TagListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["TagSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["TagFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateTagInput"]: {
	value: string
};
	["UpdateTagInput"]: {
	id: string,
	value?: string | undefined
};
	["TaxCategoryList"]: {
		items: Array<ModelTypes["TaxCategory"]>,
	totalItems: number
};
	["TaxCategoryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["TaxCategorySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["TaxCategoryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateTaxCategoryInput"]: {
	name: string,
	isDefault?: boolean | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateTaxCategoryInput"]: {
	id: string,
	name?: string | undefined,
	isDefault?: boolean | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["TaxRateListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["TaxRateSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["TaxRateFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateTaxRateInput"]: {
	name: string,
	enabled: boolean,
	value: number,
	categoryId: string,
	zoneId: string,
	customerGroupId?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateTaxRateInput"]: {
	id: string,
	name?: string | undefined,
	value?: number | undefined,
	enabled?: boolean | undefined,
	categoryId?: string | undefined,
	zoneId?: string | undefined,
	customerGroupId?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ZoneList"]: {
		items: Array<ModelTypes["Zone"]>,
	totalItems: number
};
	["ZoneListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ZoneSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ZoneFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["CreateZoneInput"]: {
	name: string,
	memberIds?: Array<string> | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["UpdateZoneInput"]: {
	id: string,
	name?: string | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["Address"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1: string,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	country: ModelTypes["Country"],
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: ModelTypes["AddressCustomFields"] | undefined
};
	["Asset"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	type: ModelTypes["AssetType"],
	fileSize: number,
	mimeType: string,
	width: number,
	height: number,
	source: string,
	preview: string,
	focalPoint?: ModelTypes["Coordinate"] | undefined,
	tags: Array<ModelTypes["Tag"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["Coordinate"]: {
		x: number,
	y: number
};
	["AssetList"]: {
		items: Array<ModelTypes["Asset"]>,
	totalItems: number
};
	["AssetType"]:AssetType;
	["CurrentUser"]: {
		id: string,
	identifier: string,
	channels: Array<ModelTypes["CurrentUserChannel"]>
};
	["CurrentUserChannel"]: {
		id: string,
	token: string,
	code: string,
	permissions: Array<ModelTypes["Permission"]>
};
	["Channel"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	code: string,
	token: string,
	defaultTaxZone?: ModelTypes["Zone"] | undefined,
	defaultShippingZone?: ModelTypes["Zone"] | undefined,
	defaultLanguageCode: ModelTypes["LanguageCode"],
	availableLanguageCodes?: Array<ModelTypes["LanguageCode"]> | undefined,
	currencyCode: ModelTypes["CurrencyCode"],
	defaultCurrencyCode: ModelTypes["CurrencyCode"],
	availableCurrencyCodes: Array<ModelTypes["CurrencyCode"]>,
	/** Not yet used - will be implemented in a future release. */
	trackInventory?: boolean | undefined,
	/** Not yet used - will be implemented in a future release. */
	outOfStockThreshold?: number | undefined,
	pricesIncludeTax: boolean,
	seller?: ModelTypes["Seller"] | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CollectionBreadcrumb"]: {
		id: string,
	name: string,
	slug: string
};
	["CollectionTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: ModelTypes["CollectionTranslationCustomFields"] | undefined
};
	["CollectionList"]: {
		items: Array<ModelTypes["Collection"]>,
	totalItems: number
};
	["GlobalFlag"]:GlobalFlag;
	["AdjustmentType"]:AdjustmentType;
	["DeletionResult"]:DeletionResult;
	["Permission"]:Permission;
	["SortOrder"]:SortOrder;
	["ErrorCode"]:ErrorCode;
	["LogicalOperator"]:LogicalOperator;
	/** Returned when attempting an operation that relies on the NativeAuthStrategy, if that strategy is not configured. */
["NativeAuthStrategyError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned if the user authentication credentials are not valid */
["InvalidCredentialsError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	authenticationError: string
};
	/** Returned if there is an error in transitioning the Order state */
["OrderStateTransitionError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when attempting to create a Customer with an email address already registered to an existing User. */
["EmailAddressConflictError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to set the Customer on a guest checkout when the configured GuestCheckoutStrategy does not allow it. */
["GuestCheckoutError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	errorDetail: string
};
	/** Returned when the maximum order size limit has been reached. */
["OrderLimitError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	maxItems: number
};
	/** Returned when attempting to set a negative OrderLine quantity. */
["NegativeQuantityError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to add more items to the Order than are available */
["InsufficientStockError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	quantityAvailable: number,
	order: ModelTypes["Order"]
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeInvalidError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	couponCode: string
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeExpiredError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	couponCode: string
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeLimitError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string,
	couponCode: string,
	limit: number
};
	/** Returned when attempting to modify the contents of an Order that is not in the `AddingItems` state. */
["OrderModificationError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to set a ShippingMethod for which the Order is not eligible */
["IneligibleShippingMethodError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** Returned when invoking a mutation which depends on there being an active Order on the
current session. */
["NoActiveOrderError"]: {
		errorCode: ModelTypes["ErrorCode"],
	message: string
};
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
["JSON"]:any;
	/** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
["DateTime"]:any;
	/** The `Upload` scalar type represents a file upload. */
["Upload"]:any;
	/** The `Money` scalar type represents monetary values and supports signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
["Money"]:any;
	["PaginatedList"]: ModelTypes["AdministratorList"] | ModelTypes["ChannelList"] | ModelTypes["CustomerGroupList"] | ModelTypes["JobList"] | ModelTypes["PaymentMethodList"] | ModelTypes["SellerList"] | ModelTypes["StockLocationList"] | ModelTypes["TaxCategoryList"] | ModelTypes["ZoneList"] | ModelTypes["AssetList"] | ModelTypes["CollectionList"] | ModelTypes["CustomerList"] | ModelTypes["FacetList"] | ModelTypes["FacetValueList"] | ModelTypes["HistoryEntryList"] | ModelTypes["OrderList"] | ModelTypes["ProductList"] | ModelTypes["ProductVariantList"] | ModelTypes["PromotionList"] | ModelTypes["CountryList"] | ModelTypes["ProvinceList"] | ModelTypes["RoleList"] | ModelTypes["ShippingMethodList"] | ModelTypes["TagList"] | ModelTypes["TaxRateList"] | ModelTypes["PageList"] | ModelTypes["AnnouncementBarList"] | ModelTypes["WishlistList"] | ModelTypes["NewsletterSubscriberList"] | ModelTypes["BackInStockSubscriberList"] | ModelTypes["B2BSubscriberList"] | ModelTypes["ModelList"];
	["Node"]: ModelTypes["Administrator"] | ModelTypes["Collection"] | ModelTypes["Customer"] | ModelTypes["Facet"] | ModelTypes["HistoryEntry"] | ModelTypes["Job"] | ModelTypes["Order"] | ModelTypes["Fulfillment"] | ModelTypes["Payment"] | ModelTypes["OrderModification"] | ModelTypes["Product"] | ModelTypes["ProductVariant"] | ModelTypes["StockLevel"] | ModelTypes["StockLocation"] | ModelTypes["StockAdjustment"] | ModelTypes["Allocation"] | ModelTypes["Sale"] | ModelTypes["Cancellation"] | ModelTypes["Return"] | ModelTypes["Release"] | ModelTypes["Address"] | ModelTypes["Asset"] | ModelTypes["Channel"] | ModelTypes["CustomerGroup"] | ModelTypes["FacetValue"] | ModelTypes["OrderLine"] | ModelTypes["Refund"] | ModelTypes["Surcharge"] | ModelTypes["PaymentMethod"] | ModelTypes["ProductOptionGroup"] | ModelTypes["ProductOption"] | ModelTypes["Promotion"] | ModelTypes["Region"] | ModelTypes["Country"] | ModelTypes["Province"] | ModelTypes["Role"] | ModelTypes["Seller"] | ModelTypes["ShippingMethod"] | ModelTypes["Tag"] | ModelTypes["TaxCategory"] | ModelTypes["TaxRate"] | ModelTypes["User"] | ModelTypes["AuthenticationMethod"] | ModelTypes["Zone"] | ModelTypes["Page"] | ModelTypes["AnnouncementBar"] | ModelTypes["WishlistItem"] | ModelTypes["Wishlist"] | ModelTypes["NewsletterSubscriber"] | ModelTypes["BackInStockSubscriber"] | ModelTypes["B2BSubscriber"] | ModelTypes["Model"];
	["ErrorResult"]: ModelTypes["MimeTypeError"] | ModelTypes["LanguageNotAvailableError"] | ModelTypes["FacetInUseError"] | ModelTypes["ChannelDefaultLanguageError"] | ModelTypes["SettlePaymentError"] | ModelTypes["CancelPaymentError"] | ModelTypes["EmptyOrderLineSelectionError"] | ModelTypes["ItemsAlreadyFulfilledError"] | ModelTypes["InvalidFulfillmentHandlerError"] | ModelTypes["CreateFulfillmentError"] | ModelTypes["InsufficientStockOnHandError"] | ModelTypes["MultipleOrderError"] | ModelTypes["CancelActiveOrderError"] | ModelTypes["PaymentOrderMismatchError"] | ModelTypes["RefundOrderStateError"] | ModelTypes["NothingToRefundError"] | ModelTypes["AlreadyRefundedError"] | ModelTypes["QuantityTooGreatError"] | ModelTypes["RefundStateTransitionError"] | ModelTypes["PaymentStateTransitionError"] | ModelTypes["FulfillmentStateTransitionError"] | ModelTypes["OrderModificationStateError"] | ModelTypes["NoChangesSpecifiedError"] | ModelTypes["PaymentMethodMissingError"] | ModelTypes["RefundPaymentIdMissingError"] | ModelTypes["ManualPaymentStateError"] | ModelTypes["ProductOptionInUseError"] | ModelTypes["MissingConditionsError"] | ModelTypes["NativeAuthStrategyError"] | ModelTypes["InvalidCredentialsError"] | ModelTypes["OrderStateTransitionError"] | ModelTypes["EmailAddressConflictError"] | ModelTypes["GuestCheckoutError"] | ModelTypes["OrderLimitError"] | ModelTypes["NegativeQuantityError"] | ModelTypes["InsufficientStockError"] | ModelTypes["CouponCodeInvalidError"] | ModelTypes["CouponCodeExpiredError"] | ModelTypes["CouponCodeLimitError"] | ModelTypes["OrderModificationError"] | ModelTypes["IneligibleShippingMethodError"] | ModelTypes["NoActiveOrderError"];
	["Adjustment"]: {
		adjustmentSource: string,
	type: ModelTypes["AdjustmentType"],
	description: string,
	amount: ModelTypes["Money"],
	data?: ModelTypes["JSON"] | undefined
};
	["TaxLine"]: {
		description: string,
	taxRate: number
};
	["ConfigArg"]: {
		name: string,
	value: string
};
	["ConfigArgDefinition"]: {
		name: string,
	type: string,
	list: boolean,
	required: boolean,
	defaultValue?: ModelTypes["JSON"] | undefined,
	label?: string | undefined,
	description?: string | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["ConfigurableOperation"]: {
		code: string,
	args: Array<ModelTypes["ConfigArg"]>
};
	["ConfigurableOperationDefinition"]: {
		code: string,
	args: Array<ModelTypes["ConfigArgDefinition"]>,
	description: string
};
	["DeletionResponse"]: {
		result: ModelTypes["DeletionResult"],
	message?: string | undefined
};
	["ConfigArgInput"]: {
	name: string,
	/** A JSON stringified representation of the actual value */
	value: string
};
	["ConfigurableOperationInput"]: {
	code: string,
	arguments: Array<ModelTypes["ConfigArgInput"]>
};
	/** Operators for filtering on a String field */
["StringOperators"]: {
	eq?: string | undefined,
	notEq?: string | undefined,
	contains?: string | undefined,
	notContains?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	regex?: string | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on an ID field */
["IDOperators"]: {
	eq?: string | undefined,
	notEq?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on a Boolean field */
["BooleanOperators"]: {
	eq?: boolean | undefined,
	isNull?: boolean | undefined
};
	["NumberRange"]: {
	start: number,
	end: number
};
	/** Operators for filtering on a Int or Float field */
["NumberOperators"]: {
	eq?: number | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	between?: ModelTypes["NumberRange"] | undefined,
	isNull?: boolean | undefined
};
	["DateRange"]: {
	start: ModelTypes["DateTime"],
	end: ModelTypes["DateTime"]
};
	/** Operators for filtering on a DateTime field */
["DateOperators"]: {
	eq?: ModelTypes["DateTime"] | undefined,
	before?: ModelTypes["DateTime"] | undefined,
	after?: ModelTypes["DateTime"] | undefined,
	between?: ModelTypes["DateRange"] | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on a list of String fields */
["StringListOperators"]: {
	inList: string
};
	/** Operators for filtering on a list of Number fields */
["NumberListOperators"]: {
	inList: number
};
	/** Operators for filtering on a list of Boolean fields */
["BooleanListOperators"]: {
	inList: boolean
};
	/** Operators for filtering on a list of ID fields */
["IDListOperators"]: {
	inList: string
};
	/** Operators for filtering on a list of Date fields */
["DateListOperators"]: {
	inList: ModelTypes["DateTime"]
};
	/** Used to construct boolean expressions for filtering search results
by FacetValue ID. Examples:

* ID=1 OR ID=2: `{ facetValueFilters: [{ or: [1,2] }] }`
* ID=1 AND ID=2: `{ facetValueFilters: [{ and: 1 }, { and: 2 }] }`
* ID=1 AND (ID=2 OR ID=3): `{ facetValueFilters: [{ and: 1 }, { or: [2,3] }] }` */
["FacetValueFilterInput"]: {
	and?: string | undefined,
	or?: Array<string> | undefined
};
	["SearchInput"]: {
	term?: string | undefined,
	facetValueFilters?: Array<ModelTypes["FacetValueFilterInput"]> | undefined,
	collectionId?: string | undefined,
	collectionSlug?: string | undefined,
	groupByProduct?: boolean | undefined,
	take?: number | undefined,
	skip?: number | undefined,
	sort?: ModelTypes["SearchResultSortParameter"] | undefined,
	inStock?: boolean | undefined,
	minPrice?: number | undefined,
	maxPrice?: number | undefined
};
	["SearchResultSortParameter"]: {
	name?: ModelTypes["SortOrder"] | undefined,
	price?: ModelTypes["SortOrder"] | undefined
};
	["CreateCustomerInput"]: {
	title?: string | undefined,
	firstName: string,
	lastName: string,
	phoneNumber?: string | undefined,
	emailAddress: string,
	customFields?: ModelTypes["JSON"] | undefined
};
	/** Input used to create an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["CreateAddressInput"]: {
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1: string,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode: string,
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: ModelTypes["CreateAddressCustomFieldsInput"] | undefined
};
	/** Input used to update an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["UpdateAddressInput"]: {
	id: string,
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: ModelTypes["UpdateAddressCustomFieldsInput"] | undefined
};
	/** Indicates that an operation succeeded, where we do not want to return any more specific information. */
["Success"]: {
		success: boolean
};
	["ShippingMethodQuote"]: {
		id: string,
	price: ModelTypes["Money"],
	priceWithTax: ModelTypes["Money"],
	code: string,
	name: string,
	description: string,
	/** Any optional metadata returned by the ShippingCalculator in the ShippingCalculationResult */
	metadata?: ModelTypes["JSON"] | undefined,
	customFields?: ModelTypes["ShippingMethodCustomFields"] | undefined
};
	["PaymentMethodQuote"]: {
		id: string,
	code: string,
	name: string,
	description: string,
	isEligible: boolean,
	eligibilityMessage?: string | undefined,
	customFields?: ModelTypes["PaymentMethodCustomFields"] | undefined
};
	["UpdateOrderItemsResult"]:ModelTypes["Order"] | ModelTypes["OrderModificationError"] | ModelTypes["OrderLimitError"] | ModelTypes["NegativeQuantityError"] | ModelTypes["InsufficientStockError"];
	["RemoveOrderItemsResult"]:ModelTypes["Order"] | ModelTypes["OrderModificationError"];
	["SetOrderShippingMethodResult"]:ModelTypes["Order"] | ModelTypes["OrderModificationError"] | ModelTypes["IneligibleShippingMethodError"] | ModelTypes["NoActiveOrderError"];
	["ApplyCouponCodeResult"]:ModelTypes["Order"] | ModelTypes["CouponCodeExpiredError"] | ModelTypes["CouponCodeInvalidError"] | ModelTypes["CouponCodeLimitError"];
	["CurrencyCode"]:CurrencyCode;
	["CustomField"]: ModelTypes["StringCustomFieldConfig"] | ModelTypes["LocaleStringCustomFieldConfig"] | ModelTypes["IntCustomFieldConfig"] | ModelTypes["FloatCustomFieldConfig"] | ModelTypes["BooleanCustomFieldConfig"] | ModelTypes["DateTimeCustomFieldConfig"] | ModelTypes["RelationCustomFieldConfig"] | ModelTypes["TextCustomFieldConfig"] | ModelTypes["LocaleTextCustomFieldConfig"];
	["StringCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	length?: number | undefined,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	pattern?: string | undefined,
	options?: Array<ModelTypes["StringFieldOption"]> | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["StringFieldOption"]: {
		value: string,
	label?: Array<ModelTypes["LocalizedString"]> | undefined
};
	["LocaleStringCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	length?: number | undefined,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	pattern?: string | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["IntCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: number | undefined,
	max?: number | undefined,
	step?: number | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["FloatCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: number | undefined,
	max?: number | undefined,
	step?: number | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["BooleanCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	/** Expects the same validation formats as the `<input type="datetime-local">` HTML element.
See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#Additional_attributes */
["DateTimeCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: string | undefined,
	max?: string | undefined,
	step?: number | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["RelationCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	entity: string,
	scalarFields: Array<string>,
	ui?: ModelTypes["JSON"] | undefined
};
	["TextCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["LocaleTextCustomFieldConfig"]: {
		name: string,
	type: string,
	list: boolean,
	label?: Array<ModelTypes["LocalizedString"]> | undefined,
	description?: Array<ModelTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: ModelTypes["JSON"] | undefined
};
	["LocalizedString"]: {
		languageCode: ModelTypes["LanguageCode"],
	value: string
};
	["CustomFieldConfig"]:ModelTypes["StringCustomFieldConfig"] | ModelTypes["LocaleStringCustomFieldConfig"] | ModelTypes["IntCustomFieldConfig"] | ModelTypes["FloatCustomFieldConfig"] | ModelTypes["BooleanCustomFieldConfig"] | ModelTypes["DateTimeCustomFieldConfig"] | ModelTypes["RelationCustomFieldConfig"] | ModelTypes["TextCustomFieldConfig"] | ModelTypes["LocaleTextCustomFieldConfig"];
	["CustomerGroup"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	customers: ModelTypes["CustomerList"],
	customFields?: ModelTypes["JSON"] | undefined
};
	["CustomerList"]: {
		items: Array<ModelTypes["Customer"]>,
	totalItems: number
};
	["FacetValue"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	facet: ModelTypes["Facet"],
	facetId: string,
	name: string,
	code: string,
	translations: Array<ModelTypes["FacetValueTranslation"]>,
	customFields?: ModelTypes["FacetValueCustomFields"] | undefined
};
	["FacetValueTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	["FacetTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	["FacetList"]: {
		items: Array<ModelTypes["Facet"]>,
	totalItems: number
};
	["FacetValueListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["FacetValueSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["FacetValueFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["FacetValueList"]: {
		items: Array<ModelTypes["FacetValue"]>,
	totalItems: number
};
	["HistoryEntryType"]:HistoryEntryType;
	["HistoryEntryList"]: {
		items: Array<ModelTypes["HistoryEntry"]>,
	totalItems: number
};
	["HistoryEntryListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["HistoryEntrySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["HistoryEntryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["LanguageCode"]:LanguageCode;
	["OrderType"]:OrderType;
	/** A summary of the taxes being applied to this order, grouped
by taxRate. */
["OrderTaxSummary"]: {
		/** A description of this tax */
	description: string,
	/** The taxRate as a percentage */
	taxRate: number,
	/** The total net price of OrderLines to which this taxRate applies */
	taxBase: ModelTypes["Money"],
	/** The total tax being applied to the Order at this taxRate */
	taxTotal: ModelTypes["Money"]
};
	["OrderAddress"]: {
		fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	country?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	customFields?: ModelTypes["AddressCustomFields"] | undefined
};
	["OrderList"]: {
		items: Array<ModelTypes["Order"]>,
	totalItems: number
};
	["ShippingLine"]: {
		id: string,
	shippingMethod: ModelTypes["ShippingMethod"],
	price: ModelTypes["Money"],
	priceWithTax: ModelTypes["Money"],
	discountedPrice: ModelTypes["Money"],
	discountedPriceWithTax: ModelTypes["Money"],
	discounts: Array<ModelTypes["Discount"]>
};
	["Discount"]: {
		adjustmentSource: string,
	type: ModelTypes["AdjustmentType"],
	description: string,
	amount: ModelTypes["Money"],
	amountWithTax: ModelTypes["Money"]
};
	["OrderLine"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	productVariant: ModelTypes["ProductVariant"],
	featuredAsset?: ModelTypes["Asset"] | undefined,
	/** The price of a single unit, excluding tax and discounts */
	unitPrice: ModelTypes["Money"],
	/** The price of a single unit, including tax but excluding discounts */
	unitPriceWithTax: ModelTypes["Money"],
	/** Non-zero if the unitPrice has changed since it was initially added to Order */
	unitPriceChangeSinceAdded: ModelTypes["Money"],
	/** Non-zero if the unitPriceWithTax has changed since it was initially added to Order */
	unitPriceWithTaxChangeSinceAdded: ModelTypes["Money"],
	/** The price of a single unit including discounts, excluding tax.

If Order-level discounts have been applied, this will not be the
actual taxable unit price (see `proratedUnitPrice`), but is generally the
correct price to display to customers to avoid confusion
about the internal handling of distributed Order-level discounts. */
	discountedUnitPrice: ModelTypes["Money"],
	/** The price of a single unit including discounts and tax */
	discountedUnitPriceWithTax: ModelTypes["Money"],
	/** The actual unit price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderItem, and is used in tax
and refund calculations. */
	proratedUnitPrice: ModelTypes["Money"],
	/** The proratedUnitPrice including tax */
	proratedUnitPriceWithTax: ModelTypes["Money"],
	/** The quantity of items purchased */
	quantity: number,
	/** The quantity at the time the Order was placed */
	orderPlacedQuantity: number,
	taxRate: number,
	/** The total price of the line excluding tax and discounts. */
	linePrice: ModelTypes["Money"],
	/** The total price of the line including tax but excluding discounts. */
	linePriceWithTax: ModelTypes["Money"],
	/** The price of the line including discounts, excluding tax */
	discountedLinePrice: ModelTypes["Money"],
	/** The price of the line including discounts and tax */
	discountedLinePriceWithTax: ModelTypes["Money"],
	/** The actual line price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderLine, and is used in tax
and refund calculations. */
	proratedLinePrice: ModelTypes["Money"],
	/** The proratedLinePrice including tax */
	proratedLinePriceWithTax: ModelTypes["Money"],
	/** The total tax on this line */
	lineTax: ModelTypes["Money"],
	discounts: Array<ModelTypes["Discount"]>,
	taxLines: Array<ModelTypes["TaxLine"]>,
	order: ModelTypes["Order"],
	fulfillmentLines?: Array<ModelTypes["FulfillmentLine"]> | undefined,
	customFields?: ModelTypes["OrderLineCustomFields"] | undefined
};
	["RefundLine"]: {
		orderLine: ModelTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	refund: ModelTypes["Refund"],
	refundId: string
};
	["Refund"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	items: ModelTypes["Money"],
	shipping: ModelTypes["Money"],
	adjustment: ModelTypes["Money"],
	total: ModelTypes["Money"],
	method?: string | undefined,
	state: string,
	transactionId?: string | undefined,
	reason?: string | undefined,
	lines: Array<ModelTypes["RefundLine"]>,
	paymentId: string,
	metadata?: ModelTypes["JSON"] | undefined
};
	["FulfillmentLine"]: {
		orderLine: ModelTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	fulfillment: ModelTypes["Fulfillment"],
	fulfillmentId: string
};
	["Surcharge"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	description: string,
	sku?: string | undefined,
	taxLines: Array<ModelTypes["TaxLine"]>,
	price: ModelTypes["Money"],
	priceWithTax: ModelTypes["Money"],
	taxRate: number
};
	["PaymentMethod"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	code: string,
	description: string,
	enabled: boolean,
	checker?: ModelTypes["ConfigurableOperation"] | undefined,
	handler: ModelTypes["ConfigurableOperation"],
	translations: Array<ModelTypes["PaymentMethodTranslation"]>,
	customFields?: ModelTypes["PaymentMethodCustomFields"] | undefined
};
	["PaymentMethodTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	description: string,
	customFields?: ModelTypes["PaymentMethodTranslationCustomFields"] | undefined
};
	["ProductOptionGroup"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	code: string,
	name: string,
	options: Array<ModelTypes["ProductOption"]>,
	translations: Array<ModelTypes["ProductOptionGroupTranslation"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ProductOptionGroupTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	["ProductOption"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	code: string,
	name: string,
	groupId: string,
	group: ModelTypes["ProductOptionGroup"],
	translations: Array<ModelTypes["ProductOptionTranslation"]>,
	customFields?: ModelTypes["ProductOptionCustomFields"] | undefined
};
	["ProductOptionTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	["SearchReindexResponse"]: {
		success: boolean
};
	["SearchResponse"]: {
		items: Array<ModelTypes["SearchResult"]>,
	totalItems: number,
	facetValues: Array<ModelTypes["FacetValueResult"]>,
	collections: Array<ModelTypes["CollectionResult"]>,
	minPrice?: number | undefined,
	maxPrice?: number | undefined
};
	/** Which FacetValues are present in the products returned
by the search, and in what quantity. */
["FacetValueResult"]: {
		facetValue: ModelTypes["FacetValue"],
	count: number
};
	/** Which Collections are present in the products returned
by the search, and in what quantity. */
["CollectionResult"]: {
		collection: ModelTypes["Collection"],
	count: number
};
	["SearchResultAsset"]: {
		id: string,
	preview: string,
	focalPoint?: ModelTypes["Coordinate"] | undefined
};
	/** The price of a search result product, either as a range or as a single price */
["SearchResultPrice"]:ModelTypes["PriceRange"] | ModelTypes["SinglePrice"];
	/** The price value where the result has a single price */
["SinglePrice"]: {
		value: ModelTypes["Money"]
};
	/** The price range where the result has more than one price */
["PriceRange"]: {
		min: ModelTypes["Money"],
	max: ModelTypes["Money"]
};
	["ProductTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: ModelTypes["ProductTranslationCustomFields"] | undefined
};
	["ProductList"]: {
		items: Array<ModelTypes["Product"]>,
	totalItems: number
};
	["ProductVariantList"]: {
		items: Array<ModelTypes["ProductVariant"]>,
	totalItems: number
};
	["ProductVariantTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	["Promotion"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	startsAt?: ModelTypes["DateTime"] | undefined,
	endsAt?: ModelTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	name: string,
	description: string,
	enabled: boolean,
	conditions: Array<ModelTypes["ConfigurableOperation"]>,
	actions: Array<ModelTypes["ConfigurableOperation"]>,
	translations: Array<ModelTypes["PromotionTranslation"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["PromotionTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	description: string
};
	["PromotionList"]: {
		items: Array<ModelTypes["Promotion"]>,
	totalItems: number
};
	["Region"]: ModelTypes["Country"] | ModelTypes["Province"];
	["RegionTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string
};
	/** A Country of the world which your shop operates in.

The `code` field is typically a 2-character ISO code such as "GB", "US", "DE" etc. This code is used in certain inputs such as
`UpdateAddressInput` and `CreateAddressInput` to specify the country. */
["Country"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	code: string,
	type: string,
	name: string,
	enabled: boolean,
	parent?: ModelTypes["Region"] | undefined,
	parentId?: string | undefined,
	translations: Array<ModelTypes["RegionTranslation"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["CountryList"]: {
		items: Array<ModelTypes["Country"]>,
	totalItems: number
};
	["Province"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	code: string,
	type: string,
	name: string,
	enabled: boolean,
	parent?: ModelTypes["Region"] | undefined,
	parentId?: string | undefined,
	translations: Array<ModelTypes["RegionTranslation"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ProvinceList"]: {
		items: Array<ModelTypes["Province"]>,
	totalItems: number
};
	["Role"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	code: string,
	description: string,
	permissions: Array<ModelTypes["Permission"]>,
	channels: Array<ModelTypes["Channel"]>
};
	["RoleList"]: {
		items: Array<ModelTypes["Role"]>,
	totalItems: number
};
	["Seller"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	customFields?: ModelTypes["JSON"] | undefined
};
	["ShippingMethod"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	code: string,
	name: string,
	description: string,
	fulfillmentHandlerCode: string,
	checker: ModelTypes["ConfigurableOperation"],
	calculator: ModelTypes["ConfigurableOperation"],
	translations: Array<ModelTypes["ShippingMethodTranslation"]>,
	customFields?: ModelTypes["ShippingMethodCustomFields"] | undefined
};
	["ShippingMethodTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	name: string,
	description: string,
	customFields?: ModelTypes["ShippingMethodTranslationCustomFields"] | undefined
};
	["ShippingMethodList"]: {
		items: Array<ModelTypes["ShippingMethod"]>,
	totalItems: number
};
	["Tag"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	value: string
};
	["TagList"]: {
		items: Array<ModelTypes["Tag"]>,
	totalItems: number
};
	["TaxCategory"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	isDefault: boolean,
	customFields?: ModelTypes["JSON"] | undefined
};
	["TaxRate"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	enabled: boolean,
	value: number,
	category: ModelTypes["TaxCategory"],
	zone: ModelTypes["Zone"],
	customerGroup?: ModelTypes["CustomerGroup"] | undefined,
	customFields?: ModelTypes["JSON"] | undefined
};
	["TaxRateList"]: {
		items: Array<ModelTypes["TaxRate"]>,
	totalItems: number
};
	["User"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	identifier: string,
	verified: boolean,
	roles: Array<ModelTypes["Role"]>,
	lastLogin?: ModelTypes["DateTime"] | undefined,
	authenticationMethods: Array<ModelTypes["AuthenticationMethod"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["AuthenticationMethod"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	strategy: string
};
	["Zone"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	members: Array<ModelTypes["Region"]>,
	customFields?: ModelTypes["JSON"] | undefined
};
	["MetricSummary"]: {
		interval: ModelTypes["MetricInterval"],
	type: ModelTypes["MetricType"],
	title: string,
	entries: Array<ModelTypes["MetricSummaryEntry"]>
};
	["MetricInterval"]:MetricInterval;
	["MetricType"]:MetricType;
	["MetricSummaryEntry"]: {
		label: string,
	value: number
};
	["MetricSummaryInput"]: {
	interval: ModelTypes["MetricInterval"],
	types: Array<ModelTypes["MetricType"]>,
	refresh?: boolean | undefined
};
	["PageType"]:PageType;
	["Author"]: {
		firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined
};
	["Page"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	type: ModelTypes["PageType"],
	content?: string | undefined,
	title?: string | undefined,
	description?: string | undefined,
	slug?: string | undefined,
	asset?: ModelTypes["Asset"] | undefined,
	position?: number | undefined,
	enabled?: boolean | undefined,
	author?: ModelTypes["Author"] | undefined,
	translations: Array<ModelTypes["PageTranslation"]>
};
	["PageTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	content: string,
	description: string,
	title: string,
	slug: string,
	tags?: string | undefined
};
	["PageList"]: {
		items: Array<ModelTypes["Page"]>,
	totalItems: number
};
	["PageListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["PageSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["PageFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["PageTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	content: string,
	slug: string,
	title: string,
	description: string,
	tags?: string | undefined
};
	["UpdatePageInput"]: {
	id: string,
	position?: number | undefined,
	enabled?: boolean | undefined,
	assetId?: string | undefined,
	translations?: Array<ModelTypes["PageTranslationInput"]> | undefined
};
	["CreatePageInput"]: {
	position?: number | undefined,
	enabled?: boolean | undefined,
	type: ModelTypes["PageType"],
	assetId?: string | undefined,
	authorId?: string | undefined,
	translations: Array<ModelTypes["PageTranslationInput"]>
};
	["DeletePageInput"]: {
	id: string
};
	["AnnouncementBarEntryTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	text: string,
	redirectUrl: string,
	icon: string
};
	["AnnouncementBarEntry"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	text?: string | undefined,
	redirectUrl?: string | undefined,
	icon?: string | undefined,
	colorIcon?: string | undefined,
	colorText?: string | undefined,
	translations: Array<ModelTypes["AnnouncementBarEntryTranslation"]>
};
	["AnnouncementBar"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	title: string,
	enabled: boolean,
	startDate: ModelTypes["DateTime"],
	endDate: ModelTypes["DateTime"],
	speed: number,
	spaceBetween: number,
	colorBackground?: string | undefined,
	nowActive?: boolean | undefined,
	entries?: Array<ModelTypes["AnnouncementBarEntry"]> | undefined
};
	["AnnouncementBarList"]: {
		items: Array<ModelTypes["AnnouncementBar"]>,
	totalItems: number
};
	["AnnouncementBarListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["AnnouncementBarSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["AnnouncementBarFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["AnnouncementBarEntryTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	text: string,
	redirectUrl: string,
	icon: string
};
	["AnnouncementBarEntryInput"]: {
	id?: string | undefined,
	colorIcon?: string | undefined,
	colorText?: string | undefined,
	translations?: Array<ModelTypes["AnnouncementBarEntryTranslationInput"]> | undefined
};
	["UpdateAnnouncementBarInput"]: {
	id: string,
	title?: string | undefined,
	enabled?: boolean | undefined,
	startDate?: ModelTypes["DateTime"] | undefined,
	endDate?: ModelTypes["DateTime"] | undefined,
	speed?: number | undefined,
	spaceBetween?: number | undefined,
	colorBackground?: string | undefined,
	entries?: Array<ModelTypes["AnnouncementBarEntryInput"]> | undefined
};
	["CreateAnnouncementBarInput"]: {
	title?: string | undefined,
	enabled?: boolean | undefined,
	startDate?: ModelTypes["DateTime"] | undefined,
	endDate?: ModelTypes["DateTime"] | undefined,
	speed?: number | undefined,
	spaceBetween?: number | undefined,
	colorBackground?: string | undefined,
	entries?: Array<ModelTypes["AnnouncementBarEntryInput"]> | undefined
};
	["DeleteAnnouncementBarInput"]: {
	id: string
};
	["ChangeStatusAnnouncementBarInput"]: {
	id: string,
	enabled: boolean
};
	["WishlistItem"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	product?: ModelTypes["Product"] | undefined,
	wishlistId: string,
	productId: string,
	minVariantPrice?: ModelTypes["Money"] | undefined,
	maxVariantPrice?: ModelTypes["Money"] | undefined
};
	["WishlistList"]: {
		items: Array<ModelTypes["WishlistItem"]>,
	totalItems: number
};
	["WishlistListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["WishlistSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["WishlistFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["Wishlist"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	currencyCode: ModelTypes["CurrencyCode"],
	entries?: ModelTypes["WishlistList"] | undefined
};
	["WishlistEntryID"]: {
		id: string,
	productId: string
};
	["WishlistIDs"]: {
		id?: string | undefined,
	entries?: Array<ModelTypes["WishlistEntryID"]> | undefined
};
	["OrderRealization"]: {
		orderID: string,
	assetID: string,
	plannedAt: string,
	finalPlannedAt?: string | undefined,
	note?: string | undefined,
	color: string,
	key?: string | undefined,
	url?: string | undefined
};
	["DiscountedPriceMetadata"]: {
		price?: number | undefined,
	name?: string | undefined,
	description?: string | undefined,
	isCustomerGroup?: boolean | undefined
};
	["DiscountedPrice"]: {
		value?: number | undefined,
	metadata?: Array<ModelTypes["DiscountedPriceMetadata"] | undefined> | undefined
};
	["ShopOrderRealization"]: {
		note?: string | undefined,
	plannedAt?: string | undefined,
	finalPlannedAt?: string | undefined
};
	["RealizationAssetInput"]: {
	id: string,
	orderLineID: string,
	preview: string
};
	["OrderRealizationInput"]: {
	orderID: string,
	assets: Array<ModelTypes["RealizationAssetInput"]>,
	plannedAt: string,
	finalPlannedAt: string,
	note: string,
	color: string
};
	["RegisterProformaInput"]: {
	orderID: string
};
	["NewsletterSubscriber"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	email: string,
	type: string,
	data?: string | undefined,
	customer?: ModelTypes["Customer"] | undefined,
	seen: boolean
};
	["BackInStockSubscriber"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	email: string,
	data?: string | undefined,
	registerToNewsletter?: boolean | undefined,
	options?: string | undefined,
	customer?: ModelTypes["Customer"] | undefined,
	variant?: ModelTypes["ProductVariant"] | undefined,
	product?: ModelTypes["Product"] | undefined,
	images?: Array<string | undefined> | undefined,
	seen: boolean
};
	["B2BSubscriber"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	name: string,
	email: string,
	NIP: string,
	city: string,
	number: string,
	message?: string | undefined,
	seen: boolean
};
	["NewsletterSubscriberList"]: {
		items: Array<ModelTypes["NewsletterSubscriber"]>,
	totalItems: number
};
	["BackInStockSubscriberList"]: {
		items: Array<ModelTypes["BackInStockSubscriber"]>,
	totalItems: number
};
	["B2BSubscriberList"]: {
		items: Array<ModelTypes["B2BSubscriber"]>,
	totalItems: number
};
	["NewsletterSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["NewsletterSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["NewsletterSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["BackInStockSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["BackInStockSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["BackInStockSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["B2BSubscriberListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["B2BSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["B2BSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["Model"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	title?: string | undefined,
	content?: string | undefined,
	url?: string | undefined,
	key: string,
	product?: ModelTypes["Product"] | undefined,
	translations: Array<ModelTypes["ModelTranslation"]>
};
	["ModelTranslation"]: {
		id: string,
	createdAt: ModelTypes["DateTime"],
	updatedAt: ModelTypes["DateTime"],
	languageCode: ModelTypes["LanguageCode"],
	title: string,
	content: string
};
	["ModelList"]: {
		items: Array<ModelTypes["Model"]>,
	totalItems: number
};
	["ModelListOptions"]: {
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: ModelTypes["ModelSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: ModelTypes["ModelFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: ModelTypes["LogicalOperator"] | undefined
};
	["ModelTranslationInput"]: {
	id?: string | undefined,
	languageCode: ModelTypes["LanguageCode"],
	title: string,
	content: string
};
	["UpdateModelInput"]: {
	id: string,
	productId?: string | undefined,
	translations?: Array<ModelTypes["ModelTranslationInput"]> | undefined
};
	["CreateModelInput"]: {
	file: ModelTypes["Upload"],
	productId?: string | undefined,
	translations: Array<ModelTypes["ModelTranslationInput"]>
};
	["DeleteModelInput"]: {
	id: string
};
	["AdministratorFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	firstName?: ModelTypes["StringOperators"] | undefined,
	lastName?: ModelTypes["StringOperators"] | undefined,
	emailAddress?: ModelTypes["StringOperators"] | undefined
};
	["AdministratorSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	firstName?: ModelTypes["SortOrder"] | undefined,
	lastName?: ModelTypes["SortOrder"] | undefined,
	emailAddress?: ModelTypes["SortOrder"] | undefined
};
	["AssetFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	fileSize?: ModelTypes["NumberOperators"] | undefined,
	mimeType?: ModelTypes["StringOperators"] | undefined,
	width?: ModelTypes["NumberOperators"] | undefined,
	height?: ModelTypes["NumberOperators"] | undefined,
	source?: ModelTypes["StringOperators"] | undefined,
	preview?: ModelTypes["StringOperators"] | undefined
};
	["AssetSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	fileSize?: ModelTypes["SortOrder"] | undefined,
	mimeType?: ModelTypes["SortOrder"] | undefined,
	width?: ModelTypes["SortOrder"] | undefined,
	height?: ModelTypes["SortOrder"] | undefined,
	source?: ModelTypes["SortOrder"] | undefined,
	preview?: ModelTypes["SortOrder"] | undefined
};
	["ChannelFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	token?: ModelTypes["StringOperators"] | undefined,
	defaultLanguageCode?: ModelTypes["StringOperators"] | undefined,
	currencyCode?: ModelTypes["StringOperators"] | undefined,
	defaultCurrencyCode?: ModelTypes["StringOperators"] | undefined,
	trackInventory?: ModelTypes["BooleanOperators"] | undefined,
	outOfStockThreshold?: ModelTypes["NumberOperators"] | undefined,
	pricesIncludeTax?: ModelTypes["BooleanOperators"] | undefined
};
	["ChannelSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	token?: ModelTypes["SortOrder"] | undefined,
	outOfStockThreshold?: ModelTypes["SortOrder"] | undefined
};
	["CollectionFilterParameter"]: {
	isPrivate?: ModelTypes["BooleanOperators"] | undefined,
	inheritFilters?: ModelTypes["BooleanOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	slug?: ModelTypes["StringOperators"] | undefined,
	position?: ModelTypes["NumberOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	parentId?: ModelTypes["IDOperators"] | undefined,
	seoTitle?: ModelTypes["StringOperators"] | undefined,
	seoDescription?: ModelTypes["StringOperators"] | undefined
};
	["CollectionSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	slug?: ModelTypes["SortOrder"] | undefined,
	position?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined,
	parentId?: ModelTypes["SortOrder"] | undefined,
	seoTitle?: ModelTypes["SortOrder"] | undefined,
	seoDescription?: ModelTypes["SortOrder"] | undefined,
	facebookImage?: ModelTypes["SortOrder"] | undefined,
	twitterImage?: ModelTypes["SortOrder"] | undefined
};
	["ProductVariantSortParameter"]: {
	stockOnHand?: ModelTypes["SortOrder"] | undefined,
	stockAllocated?: ModelTypes["SortOrder"] | undefined,
	outOfStockThreshold?: ModelTypes["SortOrder"] | undefined,
	id?: ModelTypes["SortOrder"] | undefined,
	productId?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	sku?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	price?: ModelTypes["SortOrder"] | undefined,
	priceWithTax?: ModelTypes["SortOrder"] | undefined,
	stockLevel?: ModelTypes["SortOrder"] | undefined,
	omnibusPrice?: ModelTypes["SortOrder"] | undefined
};
	["CountryFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	parentId?: ModelTypes["IDOperators"] | undefined
};
	["CountrySortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	type?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	parentId?: ModelTypes["SortOrder"] | undefined
};
	["CustomerGroupFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined
};
	["CustomerGroupSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined
};
	["CustomerSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	title?: ModelTypes["SortOrder"] | undefined,
	firstName?: ModelTypes["SortOrder"] | undefined,
	lastName?: ModelTypes["SortOrder"] | undefined,
	phoneNumber?: ModelTypes["SortOrder"] | undefined,
	emailAddress?: ModelTypes["SortOrder"] | undefined
};
	["FacetFilterParameter"]: {
	isPrivate?: ModelTypes["BooleanOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	usedForColors?: ModelTypes["BooleanOperators"] | undefined,
	usedForProductCreations?: ModelTypes["BooleanOperators"] | undefined,
	colorsCollection?: ModelTypes["BooleanOperators"] | undefined
};
	["FacetSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	usedForColors?: ModelTypes["SortOrder"] | undefined,
	usedForProductCreations?: ModelTypes["SortOrder"] | undefined,
	colorsCollection?: ModelTypes["SortOrder"] | undefined
};
	["FacetValueFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	facetId?: ModelTypes["IDOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	hexColor?: ModelTypes["StringOperators"] | undefined,
	isNew?: ModelTypes["BooleanOperators"] | undefined
};
	["FacetValueSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	facetId?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	image?: ModelTypes["SortOrder"] | undefined,
	hexColor?: ModelTypes["SortOrder"] | undefined,
	isNew?: ModelTypes["SortOrder"] | undefined
};
	["JobFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	startedAt?: ModelTypes["DateOperators"] | undefined,
	settledAt?: ModelTypes["DateOperators"] | undefined,
	queueName?: ModelTypes["StringOperators"] | undefined,
	state?: ModelTypes["StringOperators"] | undefined,
	progress?: ModelTypes["NumberOperators"] | undefined,
	isSettled?: ModelTypes["BooleanOperators"] | undefined,
	duration?: ModelTypes["NumberOperators"] | undefined,
	retries?: ModelTypes["NumberOperators"] | undefined,
	attempts?: ModelTypes["NumberOperators"] | undefined
};
	["JobSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	startedAt?: ModelTypes["SortOrder"] | undefined,
	settledAt?: ModelTypes["SortOrder"] | undefined,
	queueName?: ModelTypes["SortOrder"] | undefined,
	progress?: ModelTypes["SortOrder"] | undefined,
	duration?: ModelTypes["SortOrder"] | undefined,
	retries?: ModelTypes["SortOrder"] | undefined,
	attempts?: ModelTypes["SortOrder"] | undefined
};
	["PaymentMethodFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	modalTitle?: ModelTypes["StringOperators"] | undefined,
	modalDescription?: ModelTypes["StringOperators"] | undefined,
	modalAdditionalDescription?: ModelTypes["StringOperators"] | undefined
};
	["PaymentMethodSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined,
	modalTitle?: ModelTypes["SortOrder"] | undefined,
	modalDescription?: ModelTypes["SortOrder"] | undefined,
	modalAdditionalDescription?: ModelTypes["SortOrder"] | undefined
};
	["ProductSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	slug?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined,
	seoTitle?: ModelTypes["SortOrder"] | undefined,
	seoDescription?: ModelTypes["SortOrder"] | undefined,
	facebookImage?: ModelTypes["SortOrder"] | undefined,
	twitterImage?: ModelTypes["SortOrder"] | undefined,
	optionsOrder?: ModelTypes["SortOrder"] | undefined,
	sizes?: ModelTypes["SortOrder"] | undefined,
	finish?: ModelTypes["SortOrder"] | undefined,
	materials?: ModelTypes["SortOrder"] | undefined,
	payment?: ModelTypes["SortOrder"] | undefined,
	delivery?: ModelTypes["SortOrder"] | undefined,
	realization?: ModelTypes["SortOrder"] | undefined,
	discountBy?: ModelTypes["SortOrder"] | undefined
};
	["PromotionFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	startsAt?: ModelTypes["DateOperators"] | undefined,
	endsAt?: ModelTypes["DateOperators"] | undefined,
	couponCode?: ModelTypes["StringOperators"] | undefined,
	perCustomerUsageLimit?: ModelTypes["NumberOperators"] | undefined,
	usageLimit?: ModelTypes["NumberOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined
};
	["PromotionSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	startsAt?: ModelTypes["SortOrder"] | undefined,
	endsAt?: ModelTypes["SortOrder"] | undefined,
	couponCode?: ModelTypes["SortOrder"] | undefined,
	perCustomerUsageLimit?: ModelTypes["SortOrder"] | undefined,
	usageLimit?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined
};
	["ProvinceFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	parentId?: ModelTypes["IDOperators"] | undefined
};
	["ProvinceSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	type?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	parentId?: ModelTypes["SortOrder"] | undefined
};
	["RoleFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined
};
	["RoleSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined
};
	["SellerFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined
};
	["SellerSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined
};
	["ShippingMethodFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	languageCode?: ModelTypes["StringOperators"] | undefined,
	code?: ModelTypes["StringOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	fulfillmentHandlerCode?: ModelTypes["StringOperators"] | undefined,
	modalTitle?: ModelTypes["StringOperators"] | undefined,
	modalDescription?: ModelTypes["StringOperators"] | undefined,
	modalAdditionalDescription?: ModelTypes["StringOperators"] | undefined
};
	["ShippingMethodSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	code?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined,
	fulfillmentHandlerCode?: ModelTypes["SortOrder"] | undefined,
	modalTitle?: ModelTypes["SortOrder"] | undefined,
	modalDescription?: ModelTypes["SortOrder"] | undefined,
	modalAdditionalDescription?: ModelTypes["SortOrder"] | undefined
};
	["StockLocationFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined
};
	["StockLocationSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined
};
	["TagFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	value?: ModelTypes["StringOperators"] | undefined
};
	["TagSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	value?: ModelTypes["SortOrder"] | undefined
};
	["TaxCategoryFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	isDefault?: ModelTypes["BooleanOperators"] | undefined
};
	["TaxCategorySortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined
};
	["TaxRateFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	value?: ModelTypes["NumberOperators"] | undefined
};
	["TaxRateSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	value?: ModelTypes["SortOrder"] | undefined
};
	["ZoneFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined
};
	["ZoneSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined
};
	["PageFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	content?: ModelTypes["StringOperators"] | undefined,
	title?: ModelTypes["StringOperators"] | undefined,
	description?: ModelTypes["StringOperators"] | undefined,
	slug?: ModelTypes["StringOperators"] | undefined,
	position?: ModelTypes["NumberOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined
};
	["PageSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	content?: ModelTypes["SortOrder"] | undefined,
	title?: ModelTypes["SortOrder"] | undefined,
	description?: ModelTypes["SortOrder"] | undefined,
	slug?: ModelTypes["SortOrder"] | undefined,
	position?: ModelTypes["SortOrder"] | undefined
};
	["AnnouncementBarFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	title?: ModelTypes["StringOperators"] | undefined,
	enabled?: ModelTypes["BooleanOperators"] | undefined,
	startDate?: ModelTypes["DateOperators"] | undefined,
	endDate?: ModelTypes["DateOperators"] | undefined,
	speed?: ModelTypes["NumberOperators"] | undefined,
	spaceBetween?: ModelTypes["NumberOperators"] | undefined,
	colorBackground?: ModelTypes["StringOperators"] | undefined,
	nowActive?: ModelTypes["BooleanOperators"] | undefined
};
	["AnnouncementBarSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	title?: ModelTypes["SortOrder"] | undefined,
	startDate?: ModelTypes["SortOrder"] | undefined,
	endDate?: ModelTypes["SortOrder"] | undefined,
	speed?: ModelTypes["SortOrder"] | undefined,
	spaceBetween?: ModelTypes["SortOrder"] | undefined,
	colorBackground?: ModelTypes["SortOrder"] | undefined
};
	["WishlistFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	currencyCode?: ModelTypes["StringOperators"] | undefined
};
	["WishlistSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined
};
	["NewsletterSubscriberFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	email?: ModelTypes["StringOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined,
	data?: ModelTypes["StringOperators"] | undefined,
	seen?: ModelTypes["BooleanOperators"] | undefined
};
	["NewsletterSubscriberSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	email?: ModelTypes["SortOrder"] | undefined,
	type?: ModelTypes["SortOrder"] | undefined,
	data?: ModelTypes["SortOrder"] | undefined
};
	["BackInStockSubscriberFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	email?: ModelTypes["StringOperators"] | undefined,
	data?: ModelTypes["StringOperators"] | undefined,
	registerToNewsletter?: ModelTypes["BooleanOperators"] | undefined,
	options?: ModelTypes["StringOperators"] | undefined,
	seen?: ModelTypes["BooleanOperators"] | undefined
};
	["BackInStockSubscriberSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	email?: ModelTypes["SortOrder"] | undefined,
	data?: ModelTypes["SortOrder"] | undefined,
	options?: ModelTypes["SortOrder"] | undefined
};
	["B2BSubscriberFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	name?: ModelTypes["StringOperators"] | undefined,
	email?: ModelTypes["StringOperators"] | undefined,
	NIP?: ModelTypes["StringOperators"] | undefined,
	city?: ModelTypes["StringOperators"] | undefined,
	number?: ModelTypes["StringOperators"] | undefined,
	message?: ModelTypes["StringOperators"] | undefined,
	seen?: ModelTypes["BooleanOperators"] | undefined
};
	["B2BSubscriberSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	name?: ModelTypes["SortOrder"] | undefined,
	email?: ModelTypes["SortOrder"] | undefined,
	NIP?: ModelTypes["SortOrder"] | undefined,
	city?: ModelTypes["SortOrder"] | undefined,
	number?: ModelTypes["SortOrder"] | undefined,
	message?: ModelTypes["SortOrder"] | undefined
};
	["ModelFilterParameter"]: {
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	title?: ModelTypes["StringOperators"] | undefined,
	content?: ModelTypes["StringOperators"] | undefined,
	url?: ModelTypes["StringOperators"] | undefined,
	key?: ModelTypes["StringOperators"] | undefined
};
	["ModelSortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined,
	title?: ModelTypes["SortOrder"] | undefined,
	content?: ModelTypes["SortOrder"] | undefined,
	url?: ModelTypes["SortOrder"] | undefined,
	key?: ModelTypes["SortOrder"] | undefined
};
	["HistoryEntryFilterParameter"]: {
	isPublic?: ModelTypes["BooleanOperators"] | undefined,
	id?: ModelTypes["IDOperators"] | undefined,
	createdAt?: ModelTypes["DateOperators"] | undefined,
	updatedAt?: ModelTypes["DateOperators"] | undefined,
	type?: ModelTypes["StringOperators"] | undefined
};
	["HistoryEntrySortParameter"]: {
	id?: ModelTypes["SortOrder"] | undefined,
	createdAt?: ModelTypes["SortOrder"] | undefined,
	updatedAt?: ModelTypes["SortOrder"] | undefined
};
	["AddressCustomFields"]: {
		companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["CreateAddressCustomFieldsInput"]: {
	companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["UpdateAddressCustomFieldsInput"]: {
	companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["CollectionCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	facebookImage?: ModelTypes["Asset"] | undefined,
	twitterImage?: ModelTypes["Asset"] | undefined
};
	["CollectionTranslationCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["CreateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined,
	twitterImageId?: string | undefined
};
	["UpdateCollectionCustomFieldsInput"]: {
	facebookImageId?: string | undefined,
	twitterImageId?: string | undefined
};
	["CreateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["UpdateCollectionTranslationInputCustomFields"]: {
	seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["FacetCustomFields"]: {
		usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["CreateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["UpdateFacetCustomFieldsInput"]: {
	usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["FacetValueCustomFields"]: {
		image?: ModelTypes["Asset"] | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["CreateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["UpdateFacetValueCustomFieldsInput"]: {
	imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["OrderCustomFields"]: {
		registeredOnCheckout?: boolean | undefined,
	selectedPaymentMethod?: ModelTypes["PaymentMethod"] | undefined,
	additionalInformation?: string | undefined
};
	["UpdateOrderCustomFieldsInput"]: {
	registeredOnCheckout?: boolean | undefined,
	selectedPaymentMethodId?: string | undefined,
	additionalInformation?: string | undefined
};
	["OrderLineCustomFields"]: {
		attributes?: string | undefined,
	discountBy?: number | undefined,
	selectedImage?: ModelTypes["Asset"] | undefined
};
	["PaymentMethodCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["PaymentMethodTranslationCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["PaymentMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ProductCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	facebookImage?: ModelTypes["Asset"] | undefined,
	twitterImage?: ModelTypes["Asset"] | undefined,
	optionsOrder?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined,
	discountBy?: number | undefined
};
	["ProductTranslationCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined
};
	["CreateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined,
	twitterImageId?: string | undefined,
	optionsOrder?: string | undefined,
	discountBy?: number | undefined
};
	["UpdateProductCustomFieldsInput"]: {
	facebookImageId?: string | undefined,
	twitterImageId?: string | undefined,
	optionsOrder?: string | undefined,
	discountBy?: number | undefined
};
	["ProductTranslationInputCustomFields"]: {
	seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined
};
	["ProductOptionCustomFields"]: {
		image?: ModelTypes["Asset"] | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["CreateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["UpdateProductOptionCustomFieldsInput"]: {
	imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["ShippingMethodCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ShippingMethodTranslationCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ShippingMethodTranslationInputCustomFields"]: {
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["OrderLineCustomFieldsInput"]: {
	attributes?: string | undefined,
	discountBy?: number | undefined,
	selectedImageId?: string | undefined
};
	["NativeAuthInput"]: {
	username: string,
	password: string
};
	["CustomFields"]: {
		Address: Array<ModelTypes["CustomFieldConfig"]>,
	Administrator: Array<ModelTypes["CustomFieldConfig"]>,
	Asset: Array<ModelTypes["CustomFieldConfig"]>,
	Channel: Array<ModelTypes["CustomFieldConfig"]>,
	Collection: Array<ModelTypes["CustomFieldConfig"]>,
	Customer: Array<ModelTypes["CustomFieldConfig"]>,
	CustomerGroup: Array<ModelTypes["CustomFieldConfig"]>,
	Facet: Array<ModelTypes["CustomFieldConfig"]>,
	FacetValue: Array<ModelTypes["CustomFieldConfig"]>,
	Fulfillment: Array<ModelTypes["CustomFieldConfig"]>,
	GlobalSettings: Array<ModelTypes["CustomFieldConfig"]>,
	Order: Array<ModelTypes["CustomFieldConfig"]>,
	OrderLine: Array<ModelTypes["CustomFieldConfig"]>,
	PaymentMethod: Array<ModelTypes["CustomFieldConfig"]>,
	Product: Array<ModelTypes["CustomFieldConfig"]>,
	ProductOption: Array<ModelTypes["CustomFieldConfig"]>,
	ProductOptionGroup: Array<ModelTypes["CustomFieldConfig"]>,
	ProductVariant: Array<ModelTypes["CustomFieldConfig"]>,
	Promotion: Array<ModelTypes["CustomFieldConfig"]>,
	Region: Array<ModelTypes["CustomFieldConfig"]>,
	Seller: Array<ModelTypes["CustomFieldConfig"]>,
	ShippingMethod: Array<ModelTypes["CustomFieldConfig"]>,
	StockLocation: Array<ModelTypes["CustomFieldConfig"]>,
	TaxCategory: Array<ModelTypes["CustomFieldConfig"]>,
	TaxRate: Array<ModelTypes["CustomFieldConfig"]>,
	User: Array<ModelTypes["CustomFieldConfig"]>,
	Zone: Array<ModelTypes["CustomFieldConfig"]>
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	administrators: GraphQLTypes["AdministratorList"],
	administrator?: GraphQLTypes["Administrator"] | undefined,
	activeAdministrator?: GraphQLTypes["Administrator"] | undefined,
	/** Get a list of Assets */
	assets: GraphQLTypes["AssetList"],
	/** Get a single Asset by id */
	asset?: GraphQLTypes["Asset"] | undefined,
	me?: GraphQLTypes["CurrentUser"] | undefined,
	channels: GraphQLTypes["ChannelList"],
	channel?: GraphQLTypes["Channel"] | undefined,
	activeChannel: GraphQLTypes["Channel"],
	collections: GraphQLTypes["CollectionList"],
	/** Get a Collection either by id or slug. If neither id nor slug is specified, an error will result. */
	collection?: GraphQLTypes["Collection"] | undefined,
	collectionFilters: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	/** Used for real-time previews of the contents of a Collection */
	previewCollectionVariants: GraphQLTypes["ProductVariantList"],
	countries: GraphQLTypes["CountryList"],
	country?: GraphQLTypes["Country"] | undefined,
	customerGroups: GraphQLTypes["CustomerGroupList"],
	customerGroup?: GraphQLTypes["CustomerGroup"] | undefined,
	customers: GraphQLTypes["CustomerList"],
	customer?: GraphQLTypes["Customer"] | undefined,
	facets: GraphQLTypes["FacetList"],
	facet?: GraphQLTypes["Facet"] | undefined,
	facetValues: GraphQLTypes["FacetValueList"],
	globalSettings: GraphQLTypes["GlobalSettings"],
	job?: GraphQLTypes["Job"] | undefined,
	jobs: GraphQLTypes["JobList"],
	jobsById: Array<GraphQLTypes["Job"]>,
	jobQueues: Array<GraphQLTypes["JobQueue"]>,
	jobBufferSize: Array<GraphQLTypes["JobBufferSize"]>,
	order?: GraphQLTypes["Order"] | undefined,
	orders: GraphQLTypes["OrderList"],
	/** Returns a list of eligible shipping methods for the draft Order */
	eligibleShippingMethodsForDraftOrder: Array<GraphQLTypes["ShippingMethodQuote"]>,
	paymentMethods: GraphQLTypes["PaymentMethodList"],
	paymentMethod?: GraphQLTypes["PaymentMethod"] | undefined,
	paymentMethodEligibilityCheckers: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	paymentMethodHandlers: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	productOptionGroups: Array<GraphQLTypes["ProductOptionGroup"]>,
	productOptionGroup?: GraphQLTypes["ProductOptionGroup"] | undefined,
	search: GraphQLTypes["SearchResponse"],
	pendingSearchIndexUpdates: number,
	/** List Products */
	products: GraphQLTypes["ProductList"],
	/** Get a Product either by id or slug. If neither id nor slug is specified, an error will result. */
	product?: GraphQLTypes["Product"] | undefined,
	/** List ProductVariants either all or for the specific product. */
	productVariants: GraphQLTypes["ProductVariantList"],
	/** Get a ProductVariant by id */
	productVariant?: GraphQLTypes["ProductVariant"] | undefined,
	promotion?: GraphQLTypes["Promotion"] | undefined,
	promotions: GraphQLTypes["PromotionList"],
	promotionConditions: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	promotionActions: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	provinces: GraphQLTypes["ProvinceList"],
	province?: GraphQLTypes["Province"] | undefined,
	roles: GraphQLTypes["RoleList"],
	role?: GraphQLTypes["Role"] | undefined,
	sellers: GraphQLTypes["SellerList"],
	seller?: GraphQLTypes["Seller"] | undefined,
	shippingMethods: GraphQLTypes["ShippingMethodList"],
	shippingMethod?: GraphQLTypes["ShippingMethod"] | undefined,
	shippingEligibilityCheckers: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	shippingCalculators: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	fulfillmentHandlers: Array<GraphQLTypes["ConfigurableOperationDefinition"]>,
	testShippingMethod: GraphQLTypes["TestShippingMethodResult"],
	testEligibleShippingMethods: Array<GraphQLTypes["ShippingMethodQuote"]>,
	stockLocation?: GraphQLTypes["StockLocation"] | undefined,
	stockLocations: GraphQLTypes["StockLocationList"],
	tag: GraphQLTypes["Tag"],
	tags: GraphQLTypes["TagList"],
	taxCategories: GraphQLTypes["TaxCategoryList"],
	taxCategory?: GraphQLTypes["TaxCategory"] | undefined,
	taxRates: GraphQLTypes["TaxRateList"],
	taxRate?: GraphQLTypes["TaxRate"] | undefined,
	zones: GraphQLTypes["ZoneList"],
	zone?: GraphQLTypes["Zone"] | undefined,
	/** Get metrics for the given interval and metric types. */
	metricSummary: Array<GraphQLTypes["MetricSummary"]>,
	page?: GraphQLTypes["Page"] | undefined,
	pages: GraphQLTypes["PageList"],
	announcementBar?: GraphQLTypes["AnnouncementBar"] | undefined,
	announcementBars: GraphQLTypes["AnnouncementBarList"],
	getActiveAnnouncementBar?: GraphQLTypes["AnnouncementBar"] | undefined,
	wishlist?: GraphQLTypes["Wishlist"] | undefined,
	wishlists: GraphQLTypes["WishlistList"],
	mostWishedProducts: GraphQLTypes["ProductList"],
	getRealizationURL?: string | undefined,
	getProformaURL?: string | undefined,
	newsletterSubscribers: GraphQLTypes["NewsletterSubscriberList"],
	backInStockSubscribers: GraphQLTypes["BackInStockSubscriberList"],
	b2bSubscribers: GraphQLTypes["B2BSubscriberList"],
	haveNotSeenNewsletterSubscribers: boolean,
	haveNotSeenBackInStockSubscribers: boolean,
	haveNotSeenB2BSubscribers: boolean,
	model?: GraphQLTypes["Model"] | undefined,
	models: GraphQLTypes["ModelList"]
};
	["Mutation"]: {
	__typename: "Mutation",
	/** Create a new Administrator */
	createAdministrator: GraphQLTypes["Administrator"],
	/** Update an existing Administrator */
	updateAdministrator: GraphQLTypes["Administrator"],
	/** Update the active (currently logged-in) Administrator */
	updateActiveAdministrator: GraphQLTypes["Administrator"],
	/** Delete an Administrator */
	deleteAdministrator: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Administrators */
	deleteAdministrators: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assign a Role to an Administrator */
	assignRoleToAdministrator: GraphQLTypes["Administrator"],
	/** Create a new Asset */
	createAssets: Array<GraphQLTypes["CreateAssetResult"]>,
	/** Update an existing Asset */
	updateAsset: GraphQLTypes["Asset"],
	/** Delete an Asset */
	deleteAsset: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Assets */
	deleteAssets: GraphQLTypes["DeletionResponse"],
	/** Assign assets to channel */
	assignAssetsToChannel: Array<GraphQLTypes["Asset"]>,
	/** Authenticates the user using the native authentication strategy. This mutation is an alias for `authenticate({ native: { ... }})` */
	login: GraphQLTypes["NativeAuthenticationResult"],
	/** Authenticates the user using a named authentication strategy */
	authenticate: GraphQLTypes["AuthenticationResult"],
	logout: GraphQLTypes["Success"],
	/** Create a new Channel */
	createChannel: GraphQLTypes["CreateChannelResult"],
	/** Update an existing Channel */
	updateChannel: GraphQLTypes["UpdateChannelResult"],
	/** Delete a Channel */
	deleteChannel: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Channels */
	deleteChannels: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new Collection */
	createCollection: GraphQLTypes["Collection"],
	/** Update an existing Collection */
	updateCollection: GraphQLTypes["Collection"],
	/** Delete a Collection and all of its descendants */
	deleteCollection: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Collections and all of their descendants */
	deleteCollections: Array<GraphQLTypes["DeletionResponse"]>,
	/** Move a Collection to a different parent or index */
	moveCollection: GraphQLTypes["Collection"],
	/** Assigns Collections to the specified Channel */
	assignCollectionsToChannel: Array<GraphQLTypes["Collection"]>,
	/** Removes Collections from the specified Channel */
	removeCollectionsFromChannel: Array<GraphQLTypes["Collection"]>,
	/** Create a new Country */
	createCountry: GraphQLTypes["Country"],
	/** Update an existing Country */
	updateCountry: GraphQLTypes["Country"],
	/** Delete a Country */
	deleteCountry: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Countries */
	deleteCountries: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new CustomerGroup */
	createCustomerGroup: GraphQLTypes["CustomerGroup"],
	/** Update an existing CustomerGroup */
	updateCustomerGroup: GraphQLTypes["CustomerGroup"],
	/** Delete a CustomerGroup */
	deleteCustomerGroup: GraphQLTypes["DeletionResponse"],
	/** Delete multiple CustomerGroups */
	deleteCustomerGroups: Array<GraphQLTypes["DeletionResponse"]>,
	/** Add Customers to a CustomerGroup */
	addCustomersToGroup: GraphQLTypes["CustomerGroup"],
	/** Remove Customers from a CustomerGroup */
	removeCustomersFromGroup: GraphQLTypes["CustomerGroup"],
	/** Create a new Customer. If a password is provided, a new User will also be created an linked to the Customer. */
	createCustomer: GraphQLTypes["CreateCustomerResult"],
	/** Update an existing Customer */
	updateCustomer: GraphQLTypes["UpdateCustomerResult"],
	/** Delete a Customer */
	deleteCustomer: GraphQLTypes["DeletionResponse"],
	/** Deletes Customers */
	deleteCustomers: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new Address and associate it with the Customer specified by customerId */
	createCustomerAddress: GraphQLTypes["Address"],
	/** Update an existing Address */
	updateCustomerAddress: GraphQLTypes["Address"],
	/** Update an existing Address */
	deleteCustomerAddress: GraphQLTypes["Success"],
	addNoteToCustomer: GraphQLTypes["Customer"],
	updateCustomerNote: GraphQLTypes["HistoryEntry"],
	deleteCustomerNote: GraphQLTypes["DeletionResponse"],
	/** Create a new Facet */
	createFacet: GraphQLTypes["Facet"],
	/** Update an existing Facet */
	updateFacet: GraphQLTypes["Facet"],
	/** Delete an existing Facet */
	deleteFacet: GraphQLTypes["DeletionResponse"],
	/** Delete multiple existing Facets */
	deleteFacets: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create one or more FacetValues */
	createFacetValues: Array<GraphQLTypes["FacetValue"]>,
	/** Update one or more FacetValues */
	updateFacetValues: Array<GraphQLTypes["FacetValue"]>,
	/** Delete one or more FacetValues */
	deleteFacetValues: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns Facets to the specified Channel */
	assignFacetsToChannel: Array<GraphQLTypes["Facet"]>,
	/** Removes Facets from the specified Channel */
	removeFacetsFromChannel: Array<GraphQLTypes["RemoveFacetFromChannelResult"]>,
	updateGlobalSettings: GraphQLTypes["UpdateGlobalSettingsResult"],
	importProducts?: GraphQLTypes["ImportInfo"] | undefined,
	/** Remove all settled jobs in the given queues older than the given date. Returns the number of jobs deleted. */
	removeSettledJobs: number,
	cancelJob: GraphQLTypes["Job"],
	flushBufferedJobs: GraphQLTypes["Success"],
	settlePayment: GraphQLTypes["SettlePaymentResult"],
	cancelPayment: GraphQLTypes["CancelPaymentResult"],
	addFulfillmentToOrder: GraphQLTypes["AddFulfillmentToOrderResult"],
	cancelOrder: GraphQLTypes["CancelOrderResult"],
	refundOrder: GraphQLTypes["RefundOrderResult"],
	settleRefund: GraphQLTypes["SettleRefundResult"],
	addNoteToOrder: GraphQLTypes["Order"],
	updateOrderNote: GraphQLTypes["HistoryEntry"],
	deleteOrderNote: GraphQLTypes["DeletionResponse"],
	transitionOrderToState?: GraphQLTypes["TransitionOrderToStateResult"] | undefined,
	transitionFulfillmentToState: GraphQLTypes["TransitionFulfillmentToStateResult"],
	transitionPaymentToState: GraphQLTypes["TransitionPaymentToStateResult"],
	setOrderCustomFields?: GraphQLTypes["Order"] | undefined,
	/** Allows an Order to be modified after it has been completed by the Customer. The Order must first
be in the `Modifying` state. */
	modifyOrder: GraphQLTypes["ModifyOrderResult"],
	/** Used to manually create a new Payment against an Order.
This can be used by an Administrator when an Order is in the ArrangingPayment state.

It is also used when a completed Order
has been modified (using `modifyOrder`) and the price has increased. The extra payment
can then be manually arranged by the administrator, and the details used to create a new
Payment. */
	addManualPaymentToOrder: GraphQLTypes["AddManualPaymentToOrderResult"],
	/** Creates a draft Order */
	createDraftOrder: GraphQLTypes["Order"],
	/** Deletes a draft Order */
	deleteDraftOrder: GraphQLTypes["DeletionResponse"],
	/** Adds an item to the draft Order. */
	addItemToDraftOrder: GraphQLTypes["UpdateOrderItemsResult"],
	/** Adjusts a draft OrderLine. If custom fields are defined on the OrderLine entity, a third argument 'customFields' of type `OrderLineCustomFieldsInput` will be available. */
	adjustDraftOrderLine: GraphQLTypes["UpdateOrderItemsResult"],
	/** Remove an OrderLine from the draft Order */
	removeDraftOrderLine: GraphQLTypes["RemoveOrderItemsResult"],
	setCustomerForDraftOrder: GraphQLTypes["SetCustomerForDraftOrderResult"],
	/** Sets the shipping address for a draft Order */
	setDraftOrderShippingAddress: GraphQLTypes["Order"],
	/** Sets the billing address for a draft Order */
	setDraftOrderBillingAddress: GraphQLTypes["Order"],
	/** Allows any custom fields to be set for the active order */
	setDraftOrderCustomFields: GraphQLTypes["Order"],
	/** Applies the given coupon code to the draft Order */
	applyCouponCodeToDraftOrder: GraphQLTypes["ApplyCouponCodeResult"],
	/** Removes the given coupon code from the draft Order */
	removeCouponCodeFromDraftOrder?: GraphQLTypes["Order"] | undefined,
	/** Sets the shipping method by id, which can be obtained with the `eligibleShippingMethodsForDraftOrder` query */
	setDraftOrderShippingMethod: GraphQLTypes["SetOrderShippingMethodResult"],
	/** Create existing PaymentMethod */
	createPaymentMethod: GraphQLTypes["PaymentMethod"],
	/** Update an existing PaymentMethod */
	updatePaymentMethod: GraphQLTypes["PaymentMethod"],
	/** Delete a PaymentMethod */
	deletePaymentMethod: GraphQLTypes["DeletionResponse"],
	/** Delete multiple PaymentMethods */
	deletePaymentMethods: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns PaymentMethods to the specified Channel */
	assignPaymentMethodsToChannel: Array<GraphQLTypes["PaymentMethod"]>,
	/** Removes PaymentMethods from the specified Channel */
	removePaymentMethodsFromChannel: Array<GraphQLTypes["PaymentMethod"]>,
	/** Create a new ProductOptionGroup */
	createProductOptionGroup: GraphQLTypes["ProductOptionGroup"],
	/** Update an existing ProductOptionGroup */
	updateProductOptionGroup: GraphQLTypes["ProductOptionGroup"],
	/** Create a new ProductOption within a ProductOptionGroup */
	createProductOption: GraphQLTypes["ProductOption"],
	/** Create a new ProductOption within a ProductOptionGroup */
	updateProductOption: GraphQLTypes["ProductOption"],
	/** Delete a ProductOption */
	deleteProductOption: GraphQLTypes["DeletionResponse"],
	reindex: GraphQLTypes["Job"],
	runPendingSearchIndexUpdates: GraphQLTypes["Success"],
	/** Create a new Product */
	createProduct: GraphQLTypes["Product"],
	/** Update an existing Product */
	updateProduct: GraphQLTypes["Product"],
	/** Update multiple existing Products */
	updateProducts: Array<GraphQLTypes["Product"]>,
	/** Delete a Product */
	deleteProduct: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Products */
	deleteProducts: Array<GraphQLTypes["DeletionResponse"]>,
	/** Add an OptionGroup to a Product */
	addOptionGroupToProduct: GraphQLTypes["Product"],
	/** Remove an OptionGroup from a Product. If the OptionGroup is in use by any ProductVariants
the mutation will return a ProductOptionInUseError, and the OptionGroup will not be removed.
Setting the `force` argument to `true` will override this and remove the OptionGroup anyway,
as well as removing any of the group's options from the Product's ProductVariants. */
	removeOptionGroupFromProduct: GraphQLTypes["RemoveOptionGroupFromProductResult"],
	/** Create a set of ProductVariants based on the OptionGroups assigned to the given Product */
	createProductVariants: Array<GraphQLTypes["ProductVariant"] | undefined>,
	/** Update existing ProductVariants */
	updateProductVariants: Array<GraphQLTypes["ProductVariant"] | undefined>,
	/** Delete a ProductVariant */
	deleteProductVariant: GraphQLTypes["DeletionResponse"],
	/** Delete multiple ProductVariants */
	deleteProductVariants: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns all ProductVariants of Product to the specified Channel */
	assignProductsToChannel: Array<GraphQLTypes["Product"]>,
	/** Removes all ProductVariants of Product from the specified Channel */
	removeProductsFromChannel: Array<GraphQLTypes["Product"]>,
	/** Assigns ProductVariants to the specified Channel */
	assignProductVariantsToChannel: Array<GraphQLTypes["ProductVariant"]>,
	/** Removes ProductVariants from the specified Channel */
	removeProductVariantsFromChannel: Array<GraphQLTypes["ProductVariant"]>,
	createPromotion: GraphQLTypes["CreatePromotionResult"],
	updatePromotion: GraphQLTypes["UpdatePromotionResult"],
	deletePromotion: GraphQLTypes["DeletionResponse"],
	deletePromotions: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns Promotions to the specified Channel */
	assignPromotionsToChannel: Array<GraphQLTypes["Promotion"]>,
	/** Removes Promotions from the specified Channel */
	removePromotionsFromChannel: Array<GraphQLTypes["Promotion"]>,
	/** Create a new Province */
	createProvince: GraphQLTypes["Province"],
	/** Update an existing Province */
	updateProvince: GraphQLTypes["Province"],
	/** Delete a Province */
	deleteProvince: GraphQLTypes["DeletionResponse"],
	/** Create a new Role */
	createRole: GraphQLTypes["Role"],
	/** Update an existing Role */
	updateRole: GraphQLTypes["Role"],
	/** Delete an existing Role */
	deleteRole: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Roles */
	deleteRoles: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new Seller */
	createSeller: GraphQLTypes["Seller"],
	/** Update an existing Seller */
	updateSeller: GraphQLTypes["Seller"],
	/** Delete a Seller */
	deleteSeller: GraphQLTypes["DeletionResponse"],
	/** Delete multiple Sellers */
	deleteSellers: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new ShippingMethod */
	createShippingMethod: GraphQLTypes["ShippingMethod"],
	/** Update an existing ShippingMethod */
	updateShippingMethod: GraphQLTypes["ShippingMethod"],
	/** Delete a ShippingMethod */
	deleteShippingMethod: GraphQLTypes["DeletionResponse"],
	/** Delete multiple ShippingMethods */
	deleteShippingMethods: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns ShippingMethods to the specified Channel */
	assignShippingMethodsToChannel: Array<GraphQLTypes["ShippingMethod"]>,
	/** Removes ShippingMethods from the specified Channel */
	removeShippingMethodsFromChannel: Array<GraphQLTypes["ShippingMethod"]>,
	createStockLocation: GraphQLTypes["StockLocation"],
	updateStockLocation: GraphQLTypes["StockLocation"],
	deleteStockLocation: GraphQLTypes["DeletionResponse"],
	deleteStockLocations: Array<GraphQLTypes["DeletionResponse"]>,
	/** Assigns StockLocations to the specified Channel */
	assignStockLocationsToChannel: Array<GraphQLTypes["StockLocation"]>,
	/** Removes StockLocations from the specified Channel */
	removeStockLocationsFromChannel: Array<GraphQLTypes["StockLocation"]>,
	/** Create a new Tag */
	createTag: GraphQLTypes["Tag"],
	/** Update an existing Tag */
	updateTag: GraphQLTypes["Tag"],
	/** Delete an existing Tag */
	deleteTag: GraphQLTypes["DeletionResponse"],
	/** Create a new TaxCategory */
	createTaxCategory: GraphQLTypes["TaxCategory"],
	/** Update an existing TaxCategory */
	updateTaxCategory: GraphQLTypes["TaxCategory"],
	/** Deletes a TaxCategory */
	deleteTaxCategory: GraphQLTypes["DeletionResponse"],
	/** Deletes multiple TaxCategories */
	deleteTaxCategories: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new TaxRate */
	createTaxRate: GraphQLTypes["TaxRate"],
	/** Update an existing TaxRate */
	updateTaxRate: GraphQLTypes["TaxRate"],
	/** Delete a TaxRate */
	deleteTaxRate: GraphQLTypes["DeletionResponse"],
	/** Delete multiple TaxRates */
	deleteTaxRates: Array<GraphQLTypes["DeletionResponse"]>,
	/** Create a new Zone */
	createZone: GraphQLTypes["Zone"],
	/** Update an existing Zone */
	updateZone: GraphQLTypes["Zone"],
	/** Delete a Zone */
	deleteZone: GraphQLTypes["DeletionResponse"],
	/** Delete a Zone */
	deleteZones: Array<GraphQLTypes["DeletionResponse"]>,
	/** Add members to a Zone */
	addMembersToZone: GraphQLTypes["Zone"],
	/** Remove members from a Zone */
	removeMembersFromZone: GraphQLTypes["Zone"],
	updatePage: GraphQLTypes["Page"],
	createPage: GraphQLTypes["Page"],
	deletePage?: boolean | undefined,
	updateAnnouncementBar: GraphQLTypes["AnnouncementBar"],
	createAnnouncementBar: GraphQLTypes["AnnouncementBar"],
	deleteAnnouncementBar?: boolean | undefined,
	changeStatusAnnouncementBar: boolean,
	registerRealization?: GraphQLTypes["OrderRealization"] | undefined,
	registerProforma?: string | undefined,
	deleteNewsletterSubscriber: boolean,
	markNewsletterAsSeen: boolean,
	deleteBackInStockSubscriber: boolean,
	markBackInStockAsSeen: boolean,
	deleteB2BSubscriber: boolean,
	markB2BAsSeen: boolean,
	updateModel: GraphQLTypes["Model"],
	createModel: GraphQLTypes["Model"],
	deleteModel?: boolean | undefined
};
	["AdministratorListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["AdministratorSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["AdministratorFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateAdministratorInput"]: {
		firstName: string,
	lastName: string,
	emailAddress: string,
	password: string,
	roleIds: Array<string>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateAdministratorInput"]: {
		id: string,
	firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined,
	password?: string | undefined,
	roleIds?: Array<string> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateActiveAdministratorInput"]: {
		firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined,
	password?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["Administrator"]: {
	__typename: "Administrator",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	firstName: string,
	lastName: string,
	emailAddress: string,
	user: GraphQLTypes["User"],
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AdministratorList"]: {
	__typename: "AdministratorList",
	items: Array<GraphQLTypes["Administrator"]>,
	totalItems: number
};
	["MimeTypeError"]: {
	__typename: "MimeTypeError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	fileName: string,
	mimeType: string
};
	["CreateAssetResult"]:{
        	__typename:"Asset" | "MimeTypeError"
        	['...on Asset']: '__union' & GraphQLTypes["Asset"];
	['...on MimeTypeError']: '__union' & GraphQLTypes["MimeTypeError"];
};
	["AssetListOptions"]: {
		tags?: Array<string> | undefined,
	tagsOperator?: GraphQLTypes["LogicalOperator"] | undefined,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["AssetSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["AssetFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateAssetInput"]: {
		file: GraphQLTypes["Upload"],
	tags?: Array<string> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CoordinateInput"]: {
		x: number,
	y: number
};
	["DeleteAssetInput"]: {
		assetId: string,
	force?: boolean | undefined,
	deleteFromAllChannels?: boolean | undefined
};
	["DeleteAssetsInput"]: {
		assetIds: Array<string>,
	force?: boolean | undefined,
	deleteFromAllChannels?: boolean | undefined
};
	["UpdateAssetInput"]: {
		id: string,
	name?: string | undefined,
	focalPoint?: GraphQLTypes["CoordinateInput"] | undefined,
	tags?: Array<string> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AssignAssetsToChannelInput"]: {
		assetIds: Array<string>,
	channelId: string
};
	["AuthenticationInput"]: {
		native?: GraphQLTypes["NativeAuthInput"] | undefined
};
	["NativeAuthenticationResult"]:{
        	__typename:"CurrentUser" | "InvalidCredentialsError" | "NativeAuthStrategyError"
        	['...on CurrentUser']: '__union' & GraphQLTypes["CurrentUser"];
	['...on InvalidCredentialsError']: '__union' & GraphQLTypes["InvalidCredentialsError"];
	['...on NativeAuthStrategyError']: '__union' & GraphQLTypes["NativeAuthStrategyError"];
};
	["AuthenticationResult"]:{
        	__typename:"CurrentUser" | "InvalidCredentialsError"
        	['...on CurrentUser']: '__union' & GraphQLTypes["CurrentUser"];
	['...on InvalidCredentialsError']: '__union' & GraphQLTypes["InvalidCredentialsError"];
};
	["ChannelList"]: {
	__typename: "ChannelList",
	items: Array<GraphQLTypes["Channel"]>,
	totalItems: number
};
	["ChannelListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ChannelSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ChannelFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateChannelInput"]: {
		code: string,
	token: string,
	defaultLanguageCode: GraphQLTypes["LanguageCode"],
	availableLanguageCodes?: Array<GraphQLTypes["LanguageCode"]> | undefined,
	pricesIncludeTax: boolean,
	defaultCurrencyCode?: GraphQLTypes["CurrencyCode"] | undefined,
	availableCurrencyCodes?: Array<GraphQLTypes["CurrencyCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	defaultTaxZoneId: string,
	defaultShippingZoneId: string,
	sellerId?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateChannelInput"]: {
		id: string,
	code?: string | undefined,
	token?: string | undefined,
	defaultLanguageCode?: GraphQLTypes["LanguageCode"] | undefined,
	availableLanguageCodes?: Array<GraphQLTypes["LanguageCode"]> | undefined,
	pricesIncludeTax?: boolean | undefined,
	defaultCurrencyCode?: GraphQLTypes["CurrencyCode"] | undefined,
	availableCurrencyCodes?: Array<GraphQLTypes["CurrencyCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	defaultTaxZoneId?: string | undefined,
	defaultShippingZoneId?: string | undefined,
	sellerId?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	/** Returned if attempting to set a Channel's defaultLanguageCode to a language which is not enabled in GlobalSettings */
["LanguageNotAvailableError"]: {
	__typename: "LanguageNotAvailableError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	languageCode: string
};
	["CreateChannelResult"]:{
        	__typename:"Channel" | "LanguageNotAvailableError"
        	['...on Channel']: '__union' & GraphQLTypes["Channel"];
	['...on LanguageNotAvailableError']: '__union' & GraphQLTypes["LanguageNotAvailableError"];
};
	["UpdateChannelResult"]:{
        	__typename:"Channel" | "LanguageNotAvailableError"
        	['...on Channel']: '__union' & GraphQLTypes["Channel"];
	['...on LanguageNotAvailableError']: '__union' & GraphQLTypes["LanguageNotAvailableError"];
};
	["Collection"]: {
	__typename: "Collection",
	isPrivate: boolean,
	inheritFilters: boolean,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode?: GraphQLTypes["LanguageCode"] | undefined,
	name: string,
	slug: string,
	breadcrumbs: Array<GraphQLTypes["CollectionBreadcrumb"]>,
	position: number,
	description: string,
	featuredAsset?: GraphQLTypes["Asset"] | undefined,
	assets: Array<GraphQLTypes["Asset"]>,
	parent?: GraphQLTypes["Collection"] | undefined,
	parentId: string,
	children?: Array<GraphQLTypes["Collection"]> | undefined,
	filters: Array<GraphQLTypes["ConfigurableOperation"]>,
	translations: Array<GraphQLTypes["CollectionTranslation"]>,
	productVariants: GraphQLTypes["ProductVariantList"],
	customFields?: GraphQLTypes["CollectionCustomFields"] | undefined
};
	["CollectionListOptions"]: {
		topLevelOnly?: boolean | undefined,
	/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["CollectionSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["CollectionFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["MoveCollectionInput"]: {
		collectionId: string,
	parentId: string,
	index: number
};
	["CreateCollectionTranslationInput"]: {
		languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: GraphQLTypes["CreateCollectionTranslationInputCustomFields"] | undefined
};
	["UpdateCollectionTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	slug?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["UpdateCollectionTranslationInputCustomFields"] | undefined
};
	["CreateCollectionInput"]: {
		isPrivate?: boolean | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	parentId?: string | undefined,
	inheritFilters?: boolean | undefined,
	filters: Array<GraphQLTypes["ConfigurableOperationInput"]>,
	translations: Array<GraphQLTypes["CreateCollectionTranslationInput"]>,
	customFields?: GraphQLTypes["CreateCollectionCustomFieldsInput"] | undefined
};
	["PreviewCollectionVariantsInput"]: {
		parentId?: string | undefined,
	inheritFilters: boolean,
	filters: Array<GraphQLTypes["ConfigurableOperationInput"]>
};
	["UpdateCollectionInput"]: {
		id: string,
	isPrivate?: boolean | undefined,
	featuredAssetId?: string | undefined,
	parentId?: string | undefined,
	assetIds?: Array<string> | undefined,
	inheritFilters?: boolean | undefined,
	filters?: Array<GraphQLTypes["ConfigurableOperationInput"]> | undefined,
	translations?: Array<GraphQLTypes["UpdateCollectionTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["UpdateCollectionCustomFieldsInput"] | undefined
};
	["AssignCollectionsToChannelInput"]: {
		collectionIds: Array<string>,
	channelId: string
};
	["RemoveCollectionsFromChannelInput"]: {
		collectionIds: Array<string>,
	channelId: string
};
	["CountryTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateCountryInput"]: {
		code: string,
	translations: Array<GraphQLTypes["CountryTranslationInput"]>,
	enabled: boolean,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateCountryInput"]: {
		id: string,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["CountryTranslationInput"]> | undefined,
	enabled?: boolean | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CountryListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["CountrySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["CountryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["Customer"]: {
	__typename: "Customer",
	groups: Array<GraphQLTypes["CustomerGroup"]>,
	history: GraphQLTypes["HistoryEntryList"],
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	title?: string | undefined,
	firstName: string,
	lastName: string,
	phoneNumber?: string | undefined,
	emailAddress: string,
	addresses?: Array<GraphQLTypes["Address"]> | undefined,
	orders: GraphQLTypes["OrderList"],
	user?: GraphQLTypes["User"] | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CustomerGroupList"]: {
	__typename: "CustomerGroupList",
	items: Array<GraphQLTypes["CustomerGroup"]>,
	totalItems: number
};
	["CustomerGroupListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["CustomerGroupSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["CustomerGroupFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateCustomerGroupInput"]: {
		name: string,
	customerIds?: Array<string> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateCustomerGroupInput"]: {
		id: string,
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateCustomerInput"]: {
		id: string,
	title?: string | undefined,
	firstName?: string | undefined,
	lastName?: string | undefined,
	phoneNumber?: string | undefined,
	emailAddress?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CustomerFilterParameter"]: {
		postalCode?: GraphQLTypes["StringOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	title?: GraphQLTypes["StringOperators"] | undefined,
	firstName?: GraphQLTypes["StringOperators"] | undefined,
	lastName?: GraphQLTypes["StringOperators"] | undefined,
	phoneNumber?: GraphQLTypes["StringOperators"] | undefined,
	emailAddress?: GraphQLTypes["StringOperators"] | undefined
};
	["CustomerListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["CustomerSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["CustomerFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["AddNoteToCustomerInput"]: {
		id: string,
	note: string,
	isPublic: boolean
};
	["UpdateCustomerNoteInput"]: {
		noteId: string,
	note: string
};
	["CreateCustomerResult"]:{
        	__typename:"Customer" | "EmailAddressConflictError"
        	['...on Customer']: '__union' & GraphQLTypes["Customer"];
	['...on EmailAddressConflictError']: '__union' & GraphQLTypes["EmailAddressConflictError"];
};
	["UpdateCustomerResult"]:{
        	__typename:"Customer" | "EmailAddressConflictError"
        	['...on Customer']: '__union' & GraphQLTypes["Customer"];
	['...on EmailAddressConflictError']: '__union' & GraphQLTypes["EmailAddressConflictError"];
};
	["Facet"]: {
	__typename: "Facet",
	isPrivate: boolean,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	code: string,
	values: Array<GraphQLTypes["FacetValue"]>,
	/** Returns a paginated, sortable, filterable list of the Facet's values. Added in v2.1.0. */
	valueList: GraphQLTypes["FacetValueList"],
	translations: Array<GraphQLTypes["FacetTranslation"]>,
	customFields?: GraphQLTypes["FacetCustomFields"] | undefined
};
	["FacetListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["FacetSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["FacetFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["FacetTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateFacetInput"]: {
		code: string,
	isPrivate: boolean,
	translations: Array<GraphQLTypes["FacetTranslationInput"]>,
	values?: Array<GraphQLTypes["CreateFacetValueWithFacetInput"]> | undefined,
	customFields?: GraphQLTypes["CreateFacetCustomFieldsInput"] | undefined
};
	["UpdateFacetInput"]: {
		id: string,
	isPrivate?: boolean | undefined,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["FacetTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["UpdateFacetCustomFieldsInput"] | undefined
};
	["FacetValueTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateFacetValueWithFacetInput"]: {
		code: string,
	translations: Array<GraphQLTypes["FacetValueTranslationInput"]>
};
	["CreateFacetValueInput"]: {
		facetId: string,
	code: string,
	translations: Array<GraphQLTypes["FacetValueTranslationInput"]>,
	customFields?: GraphQLTypes["CreateFacetValueCustomFieldsInput"] | undefined
};
	["UpdateFacetValueInput"]: {
		id: string,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["FacetValueTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["UpdateFacetValueCustomFieldsInput"] | undefined
};
	["AssignFacetsToChannelInput"]: {
		facetIds: Array<string>,
	channelId: string
};
	["RemoveFacetsFromChannelInput"]: {
		facetIds: Array<string>,
	channelId: string,
	force?: boolean | undefined
};
	["FacetInUseError"]: {
	__typename: "FacetInUseError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	facetCode: string,
	productCount: number,
	variantCount: number
};
	["RemoveFacetFromChannelResult"]:{
        	__typename:"Facet" | "FacetInUseError"
        	['...on Facet']: '__union' & GraphQLTypes["Facet"];
	['...on FacetInUseError']: '__union' & GraphQLTypes["FacetInUseError"];
};
	["UpdateGlobalSettingsInput"]: {
		availableLanguages?: Array<GraphQLTypes["LanguageCode"]> | undefined,
	trackInventory?: boolean | undefined,
	outOfStockThreshold?: number | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	/** Returned when the default LanguageCode of a Channel is no longer found in the `availableLanguages`
of the GlobalSettings */
["ChannelDefaultLanguageError"]: {
	__typename: "ChannelDefaultLanguageError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	language: string,
	channelCode: string
};
	["UpdateGlobalSettingsResult"]:{
        	__typename:"GlobalSettings" | "ChannelDefaultLanguageError"
        	['...on GlobalSettings']: '__union' & GraphQLTypes["GlobalSettings"];
	['...on ChannelDefaultLanguageError']: '__union' & GraphQLTypes["ChannelDefaultLanguageError"];
};
	["GlobalSettings"]: {
	__typename: "GlobalSettings",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	availableLanguages: Array<GraphQLTypes["LanguageCode"]>,
	trackInventory: boolean,
	outOfStockThreshold: number,
	serverConfig: GraphQLTypes["ServerConfig"],
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["OrderProcessState"]: {
	__typename: "OrderProcessState",
	name: string,
	to: Array<string>
};
	["PermissionDefinition"]: {
	__typename: "PermissionDefinition",
	name: string,
	description: string,
	assignable: boolean
};
	["ServerConfig"]: {
	__typename: "ServerConfig",
	orderProcess: Array<GraphQLTypes["OrderProcessState"]>,
	permittedAssetTypes: Array<string>,
	permissions: Array<GraphQLTypes["PermissionDefinition"]>,
	customFieldConfig: GraphQLTypes["CustomFields"]
};
	["HistoryEntry"]: {
	__typename: "HistoryEntry",
	isPublic: boolean,
	administrator?: GraphQLTypes["Administrator"] | undefined,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	type: GraphQLTypes["HistoryEntryType"],
	data: GraphQLTypes["JSON"]
};
	["ImportInfo"]: {
	__typename: "ImportInfo",
	errors?: Array<string> | undefined,
	processed: number,
	imported: number
};
	["JobBufferSize"]: {
	__typename: "JobBufferSize",
	bufferId: string,
	size: number
};
	/** @description
The state of a Job in the JobQueue

@docsCategory common */
["JobState"]: JobState;
	["JobListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["JobSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["JobFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["JobList"]: {
	__typename: "JobList",
	items: Array<GraphQLTypes["Job"]>,
	totalItems: number
};
	["Job"]: {
	__typename: "Job",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	startedAt?: GraphQLTypes["DateTime"] | undefined,
	settledAt?: GraphQLTypes["DateTime"] | undefined,
	queueName: string,
	state: GraphQLTypes["JobState"],
	progress: number,
	data?: GraphQLTypes["JSON"] | undefined,
	result?: GraphQLTypes["JSON"] | undefined,
	error?: GraphQLTypes["JSON"] | undefined,
	isSettled: boolean,
	duration: number,
	retries: number,
	attempts: number
};
	["JobQueue"]: {
	__typename: "JobQueue",
	name: string,
	running: boolean
};
	["Order"]: {
	__typename: "Order",
	nextStates: Array<string>,
	modifications: Array<GraphQLTypes["OrderModification"]>,
	sellerOrders?: Array<GraphQLTypes["Order"]> | undefined,
	aggregateOrder?: GraphQLTypes["Order"] | undefined,
	aggregateOrderId?: string | undefined,
	channels: Array<GraphQLTypes["Channel"]>,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	type: GraphQLTypes["OrderType"],
	/** The date & time that the Order was placed, i.e. the Customer
completed the checkout and the Order is no longer "active" */
	orderPlacedAt?: GraphQLTypes["DateTime"] | undefined,
	/** A unique code for the Order */
	code: string,
	state: string,
	/** An order is active as long as the payment process has not been completed */
	active: boolean,
	customer?: GraphQLTypes["Customer"] | undefined,
	shippingAddress?: GraphQLTypes["OrderAddress"] | undefined,
	billingAddress?: GraphQLTypes["OrderAddress"] | undefined,
	lines: Array<GraphQLTypes["OrderLine"]>,
	/** Surcharges are arbitrary modifications to the Order total which are neither
ProductVariants nor discounts resulting from applied Promotions. For example,
one-off discounts based on customer interaction, or surcharges based on payment
methods. */
	surcharges: Array<GraphQLTypes["Surcharge"]>,
	discounts: Array<GraphQLTypes["Discount"]>,
	/** An array of all coupon codes applied to the Order */
	couponCodes: Array<string>,
	/** Promotions applied to the order. Only gets populated after the payment process has completed. */
	promotions: Array<GraphQLTypes["Promotion"]>,
	payments?: Array<GraphQLTypes["Payment"]> | undefined,
	fulfillments?: Array<GraphQLTypes["Fulfillment"]> | undefined,
	totalQuantity: number,
	/** The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
discounts which have been prorated (proportionally distributed) amongst the items of each OrderLine.
To get a total of all OrderLines which does not account for prorated discounts, use the
sum of `OrderLine.discountedLinePrice` values. */
	subTotal: GraphQLTypes["Money"],
	/** Same as subTotal, but inclusive of tax */
	subTotalWithTax: GraphQLTypes["Money"],
	currencyCode: GraphQLTypes["CurrencyCode"],
	shippingLines: Array<GraphQLTypes["ShippingLine"]>,
	shipping: GraphQLTypes["Money"],
	shippingWithTax: GraphQLTypes["Money"],
	/** Equal to subTotal plus shipping */
	total: GraphQLTypes["Money"],
	/** The final payable amount. Equal to subTotalWithTax plus shippingWithTax */
	totalWithTax: GraphQLTypes["Money"],
	/** A summary of the taxes being applied to this Order */
	taxSummary: Array<GraphQLTypes["OrderTaxSummary"]>,
	history: GraphQLTypes["HistoryEntryList"],
	getRealization?: GraphQLTypes["OrderRealization"] | undefined,
	getProforma?: string | undefined,
	customFields?: GraphQLTypes["OrderCustomFields"] | undefined
};
	["Fulfillment"]: {
	__typename: "Fulfillment",
	nextStates: Array<string>,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	lines: Array<GraphQLTypes["FulfillmentLine"]>,
	summary: Array<GraphQLTypes["FulfillmentLine"]>,
	state: string,
	method: string,
	trackingCode?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["Payment"]: {
	__typename: "Payment",
	nextStates: Array<string>,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	method: string,
	amount: GraphQLTypes["Money"],
	state: string,
	transactionId?: string | undefined,
	errorMessage?: string | undefined,
	refunds: Array<GraphQLTypes["Refund"]>,
	metadata?: GraphQLTypes["JSON"] | undefined
};
	["OrderModificationLine"]: {
	__typename: "OrderModificationLine",
	orderLine: GraphQLTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	modification: GraphQLTypes["OrderModification"],
	modificationId: string
};
	["OrderModification"]: {
	__typename: "OrderModification",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	priceChange: GraphQLTypes["Money"],
	note: string,
	lines: Array<GraphQLTypes["OrderModificationLine"]>,
	surcharges?: Array<GraphQLTypes["Surcharge"]> | undefined,
	payment?: GraphQLTypes["Payment"] | undefined,
	refund?: GraphQLTypes["Refund"] | undefined,
	isSettled: boolean
};
	["OrderFilterParameter"]: {
		customerLastName?: GraphQLTypes["StringOperators"] | undefined,
	transactionId?: GraphQLTypes["StringOperators"] | undefined,
	aggregateOrderId?: GraphQLTypes["IDOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	orderPlacedAt?: GraphQLTypes["DateOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	state?: GraphQLTypes["StringOperators"] | undefined,
	active?: GraphQLTypes["BooleanOperators"] | undefined,
	totalQuantity?: GraphQLTypes["NumberOperators"] | undefined,
	subTotal?: GraphQLTypes["NumberOperators"] | undefined,
	subTotalWithTax?: GraphQLTypes["NumberOperators"] | undefined,
	currencyCode?: GraphQLTypes["StringOperators"] | undefined,
	shipping?: GraphQLTypes["NumberOperators"] | undefined,
	shippingWithTax?: GraphQLTypes["NumberOperators"] | undefined,
	total?: GraphQLTypes["NumberOperators"] | undefined,
	totalWithTax?: GraphQLTypes["NumberOperators"] | undefined,
	getProforma?: GraphQLTypes["StringOperators"] | undefined,
	registeredOnCheckout?: GraphQLTypes["BooleanOperators"] | undefined,
	additionalInformation?: GraphQLTypes["StringOperators"] | undefined
};
	["OrderSortParameter"]: {
		customerLastName?: GraphQLTypes["SortOrder"] | undefined,
	transactionId?: GraphQLTypes["SortOrder"] | undefined,
	aggregateOrderId?: GraphQLTypes["SortOrder"] | undefined,
	id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	orderPlacedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	state?: GraphQLTypes["SortOrder"] | undefined,
	totalQuantity?: GraphQLTypes["SortOrder"] | undefined,
	subTotal?: GraphQLTypes["SortOrder"] | undefined,
	subTotalWithTax?: GraphQLTypes["SortOrder"] | undefined,
	shipping?: GraphQLTypes["SortOrder"] | undefined,
	shippingWithTax?: GraphQLTypes["SortOrder"] | undefined,
	total?: GraphQLTypes["SortOrder"] | undefined,
	totalWithTax?: GraphQLTypes["SortOrder"] | undefined,
	getProforma?: GraphQLTypes["SortOrder"] | undefined,
	registeredOnCheckout?: GraphQLTypes["SortOrder"] | undefined,
	selectedPaymentMethod?: GraphQLTypes["SortOrder"] | undefined,
	additionalInformation?: GraphQLTypes["SortOrder"] | undefined
};
	["OrderListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["OrderSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["OrderFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["UpdateOrderInput"]: {
		id: string,
	customFields?: GraphQLTypes["UpdateOrderCustomFieldsInput"] | undefined
};
	["FulfillOrderInput"]: {
		lines: Array<GraphQLTypes["OrderLineInput"]>,
	handler: GraphQLTypes["ConfigurableOperationInput"]
};
	["CancelOrderInput"]: {
		/** The id of the order to be cancelled */
	orderId: string,
	/** Optionally specify which OrderLines to cancel. If not provided, all OrderLines will be cancelled */
	lines?: Array<GraphQLTypes["OrderLineInput"]> | undefined,
	/** Specify whether the shipping charges should also be cancelled. Defaults to false */
	cancelShipping?: boolean | undefined,
	reason?: string | undefined
};
	["RefundOrderInput"]: {
		lines: Array<GraphQLTypes["OrderLineInput"]>,
	shipping: GraphQLTypes["Money"],
	adjustment: GraphQLTypes["Money"],
	paymentId: string,
	reason?: string | undefined
};
	["OrderLineInput"]: {
		orderLineId: string,
	quantity: number,
	customFields?: GraphQLTypes["OrderLineCustomFieldsInput"] | undefined
};
	["SettleRefundInput"]: {
		id: string,
	transactionId: string
};
	["AddNoteToOrderInput"]: {
		id: string,
	note: string,
	isPublic: boolean
};
	["UpdateOrderNoteInput"]: {
		noteId: string,
	note?: string | undefined,
	isPublic?: boolean | undefined
};
	["AdministratorPaymentInput"]: {
		paymentMethod?: string | undefined,
	metadata?: GraphQLTypes["JSON"] | undefined
};
	["AdministratorRefundInput"]: {
		paymentId: string,
	reason?: string | undefined
};
	["ModifyOrderOptions"]: {
		freezePromotions?: boolean | undefined,
	recalculateShipping?: boolean | undefined
};
	["UpdateOrderAddressInput"]: {
		fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	customFields?: GraphQLTypes["UpdateAddressCustomFieldsInput"] | undefined
};
	["ModifyOrderInput"]: {
		dryRun: boolean,
	orderId: string,
	addItems?: Array<GraphQLTypes["AddItemInput"]> | undefined,
	adjustOrderLines?: Array<GraphQLTypes["OrderLineInput"]> | undefined,
	surcharges?: Array<GraphQLTypes["SurchargeInput"]> | undefined,
	updateShippingAddress?: GraphQLTypes["UpdateOrderAddressInput"] | undefined,
	updateBillingAddress?: GraphQLTypes["UpdateOrderAddressInput"] | undefined,
	note?: string | undefined,
	refund?: GraphQLTypes["AdministratorRefundInput"] | undefined,
	options?: GraphQLTypes["ModifyOrderOptions"] | undefined,
	couponCodes?: Array<string> | undefined,
	customFields?: GraphQLTypes["UpdateOrderCustomFieldsInput"] | undefined
};
	["AddItemInput"]: {
		productVariantId: string,
	quantity: number,
	customFields?: GraphQLTypes["OrderLineCustomFieldsInput"] | undefined
};
	["SurchargeInput"]: {
		description: string,
	sku?: string | undefined,
	price: GraphQLTypes["Money"],
	priceIncludesTax: boolean,
	taxRate?: number | undefined,
	taxDescription?: string | undefined
};
	["ManualPaymentInput"]: {
		orderId: string,
	method: string,
	transactionId?: string | undefined,
	metadata?: GraphQLTypes["JSON"] | undefined
};
	["AddItemToDraftOrderInput"]: {
		productVariantId: string,
	quantity: number,
	customFields?: GraphQLTypes["OrderLineCustomFieldsInput"] | undefined
};
	["AdjustDraftOrderLineInput"]: {
		orderLineId: string,
	quantity: number,
	customFields?: GraphQLTypes["OrderLineCustomFieldsInput"] | undefined
};
	/** Returned if the Payment settlement fails */
["SettlePaymentError"]: {
	__typename: "SettlePaymentError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	paymentErrorMessage: string
};
	/** Returned if the Payment cancellation fails */
["CancelPaymentError"]: {
	__typename: "CancelPaymentError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	paymentErrorMessage: string
};
	/** Returned if no OrderLines have been specified for the operation */
["EmptyOrderLineSelectionError"]: {
	__typename: "EmptyOrderLineSelectionError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if the specified items are already part of a Fulfillment */
["ItemsAlreadyFulfilledError"]: {
	__typename: "ItemsAlreadyFulfilledError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if the specified FulfillmentHandler code is not valid */
["InvalidFulfillmentHandlerError"]: {
	__typename: "InvalidFulfillmentHandlerError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if an error is thrown in a FulfillmentHandler's createFulfillment method */
["CreateFulfillmentError"]: {
	__typename: "CreateFulfillmentError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	fulfillmentHandlerError: string
};
	/** Returned if attempting to create a Fulfillment when there is insufficient
stockOnHand of a ProductVariant to satisfy the requested quantity. */
["InsufficientStockOnHandError"]: {
	__typename: "InsufficientStockOnHandError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	productVariantId: string,
	productVariantName: string,
	stockOnHand: number
};
	/** Returned if an operation has specified OrderLines from multiple Orders */
["MultipleOrderError"]: {
	__typename: "MultipleOrderError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to cancel lines from an Order which is still active */
["CancelActiveOrderError"]: {
	__typename: "CancelActiveOrderError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	orderState: string
};
	/** Returned if an attempting to refund a Payment against OrderLines from a different Order */
["PaymentOrderMismatchError"]: {
	__typename: "PaymentOrderMismatchError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to refund an Order which is not in the expected state */
["RefundOrderStateError"]: {
	__typename: "RefundOrderStateError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	orderState: string
};
	/** Returned if an attempting to refund an Order but neither items nor shipping refund was specified */
["NothingToRefundError"]: {
	__typename: "NothingToRefundError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if an attempting to refund an OrderItem which has already been refunded */
["AlreadyRefundedError"]: {
	__typename: "AlreadyRefundedError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	refundId: string
};
	/** Returned if the specified quantity of an OrderLine is greater than the number of items in that line */
["QuantityTooGreatError"]: {
	__typename: "QuantityTooGreatError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when there is an error in transitioning the Refund state */
["RefundStateTransitionError"]: {
	__typename: "RefundStateTransitionError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when there is an error in transitioning the Payment state */
["PaymentStateTransitionError"]: {
	__typename: "PaymentStateTransitionError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when there is an error in transitioning the Fulfillment state */
["FulfillmentStateTransitionError"]: {
	__typename: "FulfillmentStateTransitionError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when attempting to modify the contents of an Order that is not in the `Modifying` state. */
["OrderModificationStateError"]: {
	__typename: "OrderModificationStateError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to specify any changes */
["NoChangesSpecifiedError"]: {
	__typename: "NoChangesSpecifiedError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to include a paymentMethod even
though the price has increased as a result of the changes. */
["PaymentMethodMissingError"]: {
	__typename: "PaymentMethodMissingError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to modifyOrder fails to include a refundPaymentId even
though the price has decreased as a result of the changes. */
["RefundPaymentIdMissingError"]: {
	__typename: "RefundPaymentIdMissingError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when a call to addManualPaymentToOrder is made but the Order
is not in the required state. */
["ManualPaymentStateError"]: {
	__typename: "ManualPaymentStateError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	["TransitionOrderToStateResult"]:{
        	__typename:"Order" | "OrderStateTransitionError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on OrderStateTransitionError']: '__union' & GraphQLTypes["OrderStateTransitionError"];
};
	["SettlePaymentResult"]:{
        	__typename:"Payment" | "SettlePaymentError" | "PaymentStateTransitionError" | "OrderStateTransitionError"
        	['...on Payment']: '__union' & GraphQLTypes["Payment"];
	['...on SettlePaymentError']: '__union' & GraphQLTypes["SettlePaymentError"];
	['...on PaymentStateTransitionError']: '__union' & GraphQLTypes["PaymentStateTransitionError"];
	['...on OrderStateTransitionError']: '__union' & GraphQLTypes["OrderStateTransitionError"];
};
	["CancelPaymentResult"]:{
        	__typename:"Payment" | "CancelPaymentError" | "PaymentStateTransitionError"
        	['...on Payment']: '__union' & GraphQLTypes["Payment"];
	['...on CancelPaymentError']: '__union' & GraphQLTypes["CancelPaymentError"];
	['...on PaymentStateTransitionError']: '__union' & GraphQLTypes["PaymentStateTransitionError"];
};
	["AddFulfillmentToOrderResult"]:{
        	__typename:"Fulfillment" | "EmptyOrderLineSelectionError" | "ItemsAlreadyFulfilledError" | "InsufficientStockOnHandError" | "InvalidFulfillmentHandlerError" | "FulfillmentStateTransitionError" | "CreateFulfillmentError"
        	['...on Fulfillment']: '__union' & GraphQLTypes["Fulfillment"];
	['...on EmptyOrderLineSelectionError']: '__union' & GraphQLTypes["EmptyOrderLineSelectionError"];
	['...on ItemsAlreadyFulfilledError']: '__union' & GraphQLTypes["ItemsAlreadyFulfilledError"];
	['...on InsufficientStockOnHandError']: '__union' & GraphQLTypes["InsufficientStockOnHandError"];
	['...on InvalidFulfillmentHandlerError']: '__union' & GraphQLTypes["InvalidFulfillmentHandlerError"];
	['...on FulfillmentStateTransitionError']: '__union' & GraphQLTypes["FulfillmentStateTransitionError"];
	['...on CreateFulfillmentError']: '__union' & GraphQLTypes["CreateFulfillmentError"];
};
	["CancelOrderResult"]:{
        	__typename:"Order" | "EmptyOrderLineSelectionError" | "QuantityTooGreatError" | "MultipleOrderError" | "CancelActiveOrderError" | "OrderStateTransitionError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on EmptyOrderLineSelectionError']: '__union' & GraphQLTypes["EmptyOrderLineSelectionError"];
	['...on QuantityTooGreatError']: '__union' & GraphQLTypes["QuantityTooGreatError"];
	['...on MultipleOrderError']: '__union' & GraphQLTypes["MultipleOrderError"];
	['...on CancelActiveOrderError']: '__union' & GraphQLTypes["CancelActiveOrderError"];
	['...on OrderStateTransitionError']: '__union' & GraphQLTypes["OrderStateTransitionError"];
};
	["RefundOrderResult"]:{
        	__typename:"Refund" | "QuantityTooGreatError" | "NothingToRefundError" | "OrderStateTransitionError" | "MultipleOrderError" | "PaymentOrderMismatchError" | "RefundOrderStateError" | "AlreadyRefundedError" | "RefundStateTransitionError"
        	['...on Refund']: '__union' & GraphQLTypes["Refund"];
	['...on QuantityTooGreatError']: '__union' & GraphQLTypes["QuantityTooGreatError"];
	['...on NothingToRefundError']: '__union' & GraphQLTypes["NothingToRefundError"];
	['...on OrderStateTransitionError']: '__union' & GraphQLTypes["OrderStateTransitionError"];
	['...on MultipleOrderError']: '__union' & GraphQLTypes["MultipleOrderError"];
	['...on PaymentOrderMismatchError']: '__union' & GraphQLTypes["PaymentOrderMismatchError"];
	['...on RefundOrderStateError']: '__union' & GraphQLTypes["RefundOrderStateError"];
	['...on AlreadyRefundedError']: '__union' & GraphQLTypes["AlreadyRefundedError"];
	['...on RefundStateTransitionError']: '__union' & GraphQLTypes["RefundStateTransitionError"];
};
	["SettleRefundResult"]:{
        	__typename:"Refund" | "RefundStateTransitionError"
        	['...on Refund']: '__union' & GraphQLTypes["Refund"];
	['...on RefundStateTransitionError']: '__union' & GraphQLTypes["RefundStateTransitionError"];
};
	["TransitionFulfillmentToStateResult"]:{
        	__typename:"Fulfillment" | "FulfillmentStateTransitionError"
        	['...on Fulfillment']: '__union' & GraphQLTypes["Fulfillment"];
	['...on FulfillmentStateTransitionError']: '__union' & GraphQLTypes["FulfillmentStateTransitionError"];
};
	["TransitionPaymentToStateResult"]:{
        	__typename:"Payment" | "PaymentStateTransitionError"
        	['...on Payment']: '__union' & GraphQLTypes["Payment"];
	['...on PaymentStateTransitionError']: '__union' & GraphQLTypes["PaymentStateTransitionError"];
};
	["ModifyOrderResult"]:{
        	__typename:"Order" | "NoChangesSpecifiedError" | "OrderModificationStateError" | "PaymentMethodMissingError" | "RefundPaymentIdMissingError" | "OrderLimitError" | "NegativeQuantityError" | "InsufficientStockError" | "CouponCodeExpiredError" | "CouponCodeInvalidError" | "CouponCodeLimitError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on NoChangesSpecifiedError']: '__union' & GraphQLTypes["NoChangesSpecifiedError"];
	['...on OrderModificationStateError']: '__union' & GraphQLTypes["OrderModificationStateError"];
	['...on PaymentMethodMissingError']: '__union' & GraphQLTypes["PaymentMethodMissingError"];
	['...on RefundPaymentIdMissingError']: '__union' & GraphQLTypes["RefundPaymentIdMissingError"];
	['...on OrderLimitError']: '__union' & GraphQLTypes["OrderLimitError"];
	['...on NegativeQuantityError']: '__union' & GraphQLTypes["NegativeQuantityError"];
	['...on InsufficientStockError']: '__union' & GraphQLTypes["InsufficientStockError"];
	['...on CouponCodeExpiredError']: '__union' & GraphQLTypes["CouponCodeExpiredError"];
	['...on CouponCodeInvalidError']: '__union' & GraphQLTypes["CouponCodeInvalidError"];
	['...on CouponCodeLimitError']: '__union' & GraphQLTypes["CouponCodeLimitError"];
};
	["AddManualPaymentToOrderResult"]:{
        	__typename:"Order" | "ManualPaymentStateError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on ManualPaymentStateError']: '__union' & GraphQLTypes["ManualPaymentStateError"];
};
	["SetCustomerForDraftOrderResult"]:{
        	__typename:"Order" | "EmailAddressConflictError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on EmailAddressConflictError']: '__union' & GraphQLTypes["EmailAddressConflictError"];
};
	["PaymentMethodList"]: {
	__typename: "PaymentMethodList",
	items: Array<GraphQLTypes["PaymentMethod"]>,
	totalItems: number
};
	["PaymentMethodListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["PaymentMethodSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["PaymentMethodFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["PaymentMethodTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["PaymentMethodTranslationInputCustomFields"] | undefined
};
	["CreatePaymentMethodInput"]: {
		code: string,
	enabled: boolean,
	checker?: GraphQLTypes["ConfigurableOperationInput"] | undefined,
	handler: GraphQLTypes["ConfigurableOperationInput"],
	translations: Array<GraphQLTypes["PaymentMethodTranslationInput"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdatePaymentMethodInput"]: {
		id: string,
	code?: string | undefined,
	enabled?: boolean | undefined,
	checker?: GraphQLTypes["ConfigurableOperationInput"] | undefined,
	handler?: GraphQLTypes["ConfigurableOperationInput"] | undefined,
	translations?: Array<GraphQLTypes["PaymentMethodTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AssignPaymentMethodsToChannelInput"]: {
		paymentMethodIds: Array<string>,
	channelId: string
};
	["RemovePaymentMethodsFromChannelInput"]: {
		paymentMethodIds: Array<string>,
	channelId: string
};
	["Product"]: {
	__typename: "Product",
	enabled: boolean,
	channels: Array<GraphQLTypes["Channel"]>,
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	featuredAsset?: GraphQLTypes["Asset"] | undefined,
	assets: Array<GraphQLTypes["Asset"]>,
	/** Returns all ProductVariants */
	variants: Array<GraphQLTypes["ProductVariant"]>,
	/** Returns a paginated, sortable, filterable list of ProductVariants */
	variantList: GraphQLTypes["ProductVariantList"],
	optionGroups: Array<GraphQLTypes["ProductOptionGroup"]>,
	facetValues: Array<GraphQLTypes["FacetValue"]>,
	translations: Array<GraphQLTypes["ProductTranslation"]>,
	collections: Array<GraphQLTypes["Collection"]>,
	customFields?: GraphQLTypes["ProductCustomFields"] | undefined
};
	["ProductVariantPrice"]: {
	__typename: "ProductVariantPrice",
	currencyCode: GraphQLTypes["CurrencyCode"],
	price: GraphQLTypes["Money"]
};
	["ProductVariant"]: {
	__typename: "ProductVariant",
	enabled: boolean,
	trackInventory: GraphQLTypes["GlobalFlag"],
	stockOnHand: number,
	stockAllocated: number,
	outOfStockThreshold: number,
	useGlobalOutOfStockThreshold: boolean,
	prices: Array<GraphQLTypes["ProductVariantPrice"]>,
	stockLevels: Array<GraphQLTypes["StockLevel"]>,
	stockMovements: GraphQLTypes["StockMovementList"],
	channels: Array<GraphQLTypes["Channel"]>,
	id: string,
	product: GraphQLTypes["Product"],
	productId: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	sku: string,
	name: string,
	featuredAsset?: GraphQLTypes["Asset"] | undefined,
	assets: Array<GraphQLTypes["Asset"]>,
	price: GraphQLTypes["Money"],
	currencyCode: GraphQLTypes["CurrencyCode"],
	priceWithTax: GraphQLTypes["Money"],
	stockLevel: string,
	taxRateApplied: GraphQLTypes["TaxRate"],
	taxCategory: GraphQLTypes["TaxCategory"],
	options: Array<GraphQLTypes["ProductOption"]>,
	facetValues: Array<GraphQLTypes["FacetValue"]>,
	translations: Array<GraphQLTypes["ProductVariantTranslation"]>,
	omnibusPrice: number,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ProductOptionGroupTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateProductOptionGroupInput"]: {
		code: string,
	translations: Array<GraphQLTypes["ProductOptionGroupTranslationInput"]>,
	options: Array<GraphQLTypes["CreateGroupOptionInput"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateProductOptionGroupInput"]: {
		id: string,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["ProductOptionGroupTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ProductOptionTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateGroupOptionInput"]: {
		code: string,
	translations: Array<GraphQLTypes["ProductOptionGroupTranslationInput"]>
};
	["CreateProductOptionInput"]: {
		productOptionGroupId: string,
	code: string,
	translations: Array<GraphQLTypes["ProductOptionGroupTranslationInput"]>,
	customFields?: GraphQLTypes["CreateProductOptionCustomFieldsInput"] | undefined
};
	["UpdateProductOptionInput"]: {
		id: string,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["ProductOptionGroupTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["UpdateProductOptionCustomFieldsInput"] | undefined
};
	["SearchResult"]: {
	__typename: "SearchResult",
	enabled: boolean,
	/** An array of ids of the Channels in which this result appears */
	channelIds: Array<string>,
	sku: string,
	slug: string,
	productId: string,
	productName: string,
	productAsset?: GraphQLTypes["SearchResultAsset"] | undefined,
	productVariantId: string,
	productVariantName: string,
	productVariantAsset?: GraphQLTypes["SearchResultAsset"] | undefined,
	price: GraphQLTypes["SearchResultPrice"],
	priceWithTax: GraphQLTypes["SearchResultPrice"],
	currencyCode: GraphQLTypes["CurrencyCode"],
	description: string,
	facetIds: Array<string>,
	facetValueIds: Array<string>,
	/** An array of ids of the Collections in which this result appears */
	collectionIds: Array<string>,
	/** A relevance score for the result. Differs between database implementations */
	score: number,
	inStock: boolean,
	omnibusPrice: number
};
	["StockMovementListOptions"]: {
		type?: GraphQLTypes["StockMovementType"] | undefined,
	skip?: number | undefined,
	take?: number | undefined
};
	["ProductListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ProductSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ProductFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["ProductFilterParameter"]: {
		facetValueId?: GraphQLTypes["IDOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	slug?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	seoTitle?: GraphQLTypes["StringOperators"] | undefined,
	seoDescription?: GraphQLTypes["StringOperators"] | undefined,
	optionsOrder?: GraphQLTypes["StringOperators"] | undefined,
	sizes?: GraphQLTypes["StringOperators"] | undefined,
	finish?: GraphQLTypes["StringOperators"] | undefined,
	materials?: GraphQLTypes["StringOperators"] | undefined,
	payment?: GraphQLTypes["StringOperators"] | undefined,
	delivery?: GraphQLTypes["StringOperators"] | undefined,
	realization?: GraphQLTypes["StringOperators"] | undefined,
	discountBy?: GraphQLTypes["NumberOperators"] | undefined
};
	["ProductVariantListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ProductVariantSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ProductVariantFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["ProductVariantFilterParameter"]: {
		facetValueId?: GraphQLTypes["IDOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	trackInventory?: GraphQLTypes["StringOperators"] | undefined,
	stockOnHand?: GraphQLTypes["NumberOperators"] | undefined,
	stockAllocated?: GraphQLTypes["NumberOperators"] | undefined,
	outOfStockThreshold?: GraphQLTypes["NumberOperators"] | undefined,
	useGlobalOutOfStockThreshold?: GraphQLTypes["BooleanOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	productId?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	sku?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	price?: GraphQLTypes["NumberOperators"] | undefined,
	currencyCode?: GraphQLTypes["StringOperators"] | undefined,
	priceWithTax?: GraphQLTypes["NumberOperators"] | undefined,
	stockLevel?: GraphQLTypes["StringOperators"] | undefined,
	omnibusPrice?: GraphQLTypes["NumberOperators"] | undefined
};
	["ProductTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	slug?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["ProductTranslationInputCustomFields"] | undefined
};
	["CreateProductInput"]: {
		featuredAssetId?: string | undefined,
	enabled?: boolean | undefined,
	assetIds?: Array<string> | undefined,
	facetValueIds?: Array<string> | undefined,
	translations: Array<GraphQLTypes["ProductTranslationInput"]>,
	customFields?: GraphQLTypes["CreateProductCustomFieldsInput"] | undefined
};
	["UpdateProductInput"]: {
		id: string,
	enabled?: boolean | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	facetValueIds?: Array<string> | undefined,
	translations?: Array<GraphQLTypes["ProductTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["UpdateProductCustomFieldsInput"] | undefined
};
	["ProductVariantTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateProductVariantOptionInput"]: {
		optionGroupId: string,
	code: string,
	translations: Array<GraphQLTypes["ProductOptionTranslationInput"]>
};
	["StockLevelInput"]: {
		stockLocationId: string,
	stockOnHand: number
};
	/** Used to set up update the price of a ProductVariant in a particular Channel.
If the `delete` flag is `true`, the price will be deleted for the given Channel. */
["ProductVariantPriceInput"]: {
		currencyCode: GraphQLTypes["CurrencyCode"],
	price: GraphQLTypes["Money"],
	delete?: boolean | undefined
};
	["CreateProductVariantInput"]: {
		productId: string,
	translations: Array<GraphQLTypes["ProductVariantTranslationInput"]>,
	facetValueIds?: Array<string> | undefined,
	sku: string,
	price?: GraphQLTypes["Money"] | undefined,
	taxCategoryId?: string | undefined,
	optionIds?: Array<string> | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	stockOnHand?: number | undefined,
	stockLevels?: Array<GraphQLTypes["StockLevelInput"]> | undefined,
	outOfStockThreshold?: number | undefined,
	useGlobalOutOfStockThreshold?: boolean | undefined,
	trackInventory?: GraphQLTypes["GlobalFlag"] | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateProductVariantInput"]: {
		id: string,
	enabled?: boolean | undefined,
	translations?: Array<GraphQLTypes["ProductVariantTranslationInput"]> | undefined,
	facetValueIds?: Array<string> | undefined,
	optionIds?: Array<string> | undefined,
	sku?: string | undefined,
	taxCategoryId?: string | undefined,
	/** Sets the price for the ProductVariant in the Channel's default currency */
	price?: GraphQLTypes["Money"] | undefined,
	/** Allows multiple prices to be set for the ProductVariant in different currencies. */
	prices?: Array<GraphQLTypes["ProductVariantPriceInput"]> | undefined,
	featuredAssetId?: string | undefined,
	assetIds?: Array<string> | undefined,
	stockOnHand?: number | undefined,
	stockLevels?: Array<GraphQLTypes["StockLevelInput"]> | undefined,
	outOfStockThreshold?: number | undefined,
	useGlobalOutOfStockThreshold?: boolean | undefined,
	trackInventory?: GraphQLTypes["GlobalFlag"] | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AssignProductsToChannelInput"]: {
		productIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined
};
	["RemoveProductsFromChannelInput"]: {
		productIds: Array<string>,
	channelId: string
};
	["AssignProductVariantsToChannelInput"]: {
		productVariantIds: Array<string>,
	channelId: string,
	priceFactor?: number | undefined
};
	["RemoveProductVariantsFromChannelInput"]: {
		productVariantIds: Array<string>,
	channelId: string
};
	["ProductOptionInUseError"]: {
	__typename: "ProductOptionInUseError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	optionGroupCode: string,
	productVariantCount: number
};
	["RemoveOptionGroupFromProductResult"]:{
        	__typename:"Product" | "ProductOptionInUseError"
        	['...on Product']: '__union' & GraphQLTypes["Product"];
	['...on ProductOptionInUseError']: '__union' & GraphQLTypes["ProductOptionInUseError"];
};
	["PromotionListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["PromotionSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["PromotionFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["PromotionTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreatePromotionInput"]: {
		enabled: boolean,
	startsAt?: GraphQLTypes["DateTime"] | undefined,
	endsAt?: GraphQLTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	conditions: Array<GraphQLTypes["ConfigurableOperationInput"]>,
	actions: Array<GraphQLTypes["ConfigurableOperationInput"]>,
	translations: Array<GraphQLTypes["PromotionTranslationInput"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdatePromotionInput"]: {
		id: string,
	enabled?: boolean | undefined,
	startsAt?: GraphQLTypes["DateTime"] | undefined,
	endsAt?: GraphQLTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	conditions?: Array<GraphQLTypes["ConfigurableOperationInput"]> | undefined,
	actions?: Array<GraphQLTypes["ConfigurableOperationInput"]> | undefined,
	translations?: Array<GraphQLTypes["PromotionTranslationInput"]> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AssignPromotionsToChannelInput"]: {
		promotionIds: Array<string>,
	channelId: string
};
	["RemovePromotionsFromChannelInput"]: {
		promotionIds: Array<string>,
	channelId: string
};
	/** Returned if a PromotionCondition has neither a couponCode nor any conditions set */
["MissingConditionsError"]: {
	__typename: "MissingConditionsError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	["CreatePromotionResult"]:{
        	__typename:"Promotion" | "MissingConditionsError"
        	['...on Promotion']: '__union' & GraphQLTypes["Promotion"];
	['...on MissingConditionsError']: '__union' & GraphQLTypes["MissingConditionsError"];
};
	["UpdatePromotionResult"]:{
        	__typename:"Promotion" | "MissingConditionsError"
        	['...on Promotion']: '__union' & GraphQLTypes["Promotion"];
	['...on MissingConditionsError']: '__union' & GraphQLTypes["MissingConditionsError"];
};
	["ProvinceTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CreateProvinceInput"]: {
		code: string,
	translations: Array<GraphQLTypes["ProvinceTranslationInput"]>,
	enabled: boolean,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateProvinceInput"]: {
		id: string,
	code?: string | undefined,
	translations?: Array<GraphQLTypes["ProvinceTranslationInput"]> | undefined,
	enabled?: boolean | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ProvinceListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ProvinceSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ProvinceFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["RoleListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["RoleSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["RoleFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateRoleInput"]: {
		code: string,
	description: string,
	permissions: Array<GraphQLTypes["Permission"]>,
	channelIds?: Array<string> | undefined
};
	["UpdateRoleInput"]: {
		id: string,
	code?: string | undefined,
	description?: string | undefined,
	permissions?: Array<GraphQLTypes["Permission"]> | undefined,
	channelIds?: Array<string> | undefined
};
	["SellerList"]: {
	__typename: "SellerList",
	items: Array<GraphQLTypes["Seller"]>,
	totalItems: number
};
	["SellerListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["SellerSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["SellerFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateSellerInput"]: {
		name: string,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateSellerInput"]: {
		id: string,
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ShippingMethodListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ShippingMethodSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ShippingMethodFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["ShippingMethodTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	name?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["ShippingMethodTranslationInputCustomFields"] | undefined
};
	["CreateShippingMethodInput"]: {
		code: string,
	fulfillmentHandler: string,
	checker: GraphQLTypes["ConfigurableOperationInput"],
	calculator: GraphQLTypes["ConfigurableOperationInput"],
	translations: Array<GraphQLTypes["ShippingMethodTranslationInput"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateShippingMethodInput"]: {
		id: string,
	code?: string | undefined,
	fulfillmentHandler?: string | undefined,
	checker?: GraphQLTypes["ConfigurableOperationInput"] | undefined,
	calculator?: GraphQLTypes["ConfigurableOperationInput"] | undefined,
	translations: Array<GraphQLTypes["ShippingMethodTranslationInput"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["TestShippingMethodInput"]: {
		checker: GraphQLTypes["ConfigurableOperationInput"],
	calculator: GraphQLTypes["ConfigurableOperationInput"],
	shippingAddress: GraphQLTypes["CreateAddressInput"],
	lines: Array<GraphQLTypes["TestShippingMethodOrderLineInput"]>
};
	["TestEligibleShippingMethodsInput"]: {
		shippingAddress: GraphQLTypes["CreateAddressInput"],
	lines: Array<GraphQLTypes["TestShippingMethodOrderLineInput"]>
};
	["TestShippingMethodOrderLineInput"]: {
		productVariantId: string,
	quantity: number
};
	["TestShippingMethodResult"]: {
	__typename: "TestShippingMethodResult",
	eligible: boolean,
	quote?: GraphQLTypes["TestShippingMethodQuote"] | undefined
};
	["TestShippingMethodQuote"]: {
	__typename: "TestShippingMethodQuote",
	price: GraphQLTypes["Money"],
	priceWithTax: GraphQLTypes["Money"],
	metadata?: GraphQLTypes["JSON"] | undefined
};
	["AssignShippingMethodsToChannelInput"]: {
		shippingMethodIds: Array<string>,
	channelId: string
};
	["RemoveShippingMethodsFromChannelInput"]: {
		shippingMethodIds: Array<string>,
	channelId: string
};
	["StockLevel"]: {
	__typename: "StockLevel",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	stockLocationId: string,
	stockOnHand: number,
	stockAllocated: number,
	stockLocation: GraphQLTypes["StockLocation"]
};
	["StockLocationListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["StockLocationSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["StockLocationFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["StockLocationList"]: {
	__typename: "StockLocationList",
	items: Array<GraphQLTypes["StockLocation"]>,
	totalItems: number
};
	["CreateStockLocationInput"]: {
		name: string,
	description?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateStockLocationInput"]: {
		id: string,
	name?: string | undefined,
	description?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["DeleteStockLocationInput"]: {
		id: string,
	transferToLocationId?: string | undefined
};
	["AssignStockLocationsToChannelInput"]: {
		stockLocationIds: Array<string>,
	channelId: string
};
	["RemoveStockLocationsFromChannelInput"]: {
		stockLocationIds: Array<string>,
	channelId: string
};
	["StockLocation"]: {
	__typename: "StockLocation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	description: string,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["StockMovementType"]: StockMovementType;
	["StockMovement"]: {
	__typename:"StockAdjustment" | "Allocation" | "Sale" | "Cancellation" | "Return" | "Release",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number
	['...on StockAdjustment']: '__union' & GraphQLTypes["StockAdjustment"];
	['...on Allocation']: '__union' & GraphQLTypes["Allocation"];
	['...on Sale']: '__union' & GraphQLTypes["Sale"];
	['...on Cancellation']: '__union' & GraphQLTypes["Cancellation"];
	['...on Return']: '__union' & GraphQLTypes["Return"];
	['...on Release']: '__union' & GraphQLTypes["Release"];
};
	["StockAdjustment"]: {
	__typename: "StockAdjustment",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number
};
	["Allocation"]: {
	__typename: "Allocation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number,
	orderLine: GraphQLTypes["OrderLine"]
};
	["Sale"]: {
	__typename: "Sale",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number
};
	["Cancellation"]: {
	__typename: "Cancellation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number,
	orderLine: GraphQLTypes["OrderLine"]
};
	["Return"]: {
	__typename: "Return",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number
};
	["Release"]: {
	__typename: "Release",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	type: GraphQLTypes["StockMovementType"],
	quantity: number
};
	["StockMovementItem"]:{
        	__typename:"StockAdjustment" | "Allocation" | "Sale" | "Cancellation" | "Return" | "Release"
        	['...on StockAdjustment']: '__union' & GraphQLTypes["StockAdjustment"];
	['...on Allocation']: '__union' & GraphQLTypes["Allocation"];
	['...on Sale']: '__union' & GraphQLTypes["Sale"];
	['...on Cancellation']: '__union' & GraphQLTypes["Cancellation"];
	['...on Return']: '__union' & GraphQLTypes["Return"];
	['...on Release']: '__union' & GraphQLTypes["Release"];
};
	["StockMovementList"]: {
	__typename: "StockMovementList",
	items: Array<GraphQLTypes["StockMovementItem"]>,
	totalItems: number
};
	["TagListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["TagSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["TagFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateTagInput"]: {
		value: string
};
	["UpdateTagInput"]: {
		id: string,
	value?: string | undefined
};
	["TaxCategoryList"]: {
	__typename: "TaxCategoryList",
	items: Array<GraphQLTypes["TaxCategory"]>,
	totalItems: number
};
	["TaxCategoryListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["TaxCategorySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["TaxCategoryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateTaxCategoryInput"]: {
		name: string,
	isDefault?: boolean | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateTaxCategoryInput"]: {
		id: string,
	name?: string | undefined,
	isDefault?: boolean | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["TaxRateListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["TaxRateSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["TaxRateFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateTaxRateInput"]: {
		name: string,
	enabled: boolean,
	value: number,
	categoryId: string,
	zoneId: string,
	customerGroupId?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateTaxRateInput"]: {
		id: string,
	name?: string | undefined,
	value?: number | undefined,
	enabled?: boolean | undefined,
	categoryId?: string | undefined,
	zoneId?: string | undefined,
	customerGroupId?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ZoneList"]: {
	__typename: "ZoneList",
	items: Array<GraphQLTypes["Zone"]>,
	totalItems: number
};
	["ZoneListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ZoneSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ZoneFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["CreateZoneInput"]: {
		name: string,
	memberIds?: Array<string> | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["UpdateZoneInput"]: {
		id: string,
	name?: string | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["Address"]: {
	__typename: "Address",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1: string,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	country: GraphQLTypes["Country"],
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: GraphQLTypes["AddressCustomFields"] | undefined
};
	["Asset"]: {
	__typename: "Asset",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	type: GraphQLTypes["AssetType"],
	fileSize: number,
	mimeType: string,
	width: number,
	height: number,
	source: string,
	preview: string,
	focalPoint?: GraphQLTypes["Coordinate"] | undefined,
	tags: Array<GraphQLTypes["Tag"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["Coordinate"]: {
	__typename: "Coordinate",
	x: number,
	y: number
};
	["AssetList"]: {
	__typename: "AssetList",
	items: Array<GraphQLTypes["Asset"]>,
	totalItems: number
};
	["AssetType"]: AssetType;
	["CurrentUser"]: {
	__typename: "CurrentUser",
	id: string,
	identifier: string,
	channels: Array<GraphQLTypes["CurrentUserChannel"]>
};
	["CurrentUserChannel"]: {
	__typename: "CurrentUserChannel",
	id: string,
	token: string,
	code: string,
	permissions: Array<GraphQLTypes["Permission"]>
};
	["Channel"]: {
	__typename: "Channel",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	code: string,
	token: string,
	defaultTaxZone?: GraphQLTypes["Zone"] | undefined,
	defaultShippingZone?: GraphQLTypes["Zone"] | undefined,
	defaultLanguageCode: GraphQLTypes["LanguageCode"],
	availableLanguageCodes?: Array<GraphQLTypes["LanguageCode"]> | undefined,
	currencyCode: GraphQLTypes["CurrencyCode"],
	defaultCurrencyCode: GraphQLTypes["CurrencyCode"],
	availableCurrencyCodes: Array<GraphQLTypes["CurrencyCode"]>,
	/** Not yet used - will be implemented in a future release. */
	trackInventory?: boolean | undefined,
	/** Not yet used - will be implemented in a future release. */
	outOfStockThreshold?: number | undefined,
	pricesIncludeTax: boolean,
	seller?: GraphQLTypes["Seller"] | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CollectionBreadcrumb"]: {
	__typename: "CollectionBreadcrumb",
	id: string,
	name: string,
	slug: string
};
	["CollectionTranslation"]: {
	__typename: "CollectionTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: GraphQLTypes["CollectionTranslationCustomFields"] | undefined
};
	["CollectionList"]: {
	__typename: "CollectionList",
	items: Array<GraphQLTypes["Collection"]>,
	totalItems: number
};
	["GlobalFlag"]: GlobalFlag;
	["AdjustmentType"]: AdjustmentType;
	["DeletionResult"]: DeletionResult;
	/** @description
Permissions for administrators and customers. Used to control access to
GraphQL resolvers via the {@link Allow} decorator.

## Understanding Permission.Owner

`Permission.Owner` is a special permission which is used in some Vendure resolvers to indicate that that resolver should only
be accessible to the "owner" of that resource.

For example, the Shop API `activeCustomer` query resolver should only return the Customer object for the "owner" of that Customer, i.e.
based on the activeUserId of the current session. As a result, the resolver code looks like this:

@example
```TypeScript
\@Query()
\@Allow(Permission.Owner)
async activeCustomer(\@Ctx() ctx: RequestContext): Promise<Customer | undefined> {
  const userId = ctx.activeUserId;
  if (userId) {
    return this.customerService.findOneByUserId(ctx, userId);
  }
}
```

Here we can see that the "ownership" must be enforced by custom logic inside the resolver. Since "ownership" cannot be defined generally
nor statically encoded at build-time, any resolvers using `Permission.Owner` **must** include logic to enforce that only the owner
of the resource has access. If not, then it is the equivalent of using `Permission.Public`.


@docsCategory common */
["Permission"]: Permission;
	["SortOrder"]: SortOrder;
	["ErrorCode"]: ErrorCode;
	["LogicalOperator"]: LogicalOperator;
	/** Returned when attempting an operation that relies on the NativeAuthStrategy, if that strategy is not configured. */
["NativeAuthStrategyError"]: {
	__typename: "NativeAuthStrategyError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned if the user authentication credentials are not valid */
["InvalidCredentialsError"]: {
	__typename: "InvalidCredentialsError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	authenticationError: string
};
	/** Returned if there is an error in transitioning the Order state */
["OrderStateTransitionError"]: {
	__typename: "OrderStateTransitionError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	transitionError: string,
	fromState: string,
	toState: string
};
	/** Returned when attempting to create a Customer with an email address already registered to an existing User. */
["EmailAddressConflictError"]: {
	__typename: "EmailAddressConflictError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to set the Customer on a guest checkout when the configured GuestCheckoutStrategy does not allow it. */
["GuestCheckoutError"]: {
	__typename: "GuestCheckoutError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	errorDetail: string
};
	/** Returned when the maximum order size limit has been reached. */
["OrderLimitError"]: {
	__typename: "OrderLimitError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	maxItems: number
};
	/** Returned when attempting to set a negative OrderLine quantity. */
["NegativeQuantityError"]: {
	__typename: "NegativeQuantityError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to add more items to the Order than are available */
["InsufficientStockError"]: {
	__typename: "InsufficientStockError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	quantityAvailable: number,
	order: GraphQLTypes["Order"]
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeInvalidError"]: {
	__typename: "CouponCodeInvalidError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	couponCode: string
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeExpiredError"]: {
	__typename: "CouponCodeExpiredError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	couponCode: string
};
	/** Returned if the provided coupon code is invalid */
["CouponCodeLimitError"]: {
	__typename: "CouponCodeLimitError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string,
	couponCode: string,
	limit: number
};
	/** Returned when attempting to modify the contents of an Order that is not in the `AddingItems` state. */
["OrderModificationError"]: {
	__typename: "OrderModificationError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when attempting to set a ShippingMethod for which the Order is not eligible */
["IneligibleShippingMethodError"]: {
	__typename: "IneligibleShippingMethodError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** Returned when invoking a mutation which depends on there being an active Order on the
current session. */
["NoActiveOrderError"]: {
	__typename: "NoActiveOrderError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
};
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
["JSON"]: "scalar" & { name: "JSON" };
	/** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
["DateTime"]: "scalar" & { name: "DateTime" };
	/** The `Upload` scalar type represents a file upload. */
["Upload"]: "scalar" & { name: "Upload" };
	/** The `Money` scalar type represents monetary values and supports signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
["Money"]: "scalar" & { name: "Money" };
	["PaginatedList"]: {
	__typename:"AdministratorList" | "ChannelList" | "CustomerGroupList" | "JobList" | "PaymentMethodList" | "SellerList" | "StockLocationList" | "TaxCategoryList" | "ZoneList" | "AssetList" | "CollectionList" | "CustomerList" | "FacetList" | "FacetValueList" | "HistoryEntryList" | "OrderList" | "ProductList" | "ProductVariantList" | "PromotionList" | "CountryList" | "ProvinceList" | "RoleList" | "ShippingMethodList" | "TagList" | "TaxRateList" | "PageList" | "AnnouncementBarList" | "WishlistList" | "NewsletterSubscriberList" | "BackInStockSubscriberList" | "B2BSubscriberList" | "ModelList",
	items: Array<GraphQLTypes["Node"]>,
	totalItems: number
	['...on AdministratorList']: '__union' & GraphQLTypes["AdministratorList"];
	['...on ChannelList']: '__union' & GraphQLTypes["ChannelList"];
	['...on CustomerGroupList']: '__union' & GraphQLTypes["CustomerGroupList"];
	['...on JobList']: '__union' & GraphQLTypes["JobList"];
	['...on PaymentMethodList']: '__union' & GraphQLTypes["PaymentMethodList"];
	['...on SellerList']: '__union' & GraphQLTypes["SellerList"];
	['...on StockLocationList']: '__union' & GraphQLTypes["StockLocationList"];
	['...on TaxCategoryList']: '__union' & GraphQLTypes["TaxCategoryList"];
	['...on ZoneList']: '__union' & GraphQLTypes["ZoneList"];
	['...on AssetList']: '__union' & GraphQLTypes["AssetList"];
	['...on CollectionList']: '__union' & GraphQLTypes["CollectionList"];
	['...on CustomerList']: '__union' & GraphQLTypes["CustomerList"];
	['...on FacetList']: '__union' & GraphQLTypes["FacetList"];
	['...on FacetValueList']: '__union' & GraphQLTypes["FacetValueList"];
	['...on HistoryEntryList']: '__union' & GraphQLTypes["HistoryEntryList"];
	['...on OrderList']: '__union' & GraphQLTypes["OrderList"];
	['...on ProductList']: '__union' & GraphQLTypes["ProductList"];
	['...on ProductVariantList']: '__union' & GraphQLTypes["ProductVariantList"];
	['...on PromotionList']: '__union' & GraphQLTypes["PromotionList"];
	['...on CountryList']: '__union' & GraphQLTypes["CountryList"];
	['...on ProvinceList']: '__union' & GraphQLTypes["ProvinceList"];
	['...on RoleList']: '__union' & GraphQLTypes["RoleList"];
	['...on ShippingMethodList']: '__union' & GraphQLTypes["ShippingMethodList"];
	['...on TagList']: '__union' & GraphQLTypes["TagList"];
	['...on TaxRateList']: '__union' & GraphQLTypes["TaxRateList"];
	['...on PageList']: '__union' & GraphQLTypes["PageList"];
	['...on AnnouncementBarList']: '__union' & GraphQLTypes["AnnouncementBarList"];
	['...on WishlistList']: '__union' & GraphQLTypes["WishlistList"];
	['...on NewsletterSubscriberList']: '__union' & GraphQLTypes["NewsletterSubscriberList"];
	['...on BackInStockSubscriberList']: '__union' & GraphQLTypes["BackInStockSubscriberList"];
	['...on B2BSubscriberList']: '__union' & GraphQLTypes["B2BSubscriberList"];
	['...on ModelList']: '__union' & GraphQLTypes["ModelList"];
};
	["Node"]: {
	__typename:"Administrator" | "Collection" | "Customer" | "Facet" | "HistoryEntry" | "Job" | "Order" | "Fulfillment" | "Payment" | "OrderModification" | "Product" | "ProductVariant" | "StockLevel" | "StockLocation" | "StockAdjustment" | "Allocation" | "Sale" | "Cancellation" | "Return" | "Release" | "Address" | "Asset" | "Channel" | "CustomerGroup" | "FacetValue" | "OrderLine" | "Refund" | "Surcharge" | "PaymentMethod" | "ProductOptionGroup" | "ProductOption" | "Promotion" | "Region" | "Country" | "Province" | "Role" | "Seller" | "ShippingMethod" | "Tag" | "TaxCategory" | "TaxRate" | "User" | "AuthenticationMethod" | "Zone" | "Page" | "AnnouncementBar" | "WishlistItem" | "Wishlist" | "NewsletterSubscriber" | "BackInStockSubscriber" | "B2BSubscriber" | "Model",
	id: string
	['...on Administrator']: '__union' & GraphQLTypes["Administrator"];
	['...on Collection']: '__union' & GraphQLTypes["Collection"];
	['...on Customer']: '__union' & GraphQLTypes["Customer"];
	['...on Facet']: '__union' & GraphQLTypes["Facet"];
	['...on HistoryEntry']: '__union' & GraphQLTypes["HistoryEntry"];
	['...on Job']: '__union' & GraphQLTypes["Job"];
	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on Fulfillment']: '__union' & GraphQLTypes["Fulfillment"];
	['...on Payment']: '__union' & GraphQLTypes["Payment"];
	['...on OrderModification']: '__union' & GraphQLTypes["OrderModification"];
	['...on Product']: '__union' & GraphQLTypes["Product"];
	['...on ProductVariant']: '__union' & GraphQLTypes["ProductVariant"];
	['...on StockLevel']: '__union' & GraphQLTypes["StockLevel"];
	['...on StockLocation']: '__union' & GraphQLTypes["StockLocation"];
	['...on StockAdjustment']: '__union' & GraphQLTypes["StockAdjustment"];
	['...on Allocation']: '__union' & GraphQLTypes["Allocation"];
	['...on Sale']: '__union' & GraphQLTypes["Sale"];
	['...on Cancellation']: '__union' & GraphQLTypes["Cancellation"];
	['...on Return']: '__union' & GraphQLTypes["Return"];
	['...on Release']: '__union' & GraphQLTypes["Release"];
	['...on Address']: '__union' & GraphQLTypes["Address"];
	['...on Asset']: '__union' & GraphQLTypes["Asset"];
	['...on Channel']: '__union' & GraphQLTypes["Channel"];
	['...on CustomerGroup']: '__union' & GraphQLTypes["CustomerGroup"];
	['...on FacetValue']: '__union' & GraphQLTypes["FacetValue"];
	['...on OrderLine']: '__union' & GraphQLTypes["OrderLine"];
	['...on Refund']: '__union' & GraphQLTypes["Refund"];
	['...on Surcharge']: '__union' & GraphQLTypes["Surcharge"];
	['...on PaymentMethod']: '__union' & GraphQLTypes["PaymentMethod"];
	['...on ProductOptionGroup']: '__union' & GraphQLTypes["ProductOptionGroup"];
	['...on ProductOption']: '__union' & GraphQLTypes["ProductOption"];
	['...on Promotion']: '__union' & GraphQLTypes["Promotion"];
	['...on Region']: '__union' & GraphQLTypes["Region"];
	['...on Country']: '__union' & GraphQLTypes["Country"];
	['...on Province']: '__union' & GraphQLTypes["Province"];
	['...on Role']: '__union' & GraphQLTypes["Role"];
	['...on Seller']: '__union' & GraphQLTypes["Seller"];
	['...on ShippingMethod']: '__union' & GraphQLTypes["ShippingMethod"];
	['...on Tag']: '__union' & GraphQLTypes["Tag"];
	['...on TaxCategory']: '__union' & GraphQLTypes["TaxCategory"];
	['...on TaxRate']: '__union' & GraphQLTypes["TaxRate"];
	['...on User']: '__union' & GraphQLTypes["User"];
	['...on AuthenticationMethod']: '__union' & GraphQLTypes["AuthenticationMethod"];
	['...on Zone']: '__union' & GraphQLTypes["Zone"];
	['...on Page']: '__union' & GraphQLTypes["Page"];
	['...on AnnouncementBar']: '__union' & GraphQLTypes["AnnouncementBar"];
	['...on WishlistItem']: '__union' & GraphQLTypes["WishlistItem"];
	['...on Wishlist']: '__union' & GraphQLTypes["Wishlist"];
	['...on NewsletterSubscriber']: '__union' & GraphQLTypes["NewsletterSubscriber"];
	['...on BackInStockSubscriber']: '__union' & GraphQLTypes["BackInStockSubscriber"];
	['...on B2BSubscriber']: '__union' & GraphQLTypes["B2BSubscriber"];
	['...on Model']: '__union' & GraphQLTypes["Model"];
};
	["ErrorResult"]: {
	__typename:"MimeTypeError" | "LanguageNotAvailableError" | "FacetInUseError" | "ChannelDefaultLanguageError" | "SettlePaymentError" | "CancelPaymentError" | "EmptyOrderLineSelectionError" | "ItemsAlreadyFulfilledError" | "InvalidFulfillmentHandlerError" | "CreateFulfillmentError" | "InsufficientStockOnHandError" | "MultipleOrderError" | "CancelActiveOrderError" | "PaymentOrderMismatchError" | "RefundOrderStateError" | "NothingToRefundError" | "AlreadyRefundedError" | "QuantityTooGreatError" | "RefundStateTransitionError" | "PaymentStateTransitionError" | "FulfillmentStateTransitionError" | "OrderModificationStateError" | "NoChangesSpecifiedError" | "PaymentMethodMissingError" | "RefundPaymentIdMissingError" | "ManualPaymentStateError" | "ProductOptionInUseError" | "MissingConditionsError" | "NativeAuthStrategyError" | "InvalidCredentialsError" | "OrderStateTransitionError" | "EmailAddressConflictError" | "GuestCheckoutError" | "OrderLimitError" | "NegativeQuantityError" | "InsufficientStockError" | "CouponCodeInvalidError" | "CouponCodeExpiredError" | "CouponCodeLimitError" | "OrderModificationError" | "IneligibleShippingMethodError" | "NoActiveOrderError",
	errorCode: GraphQLTypes["ErrorCode"],
	message: string
	['...on MimeTypeError']: '__union' & GraphQLTypes["MimeTypeError"];
	['...on LanguageNotAvailableError']: '__union' & GraphQLTypes["LanguageNotAvailableError"];
	['...on FacetInUseError']: '__union' & GraphQLTypes["FacetInUseError"];
	['...on ChannelDefaultLanguageError']: '__union' & GraphQLTypes["ChannelDefaultLanguageError"];
	['...on SettlePaymentError']: '__union' & GraphQLTypes["SettlePaymentError"];
	['...on CancelPaymentError']: '__union' & GraphQLTypes["CancelPaymentError"];
	['...on EmptyOrderLineSelectionError']: '__union' & GraphQLTypes["EmptyOrderLineSelectionError"];
	['...on ItemsAlreadyFulfilledError']: '__union' & GraphQLTypes["ItemsAlreadyFulfilledError"];
	['...on InvalidFulfillmentHandlerError']: '__union' & GraphQLTypes["InvalidFulfillmentHandlerError"];
	['...on CreateFulfillmentError']: '__union' & GraphQLTypes["CreateFulfillmentError"];
	['...on InsufficientStockOnHandError']: '__union' & GraphQLTypes["InsufficientStockOnHandError"];
	['...on MultipleOrderError']: '__union' & GraphQLTypes["MultipleOrderError"];
	['...on CancelActiveOrderError']: '__union' & GraphQLTypes["CancelActiveOrderError"];
	['...on PaymentOrderMismatchError']: '__union' & GraphQLTypes["PaymentOrderMismatchError"];
	['...on RefundOrderStateError']: '__union' & GraphQLTypes["RefundOrderStateError"];
	['...on NothingToRefundError']: '__union' & GraphQLTypes["NothingToRefundError"];
	['...on AlreadyRefundedError']: '__union' & GraphQLTypes["AlreadyRefundedError"];
	['...on QuantityTooGreatError']: '__union' & GraphQLTypes["QuantityTooGreatError"];
	['...on RefundStateTransitionError']: '__union' & GraphQLTypes["RefundStateTransitionError"];
	['...on PaymentStateTransitionError']: '__union' & GraphQLTypes["PaymentStateTransitionError"];
	['...on FulfillmentStateTransitionError']: '__union' & GraphQLTypes["FulfillmentStateTransitionError"];
	['...on OrderModificationStateError']: '__union' & GraphQLTypes["OrderModificationStateError"];
	['...on NoChangesSpecifiedError']: '__union' & GraphQLTypes["NoChangesSpecifiedError"];
	['...on PaymentMethodMissingError']: '__union' & GraphQLTypes["PaymentMethodMissingError"];
	['...on RefundPaymentIdMissingError']: '__union' & GraphQLTypes["RefundPaymentIdMissingError"];
	['...on ManualPaymentStateError']: '__union' & GraphQLTypes["ManualPaymentStateError"];
	['...on ProductOptionInUseError']: '__union' & GraphQLTypes["ProductOptionInUseError"];
	['...on MissingConditionsError']: '__union' & GraphQLTypes["MissingConditionsError"];
	['...on NativeAuthStrategyError']: '__union' & GraphQLTypes["NativeAuthStrategyError"];
	['...on InvalidCredentialsError']: '__union' & GraphQLTypes["InvalidCredentialsError"];
	['...on OrderStateTransitionError']: '__union' & GraphQLTypes["OrderStateTransitionError"];
	['...on EmailAddressConflictError']: '__union' & GraphQLTypes["EmailAddressConflictError"];
	['...on GuestCheckoutError']: '__union' & GraphQLTypes["GuestCheckoutError"];
	['...on OrderLimitError']: '__union' & GraphQLTypes["OrderLimitError"];
	['...on NegativeQuantityError']: '__union' & GraphQLTypes["NegativeQuantityError"];
	['...on InsufficientStockError']: '__union' & GraphQLTypes["InsufficientStockError"];
	['...on CouponCodeInvalidError']: '__union' & GraphQLTypes["CouponCodeInvalidError"];
	['...on CouponCodeExpiredError']: '__union' & GraphQLTypes["CouponCodeExpiredError"];
	['...on CouponCodeLimitError']: '__union' & GraphQLTypes["CouponCodeLimitError"];
	['...on OrderModificationError']: '__union' & GraphQLTypes["OrderModificationError"];
	['...on IneligibleShippingMethodError']: '__union' & GraphQLTypes["IneligibleShippingMethodError"];
	['...on NoActiveOrderError']: '__union' & GraphQLTypes["NoActiveOrderError"];
};
	["Adjustment"]: {
	__typename: "Adjustment",
	adjustmentSource: string,
	type: GraphQLTypes["AdjustmentType"],
	description: string,
	amount: GraphQLTypes["Money"],
	data?: GraphQLTypes["JSON"] | undefined
};
	["TaxLine"]: {
	__typename: "TaxLine",
	description: string,
	taxRate: number
};
	["ConfigArg"]: {
	__typename: "ConfigArg",
	name: string,
	value: string
};
	["ConfigArgDefinition"]: {
	__typename: "ConfigArgDefinition",
	name: string,
	type: string,
	list: boolean,
	required: boolean,
	defaultValue?: GraphQLTypes["JSON"] | undefined,
	label?: string | undefined,
	description?: string | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["ConfigurableOperation"]: {
	__typename: "ConfigurableOperation",
	code: string,
	args: Array<GraphQLTypes["ConfigArg"]>
};
	["ConfigurableOperationDefinition"]: {
	__typename: "ConfigurableOperationDefinition",
	code: string,
	args: Array<GraphQLTypes["ConfigArgDefinition"]>,
	description: string
};
	["DeletionResponse"]: {
	__typename: "DeletionResponse",
	result: GraphQLTypes["DeletionResult"],
	message?: string | undefined
};
	["ConfigArgInput"]: {
		name: string,
	/** A JSON stringified representation of the actual value */
	value: string
};
	["ConfigurableOperationInput"]: {
		code: string,
	arguments: Array<GraphQLTypes["ConfigArgInput"]>
};
	/** Operators for filtering on a String field */
["StringOperators"]: {
		eq?: string | undefined,
	notEq?: string | undefined,
	contains?: string | undefined,
	notContains?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	regex?: string | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on an ID field */
["IDOperators"]: {
		eq?: string | undefined,
	notEq?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on a Boolean field */
["BooleanOperators"]: {
		eq?: boolean | undefined,
	isNull?: boolean | undefined
};
	["NumberRange"]: {
		start: number,
	end: number
};
	/** Operators for filtering on a Int or Float field */
["NumberOperators"]: {
		eq?: number | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	between?: GraphQLTypes["NumberRange"] | undefined,
	isNull?: boolean | undefined
};
	["DateRange"]: {
		start: GraphQLTypes["DateTime"],
	end: GraphQLTypes["DateTime"]
};
	/** Operators for filtering on a DateTime field */
["DateOperators"]: {
		eq?: GraphQLTypes["DateTime"] | undefined,
	before?: GraphQLTypes["DateTime"] | undefined,
	after?: GraphQLTypes["DateTime"] | undefined,
	between?: GraphQLTypes["DateRange"] | undefined,
	isNull?: boolean | undefined
};
	/** Operators for filtering on a list of String fields */
["StringListOperators"]: {
		inList: string
};
	/** Operators for filtering on a list of Number fields */
["NumberListOperators"]: {
		inList: number
};
	/** Operators for filtering on a list of Boolean fields */
["BooleanListOperators"]: {
		inList: boolean
};
	/** Operators for filtering on a list of ID fields */
["IDListOperators"]: {
		inList: string
};
	/** Operators for filtering on a list of Date fields */
["DateListOperators"]: {
		inList: GraphQLTypes["DateTime"]
};
	/** Used to construct boolean expressions for filtering search results
by FacetValue ID. Examples:

* ID=1 OR ID=2: `{ facetValueFilters: [{ or: [1,2] }] }`
* ID=1 AND ID=2: `{ facetValueFilters: [{ and: 1 }, { and: 2 }] }`
* ID=1 AND (ID=2 OR ID=3): `{ facetValueFilters: [{ and: 1 }, { or: [2,3] }] }` */
["FacetValueFilterInput"]: {
		and?: string | undefined,
	or?: Array<string> | undefined
};
	["SearchInput"]: {
		term?: string | undefined,
	facetValueFilters?: Array<GraphQLTypes["FacetValueFilterInput"]> | undefined,
	collectionId?: string | undefined,
	collectionSlug?: string | undefined,
	groupByProduct?: boolean | undefined,
	take?: number | undefined,
	skip?: number | undefined,
	sort?: GraphQLTypes["SearchResultSortParameter"] | undefined,
	inStock?: boolean | undefined,
	minPrice?: number | undefined,
	maxPrice?: number | undefined
};
	["SearchResultSortParameter"]: {
		name?: GraphQLTypes["SortOrder"] | undefined,
	price?: GraphQLTypes["SortOrder"] | undefined
};
	["CreateCustomerInput"]: {
		title?: string | undefined,
	firstName: string,
	lastName: string,
	phoneNumber?: string | undefined,
	emailAddress: string,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	/** Input used to create an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["CreateAddressInput"]: {
		fullName?: string | undefined,
	company?: string | undefined,
	streetLine1: string,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode: string,
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: GraphQLTypes["CreateAddressCustomFieldsInput"] | undefined
};
	/** Input used to update an Address.

The countryCode must correspond to a `code` property of a Country that has been defined in the
Vendure server. The `code` property is typically a 2-character ISO code such as "GB", "US", "DE" etc.
If an invalid code is passed, the mutation will fail. */
["UpdateAddressInput"]: {
		id: string,
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	defaultShippingAddress?: boolean | undefined,
	defaultBillingAddress?: boolean | undefined,
	customFields?: GraphQLTypes["UpdateAddressCustomFieldsInput"] | undefined
};
	/** Indicates that an operation succeeded, where we do not want to return any more specific information. */
["Success"]: {
	__typename: "Success",
	success: boolean
};
	["ShippingMethodQuote"]: {
	__typename: "ShippingMethodQuote",
	id: string,
	price: GraphQLTypes["Money"],
	priceWithTax: GraphQLTypes["Money"],
	code: string,
	name: string,
	description: string,
	/** Any optional metadata returned by the ShippingCalculator in the ShippingCalculationResult */
	metadata?: GraphQLTypes["JSON"] | undefined,
	customFields?: GraphQLTypes["ShippingMethodCustomFields"] | undefined
};
	["PaymentMethodQuote"]: {
	__typename: "PaymentMethodQuote",
	id: string,
	code: string,
	name: string,
	description: string,
	isEligible: boolean,
	eligibilityMessage?: string | undefined,
	customFields?: GraphQLTypes["PaymentMethodCustomFields"] | undefined
};
	["UpdateOrderItemsResult"]:{
        	__typename:"Order" | "OrderModificationError" | "OrderLimitError" | "NegativeQuantityError" | "InsufficientStockError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on OrderModificationError']: '__union' & GraphQLTypes["OrderModificationError"];
	['...on OrderLimitError']: '__union' & GraphQLTypes["OrderLimitError"];
	['...on NegativeQuantityError']: '__union' & GraphQLTypes["NegativeQuantityError"];
	['...on InsufficientStockError']: '__union' & GraphQLTypes["InsufficientStockError"];
};
	["RemoveOrderItemsResult"]:{
        	__typename:"Order" | "OrderModificationError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on OrderModificationError']: '__union' & GraphQLTypes["OrderModificationError"];
};
	["SetOrderShippingMethodResult"]:{
        	__typename:"Order" | "OrderModificationError" | "IneligibleShippingMethodError" | "NoActiveOrderError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on OrderModificationError']: '__union' & GraphQLTypes["OrderModificationError"];
	['...on IneligibleShippingMethodError']: '__union' & GraphQLTypes["IneligibleShippingMethodError"];
	['...on NoActiveOrderError']: '__union' & GraphQLTypes["NoActiveOrderError"];
};
	["ApplyCouponCodeResult"]:{
        	__typename:"Order" | "CouponCodeExpiredError" | "CouponCodeInvalidError" | "CouponCodeLimitError"
        	['...on Order']: '__union' & GraphQLTypes["Order"];
	['...on CouponCodeExpiredError']: '__union' & GraphQLTypes["CouponCodeExpiredError"];
	['...on CouponCodeInvalidError']: '__union' & GraphQLTypes["CouponCodeInvalidError"];
	['...on CouponCodeLimitError']: '__union' & GraphQLTypes["CouponCodeLimitError"];
};
	/** @description
ISO 4217 currency code

@docsCategory common */
["CurrencyCode"]: CurrencyCode;
	["CustomField"]: {
	__typename:"StringCustomFieldConfig" | "LocaleStringCustomFieldConfig" | "IntCustomFieldConfig" | "FloatCustomFieldConfig" | "BooleanCustomFieldConfig" | "DateTimeCustomFieldConfig" | "RelationCustomFieldConfig" | "TextCustomFieldConfig" | "LocaleTextCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
	['...on StringCustomFieldConfig']: '__union' & GraphQLTypes["StringCustomFieldConfig"];
	['...on LocaleStringCustomFieldConfig']: '__union' & GraphQLTypes["LocaleStringCustomFieldConfig"];
	['...on IntCustomFieldConfig']: '__union' & GraphQLTypes["IntCustomFieldConfig"];
	['...on FloatCustomFieldConfig']: '__union' & GraphQLTypes["FloatCustomFieldConfig"];
	['...on BooleanCustomFieldConfig']: '__union' & GraphQLTypes["BooleanCustomFieldConfig"];
	['...on DateTimeCustomFieldConfig']: '__union' & GraphQLTypes["DateTimeCustomFieldConfig"];
	['...on RelationCustomFieldConfig']: '__union' & GraphQLTypes["RelationCustomFieldConfig"];
	['...on TextCustomFieldConfig']: '__union' & GraphQLTypes["TextCustomFieldConfig"];
	['...on LocaleTextCustomFieldConfig']: '__union' & GraphQLTypes["LocaleTextCustomFieldConfig"];
};
	["StringCustomFieldConfig"]: {
	__typename: "StringCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	length?: number | undefined,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	pattern?: string | undefined,
	options?: Array<GraphQLTypes["StringFieldOption"]> | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["StringFieldOption"]: {
	__typename: "StringFieldOption",
	value: string,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined
};
	["LocaleStringCustomFieldConfig"]: {
	__typename: "LocaleStringCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	length?: number | undefined,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	pattern?: string | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["IntCustomFieldConfig"]: {
	__typename: "IntCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: number | undefined,
	max?: number | undefined,
	step?: number | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["FloatCustomFieldConfig"]: {
	__typename: "FloatCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: number | undefined,
	max?: number | undefined,
	step?: number | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["BooleanCustomFieldConfig"]: {
	__typename: "BooleanCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	/** Expects the same validation formats as the `<input type="datetime-local">` HTML element.
See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#Additional_attributes */
["DateTimeCustomFieldConfig"]: {
	__typename: "DateTimeCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	min?: string | undefined,
	max?: string | undefined,
	step?: number | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["RelationCustomFieldConfig"]: {
	__typename: "RelationCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	entity: string,
	scalarFields: Array<string>,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["TextCustomFieldConfig"]: {
	__typename: "TextCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["LocaleTextCustomFieldConfig"]: {
	__typename: "LocaleTextCustomFieldConfig",
	name: string,
	type: string,
	list: boolean,
	label?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	description?: Array<GraphQLTypes["LocalizedString"]> | undefined,
	readonly?: boolean | undefined,
	internal?: boolean | undefined,
	nullable?: boolean | undefined,
	ui?: GraphQLTypes["JSON"] | undefined
};
	["LocalizedString"]: {
	__typename: "LocalizedString",
	languageCode: GraphQLTypes["LanguageCode"],
	value: string
};
	["CustomFieldConfig"]:{
        	__typename:"StringCustomFieldConfig" | "LocaleStringCustomFieldConfig" | "IntCustomFieldConfig" | "FloatCustomFieldConfig" | "BooleanCustomFieldConfig" | "DateTimeCustomFieldConfig" | "RelationCustomFieldConfig" | "TextCustomFieldConfig" | "LocaleTextCustomFieldConfig"
        	['...on StringCustomFieldConfig']: '__union' & GraphQLTypes["StringCustomFieldConfig"];
	['...on LocaleStringCustomFieldConfig']: '__union' & GraphQLTypes["LocaleStringCustomFieldConfig"];
	['...on IntCustomFieldConfig']: '__union' & GraphQLTypes["IntCustomFieldConfig"];
	['...on FloatCustomFieldConfig']: '__union' & GraphQLTypes["FloatCustomFieldConfig"];
	['...on BooleanCustomFieldConfig']: '__union' & GraphQLTypes["BooleanCustomFieldConfig"];
	['...on DateTimeCustomFieldConfig']: '__union' & GraphQLTypes["DateTimeCustomFieldConfig"];
	['...on RelationCustomFieldConfig']: '__union' & GraphQLTypes["RelationCustomFieldConfig"];
	['...on TextCustomFieldConfig']: '__union' & GraphQLTypes["TextCustomFieldConfig"];
	['...on LocaleTextCustomFieldConfig']: '__union' & GraphQLTypes["LocaleTextCustomFieldConfig"];
};
	["CustomerGroup"]: {
	__typename: "CustomerGroup",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	customers: GraphQLTypes["CustomerList"],
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CustomerList"]: {
	__typename: "CustomerList",
	items: Array<GraphQLTypes["Customer"]>,
	totalItems: number
};
	["FacetValue"]: {
	__typename: "FacetValue",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	facet: GraphQLTypes["Facet"],
	facetId: string,
	name: string,
	code: string,
	translations: Array<GraphQLTypes["FacetValueTranslation"]>,
	customFields?: GraphQLTypes["FacetValueCustomFields"] | undefined
};
	["FacetValueTranslation"]: {
	__typename: "FacetValueTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	["FacetTranslation"]: {
	__typename: "FacetTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	["FacetList"]: {
	__typename: "FacetList",
	items: Array<GraphQLTypes["Facet"]>,
	totalItems: number
};
	["FacetValueListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["FacetValueSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["FacetValueFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["FacetValueList"]: {
	__typename: "FacetValueList",
	items: Array<GraphQLTypes["FacetValue"]>,
	totalItems: number
};
	["HistoryEntryType"]: HistoryEntryType;
	["HistoryEntryList"]: {
	__typename: "HistoryEntryList",
	items: Array<GraphQLTypes["HistoryEntry"]>,
	totalItems: number
};
	["HistoryEntryListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["HistoryEntrySortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["HistoryEntryFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	/** @description
Languages in the form of a ISO 639-1 language code with optional
region or script modifier (e.g. de_AT). The selection available is based
on the [Unicode CLDR summary list](https://unicode-org.github.io/cldr-staging/charts/37/summary/root.html)
and includes the major spoken languages of the world and any widely-used variants.

@docsCategory common */
["LanguageCode"]: LanguageCode;
	["OrderType"]: OrderType;
	/** A summary of the taxes being applied to this order, grouped
by taxRate. */
["OrderTaxSummary"]: {
	__typename: "OrderTaxSummary",
	/** A description of this tax */
	description: string,
	/** The taxRate as a percentage */
	taxRate: number,
	/** The total net price of OrderLines to which this taxRate applies */
	taxBase: GraphQLTypes["Money"],
	/** The total tax being applied to the Order at this taxRate */
	taxTotal: GraphQLTypes["Money"]
};
	["OrderAddress"]: {
	__typename: "OrderAddress",
	fullName?: string | undefined,
	company?: string | undefined,
	streetLine1?: string | undefined,
	streetLine2?: string | undefined,
	city?: string | undefined,
	province?: string | undefined,
	postalCode?: string | undefined,
	country?: string | undefined,
	countryCode?: string | undefined,
	phoneNumber?: string | undefined,
	customFields?: GraphQLTypes["AddressCustomFields"] | undefined
};
	["OrderList"]: {
	__typename: "OrderList",
	items: Array<GraphQLTypes["Order"]>,
	totalItems: number
};
	["ShippingLine"]: {
	__typename: "ShippingLine",
	id: string,
	shippingMethod: GraphQLTypes["ShippingMethod"],
	price: GraphQLTypes["Money"],
	priceWithTax: GraphQLTypes["Money"],
	discountedPrice: GraphQLTypes["Money"],
	discountedPriceWithTax: GraphQLTypes["Money"],
	discounts: Array<GraphQLTypes["Discount"]>
};
	["Discount"]: {
	__typename: "Discount",
	adjustmentSource: string,
	type: GraphQLTypes["AdjustmentType"],
	description: string,
	amount: GraphQLTypes["Money"],
	amountWithTax: GraphQLTypes["Money"]
};
	["OrderLine"]: {
	__typename: "OrderLine",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	productVariant: GraphQLTypes["ProductVariant"],
	featuredAsset?: GraphQLTypes["Asset"] | undefined,
	/** The price of a single unit, excluding tax and discounts */
	unitPrice: GraphQLTypes["Money"],
	/** The price of a single unit, including tax but excluding discounts */
	unitPriceWithTax: GraphQLTypes["Money"],
	/** Non-zero if the unitPrice has changed since it was initially added to Order */
	unitPriceChangeSinceAdded: GraphQLTypes["Money"],
	/** Non-zero if the unitPriceWithTax has changed since it was initially added to Order */
	unitPriceWithTaxChangeSinceAdded: GraphQLTypes["Money"],
	/** The price of a single unit including discounts, excluding tax.

If Order-level discounts have been applied, this will not be the
actual taxable unit price (see `proratedUnitPrice`), but is generally the
correct price to display to customers to avoid confusion
about the internal handling of distributed Order-level discounts. */
	discountedUnitPrice: GraphQLTypes["Money"],
	/** The price of a single unit including discounts and tax */
	discountedUnitPriceWithTax: GraphQLTypes["Money"],
	/** The actual unit price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderItem, and is used in tax
and refund calculations. */
	proratedUnitPrice: GraphQLTypes["Money"],
	/** The proratedUnitPrice including tax */
	proratedUnitPriceWithTax: GraphQLTypes["Money"],
	/** The quantity of items purchased */
	quantity: number,
	/** The quantity at the time the Order was placed */
	orderPlacedQuantity: number,
	taxRate: number,
	/** The total price of the line excluding tax and discounts. */
	linePrice: GraphQLTypes["Money"],
	/** The total price of the line including tax but excluding discounts. */
	linePriceWithTax: GraphQLTypes["Money"],
	/** The price of the line including discounts, excluding tax */
	discountedLinePrice: GraphQLTypes["Money"],
	/** The price of the line including discounts and tax */
	discountedLinePriceWithTax: GraphQLTypes["Money"],
	/** The actual line price, taking into account both item discounts _and_ prorated (proportionally-distributed)
Order-level discounts. This value is the true economic value of the OrderLine, and is used in tax
and refund calculations. */
	proratedLinePrice: GraphQLTypes["Money"],
	/** The proratedLinePrice including tax */
	proratedLinePriceWithTax: GraphQLTypes["Money"],
	/** The total tax on this line */
	lineTax: GraphQLTypes["Money"],
	discounts: Array<GraphQLTypes["Discount"]>,
	taxLines: Array<GraphQLTypes["TaxLine"]>,
	order: GraphQLTypes["Order"],
	fulfillmentLines?: Array<GraphQLTypes["FulfillmentLine"]> | undefined,
	customFields?: GraphQLTypes["OrderLineCustomFields"] | undefined
};
	["RefundLine"]: {
	__typename: "RefundLine",
	orderLine: GraphQLTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	refund: GraphQLTypes["Refund"],
	refundId: string
};
	["Refund"]: {
	__typename: "Refund",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	items: GraphQLTypes["Money"],
	shipping: GraphQLTypes["Money"],
	adjustment: GraphQLTypes["Money"],
	total: GraphQLTypes["Money"],
	method?: string | undefined,
	state: string,
	transactionId?: string | undefined,
	reason?: string | undefined,
	lines: Array<GraphQLTypes["RefundLine"]>,
	paymentId: string,
	metadata?: GraphQLTypes["JSON"] | undefined
};
	["FulfillmentLine"]: {
	__typename: "FulfillmentLine",
	orderLine: GraphQLTypes["OrderLine"],
	orderLineId: string,
	quantity: number,
	fulfillment: GraphQLTypes["Fulfillment"],
	fulfillmentId: string
};
	["Surcharge"]: {
	__typename: "Surcharge",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	description: string,
	sku?: string | undefined,
	taxLines: Array<GraphQLTypes["TaxLine"]>,
	price: GraphQLTypes["Money"],
	priceWithTax: GraphQLTypes["Money"],
	taxRate: number
};
	["PaymentMethod"]: {
	__typename: "PaymentMethod",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	code: string,
	description: string,
	enabled: boolean,
	checker?: GraphQLTypes["ConfigurableOperation"] | undefined,
	handler: GraphQLTypes["ConfigurableOperation"],
	translations: Array<GraphQLTypes["PaymentMethodTranslation"]>,
	customFields?: GraphQLTypes["PaymentMethodCustomFields"] | undefined
};
	["PaymentMethodTranslation"]: {
	__typename: "PaymentMethodTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	description: string,
	customFields?: GraphQLTypes["PaymentMethodTranslationCustomFields"] | undefined
};
	["ProductOptionGroup"]: {
	__typename: "ProductOptionGroup",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	name: string,
	options: Array<GraphQLTypes["ProductOption"]>,
	translations: Array<GraphQLTypes["ProductOptionGroupTranslation"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ProductOptionGroupTranslation"]: {
	__typename: "ProductOptionGroupTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	["ProductOption"]: {
	__typename: "ProductOption",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	name: string,
	groupId: string,
	group: GraphQLTypes["ProductOptionGroup"],
	translations: Array<GraphQLTypes["ProductOptionTranslation"]>,
	customFields?: GraphQLTypes["ProductOptionCustomFields"] | undefined
};
	["ProductOptionTranslation"]: {
	__typename: "ProductOptionTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	["SearchReindexResponse"]: {
	__typename: "SearchReindexResponse",
	success: boolean
};
	["SearchResponse"]: {
	__typename: "SearchResponse",
	items: Array<GraphQLTypes["SearchResult"]>,
	totalItems: number,
	facetValues: Array<GraphQLTypes["FacetValueResult"]>,
	collections: Array<GraphQLTypes["CollectionResult"]>,
	minPrice?: number | undefined,
	maxPrice?: number | undefined
};
	/** Which FacetValues are present in the products returned
by the search, and in what quantity. */
["FacetValueResult"]: {
	__typename: "FacetValueResult",
	facetValue: GraphQLTypes["FacetValue"],
	count: number
};
	/** Which Collections are present in the products returned
by the search, and in what quantity. */
["CollectionResult"]: {
	__typename: "CollectionResult",
	collection: GraphQLTypes["Collection"],
	count: number
};
	["SearchResultAsset"]: {
	__typename: "SearchResultAsset",
	id: string,
	preview: string,
	focalPoint?: GraphQLTypes["Coordinate"] | undefined
};
	/** The price of a search result product, either as a range or as a single price */
["SearchResultPrice"]:{
        	__typename:"PriceRange" | "SinglePrice"
        	['...on PriceRange']: '__union' & GraphQLTypes["PriceRange"];
	['...on SinglePrice']: '__union' & GraphQLTypes["SinglePrice"];
};
	/** The price value where the result has a single price */
["SinglePrice"]: {
	__typename: "SinglePrice",
	value: GraphQLTypes["Money"]
};
	/** The price range where the result has more than one price */
["PriceRange"]: {
	__typename: "PriceRange",
	min: GraphQLTypes["Money"],
	max: GraphQLTypes["Money"]
};
	["ProductTranslation"]: {
	__typename: "ProductTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	slug: string,
	description: string,
	customFields?: GraphQLTypes["ProductTranslationCustomFields"] | undefined
};
	["ProductList"]: {
	__typename: "ProductList",
	items: Array<GraphQLTypes["Product"]>,
	totalItems: number
};
	["ProductVariantList"]: {
	__typename: "ProductVariantList",
	items: Array<GraphQLTypes["ProductVariant"]>,
	totalItems: number
};
	["ProductVariantTranslation"]: {
	__typename: "ProductVariantTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	["Promotion"]: {
	__typename: "Promotion",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	startsAt?: GraphQLTypes["DateTime"] | undefined,
	endsAt?: GraphQLTypes["DateTime"] | undefined,
	couponCode?: string | undefined,
	perCustomerUsageLimit?: number | undefined,
	usageLimit?: number | undefined,
	name: string,
	description: string,
	enabled: boolean,
	conditions: Array<GraphQLTypes["ConfigurableOperation"]>,
	actions: Array<GraphQLTypes["ConfigurableOperation"]>,
	translations: Array<GraphQLTypes["PromotionTranslation"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["PromotionTranslation"]: {
	__typename: "PromotionTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	description: string
};
	["PromotionList"]: {
	__typename: "PromotionList",
	items: Array<GraphQLTypes["Promotion"]>,
	totalItems: number
};
	["Region"]: {
	__typename:"Country" | "Province",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	type: string,
	name: string,
	enabled: boolean,
	parent?: GraphQLTypes["Region"] | undefined,
	parentId?: string | undefined,
	translations: Array<GraphQLTypes["RegionTranslation"]>
	['...on Country']: '__union' & GraphQLTypes["Country"];
	['...on Province']: '__union' & GraphQLTypes["Province"];
};
	["RegionTranslation"]: {
	__typename: "RegionTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string
};
	/** A Country of the world which your shop operates in.

The `code` field is typically a 2-character ISO code such as "GB", "US", "DE" etc. This code is used in certain inputs such as
`UpdateAddressInput` and `CreateAddressInput` to specify the country. */
["Country"]: {
	__typename: "Country",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	type: string,
	name: string,
	enabled: boolean,
	parent?: GraphQLTypes["Region"] | undefined,
	parentId?: string | undefined,
	translations: Array<GraphQLTypes["RegionTranslation"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["CountryList"]: {
	__typename: "CountryList",
	items: Array<GraphQLTypes["Country"]>,
	totalItems: number
};
	["Province"]: {
	__typename: "Province",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	type: string,
	name: string,
	enabled: boolean,
	parent?: GraphQLTypes["Region"] | undefined,
	parentId?: string | undefined,
	translations: Array<GraphQLTypes["RegionTranslation"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ProvinceList"]: {
	__typename: "ProvinceList",
	items: Array<GraphQLTypes["Province"]>,
	totalItems: number
};
	["Role"]: {
	__typename: "Role",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	code: string,
	description: string,
	permissions: Array<GraphQLTypes["Permission"]>,
	channels: Array<GraphQLTypes["Channel"]>
};
	["RoleList"]: {
	__typename: "RoleList",
	items: Array<GraphQLTypes["Role"]>,
	totalItems: number
};
	["Seller"]: {
	__typename: "Seller",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["ShippingMethod"]: {
	__typename: "ShippingMethod",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	code: string,
	name: string,
	description: string,
	fulfillmentHandlerCode: string,
	checker: GraphQLTypes["ConfigurableOperation"],
	calculator: GraphQLTypes["ConfigurableOperation"],
	translations: Array<GraphQLTypes["ShippingMethodTranslation"]>,
	customFields?: GraphQLTypes["ShippingMethodCustomFields"] | undefined
};
	["ShippingMethodTranslation"]: {
	__typename: "ShippingMethodTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	name: string,
	description: string,
	customFields?: GraphQLTypes["ShippingMethodTranslationCustomFields"] | undefined
};
	["ShippingMethodList"]: {
	__typename: "ShippingMethodList",
	items: Array<GraphQLTypes["ShippingMethod"]>,
	totalItems: number
};
	["Tag"]: {
	__typename: "Tag",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	value: string
};
	["TagList"]: {
	__typename: "TagList",
	items: Array<GraphQLTypes["Tag"]>,
	totalItems: number
};
	["TaxCategory"]: {
	__typename: "TaxCategory",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	isDefault: boolean,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["TaxRate"]: {
	__typename: "TaxRate",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	enabled: boolean,
	value: number,
	category: GraphQLTypes["TaxCategory"],
	zone: GraphQLTypes["Zone"],
	customerGroup?: GraphQLTypes["CustomerGroup"] | undefined,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["TaxRateList"]: {
	__typename: "TaxRateList",
	items: Array<GraphQLTypes["TaxRate"]>,
	totalItems: number
};
	["User"]: {
	__typename: "User",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	identifier: string,
	verified: boolean,
	roles: Array<GraphQLTypes["Role"]>,
	lastLogin?: GraphQLTypes["DateTime"] | undefined,
	authenticationMethods: Array<GraphQLTypes["AuthenticationMethod"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["AuthenticationMethod"]: {
	__typename: "AuthenticationMethod",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	strategy: string
};
	["Zone"]: {
	__typename: "Zone",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	members: Array<GraphQLTypes["Region"]>,
	customFields?: GraphQLTypes["JSON"] | undefined
};
	["MetricSummary"]: {
	__typename: "MetricSummary",
	interval: GraphQLTypes["MetricInterval"],
	type: GraphQLTypes["MetricType"],
	title: string,
	entries: Array<GraphQLTypes["MetricSummaryEntry"]>
};
	["MetricInterval"]: MetricInterval;
	["MetricType"]: MetricType;
	["MetricSummaryEntry"]: {
	__typename: "MetricSummaryEntry",
	label: string,
	value: number
};
	["MetricSummaryInput"]: {
		interval: GraphQLTypes["MetricInterval"],
	types: Array<GraphQLTypes["MetricType"]>,
	refresh?: boolean | undefined
};
	["PageType"]: PageType;
	["Author"]: {
	__typename: "Author",
	firstName?: string | undefined,
	lastName?: string | undefined,
	emailAddress?: string | undefined
};
	["Page"]: {
	__typename: "Page",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	type: GraphQLTypes["PageType"],
	content?: string | undefined,
	title?: string | undefined,
	description?: string | undefined,
	slug?: string | undefined,
	asset?: GraphQLTypes["Asset"] | undefined,
	position?: number | undefined,
	enabled?: boolean | undefined,
	author?: GraphQLTypes["Author"] | undefined,
	translations: Array<GraphQLTypes["PageTranslation"]>
};
	["PageTranslation"]: {
	__typename: "PageTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	content: string,
	description: string,
	title: string,
	slug: string,
	tags?: string | undefined
};
	["PageList"]: {
	__typename: "PageList",
	items: Array<GraphQLTypes["Page"]>,
	totalItems: number
};
	["PageListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["PageSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["PageFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["PageTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	content: string,
	slug: string,
	title: string,
	description: string,
	tags?: string | undefined
};
	["UpdatePageInput"]: {
		id: string,
	position?: number | undefined,
	enabled?: boolean | undefined,
	assetId?: string | undefined,
	translations?: Array<GraphQLTypes["PageTranslationInput"]> | undefined
};
	["CreatePageInput"]: {
		position?: number | undefined,
	enabled?: boolean | undefined,
	type: GraphQLTypes["PageType"],
	assetId?: string | undefined,
	authorId?: string | undefined,
	translations: Array<GraphQLTypes["PageTranslationInput"]>
};
	["DeletePageInput"]: {
		id: string
};
	["AnnouncementBarEntryTranslation"]: {
	__typename: "AnnouncementBarEntryTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	text: string,
	redirectUrl: string,
	icon: string
};
	["AnnouncementBarEntry"]: {
	__typename: "AnnouncementBarEntry",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	text?: string | undefined,
	redirectUrl?: string | undefined,
	icon?: string | undefined,
	colorIcon?: string | undefined,
	colorText?: string | undefined,
	translations: Array<GraphQLTypes["AnnouncementBarEntryTranslation"]>
};
	["AnnouncementBar"]: {
	__typename: "AnnouncementBar",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	title: string,
	enabled: boolean,
	startDate: GraphQLTypes["DateTime"],
	endDate: GraphQLTypes["DateTime"],
	speed: number,
	spaceBetween: number,
	colorBackground?: string | undefined,
	nowActive?: boolean | undefined,
	entries?: Array<GraphQLTypes["AnnouncementBarEntry"]> | undefined
};
	["AnnouncementBarList"]: {
	__typename: "AnnouncementBarList",
	items: Array<GraphQLTypes["AnnouncementBar"]>,
	totalItems: number
};
	["AnnouncementBarListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["AnnouncementBarSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["AnnouncementBarFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["AnnouncementBarEntryTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	text: string,
	redirectUrl: string,
	icon: string
};
	["AnnouncementBarEntryInput"]: {
		id?: string | undefined,
	colorIcon?: string | undefined,
	colorText?: string | undefined,
	translations?: Array<GraphQLTypes["AnnouncementBarEntryTranslationInput"]> | undefined
};
	["UpdateAnnouncementBarInput"]: {
		id: string,
	title?: string | undefined,
	enabled?: boolean | undefined,
	startDate?: GraphQLTypes["DateTime"] | undefined,
	endDate?: GraphQLTypes["DateTime"] | undefined,
	speed?: number | undefined,
	spaceBetween?: number | undefined,
	colorBackground?: string | undefined,
	entries?: Array<GraphQLTypes["AnnouncementBarEntryInput"]> | undefined
};
	["CreateAnnouncementBarInput"]: {
		title?: string | undefined,
	enabled?: boolean | undefined,
	startDate?: GraphQLTypes["DateTime"] | undefined,
	endDate?: GraphQLTypes["DateTime"] | undefined,
	speed?: number | undefined,
	spaceBetween?: number | undefined,
	colorBackground?: string | undefined,
	entries?: Array<GraphQLTypes["AnnouncementBarEntryInput"]> | undefined
};
	["DeleteAnnouncementBarInput"]: {
		id: string
};
	["ChangeStatusAnnouncementBarInput"]: {
		id: string,
	enabled: boolean
};
	["WishlistItem"]: {
	__typename: "WishlistItem",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	product?: GraphQLTypes["Product"] | undefined,
	wishlistId: string,
	productId: string,
	minVariantPrice?: GraphQLTypes["Money"] | undefined,
	maxVariantPrice?: GraphQLTypes["Money"] | undefined
};
	["WishlistList"]: {
	__typename: "WishlistList",
	items: Array<GraphQLTypes["WishlistItem"]>,
	totalItems: number
};
	["WishlistListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["WishlistSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["WishlistFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["Wishlist"]: {
	__typename: "Wishlist",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	currencyCode: GraphQLTypes["CurrencyCode"],
	entries?: GraphQLTypes["WishlistList"] | undefined
};
	["WishlistEntryID"]: {
	__typename: "WishlistEntryID",
	id: string,
	productId: string
};
	["WishlistIDs"]: {
	__typename: "WishlistIDs",
	id?: string | undefined,
	entries?: Array<GraphQLTypes["WishlistEntryID"]> | undefined
};
	["OrderRealization"]: {
	__typename: "OrderRealization",
	orderID: string,
	assetID: string,
	plannedAt: string,
	finalPlannedAt?: string | undefined,
	note?: string | undefined,
	color: string,
	key?: string | undefined,
	url?: string | undefined
};
	["DiscountedPriceMetadata"]: {
	__typename: "DiscountedPriceMetadata",
	price?: number | undefined,
	name?: string | undefined,
	description?: string | undefined,
	isCustomerGroup?: boolean | undefined
};
	["DiscountedPrice"]: {
	__typename: "DiscountedPrice",
	value?: number | undefined,
	metadata?: Array<GraphQLTypes["DiscountedPriceMetadata"] | undefined> | undefined
};
	["ShopOrderRealization"]: {
	__typename: "ShopOrderRealization",
	note?: string | undefined,
	plannedAt?: string | undefined,
	finalPlannedAt?: string | undefined
};
	["RealizationAssetInput"]: {
		id: string,
	orderLineID: string,
	preview: string
};
	["OrderRealizationInput"]: {
		orderID: string,
	assets: Array<GraphQLTypes["RealizationAssetInput"]>,
	plannedAt: string,
	finalPlannedAt: string,
	note: string,
	color: string
};
	["RegisterProformaInput"]: {
		orderID: string
};
	["NewsletterSubscriber"]: {
	__typename: "NewsletterSubscriber",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	email: string,
	type: string,
	data?: string | undefined,
	customer?: GraphQLTypes["Customer"] | undefined,
	seen: boolean
};
	["BackInStockSubscriber"]: {
	__typename: "BackInStockSubscriber",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	email: string,
	data?: string | undefined,
	registerToNewsletter?: boolean | undefined,
	options?: string | undefined,
	customer?: GraphQLTypes["Customer"] | undefined,
	variant?: GraphQLTypes["ProductVariant"] | undefined,
	product?: GraphQLTypes["Product"] | undefined,
	images?: Array<string | undefined> | undefined,
	seen: boolean
};
	["B2BSubscriber"]: {
	__typename: "B2BSubscriber",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	name: string,
	email: string,
	NIP: string,
	city: string,
	number: string,
	message?: string | undefined,
	seen: boolean
};
	["NewsletterSubscriberList"]: {
	__typename: "NewsletterSubscriberList",
	items: Array<GraphQLTypes["NewsletterSubscriber"]>,
	totalItems: number
};
	["BackInStockSubscriberList"]: {
	__typename: "BackInStockSubscriberList",
	items: Array<GraphQLTypes["BackInStockSubscriber"]>,
	totalItems: number
};
	["B2BSubscriberList"]: {
	__typename: "B2BSubscriberList",
	items: Array<GraphQLTypes["B2BSubscriber"]>,
	totalItems: number
};
	["NewsletterSubscriberListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["NewsletterSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["NewsletterSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["BackInStockSubscriberListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["BackInStockSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["BackInStockSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["B2BSubscriberListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["B2BSubscriberSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["B2BSubscriberFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["Model"]: {
	__typename: "Model",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	title?: string | undefined,
	content?: string | undefined,
	url?: string | undefined,
	key: string,
	product?: GraphQLTypes["Product"] | undefined,
	translations: Array<GraphQLTypes["ModelTranslation"]>
};
	["ModelTranslation"]: {
	__typename: "ModelTranslation",
	id: string,
	createdAt: GraphQLTypes["DateTime"],
	updatedAt: GraphQLTypes["DateTime"],
	languageCode: GraphQLTypes["LanguageCode"],
	title: string,
	content: string
};
	["ModelList"]: {
	__typename: "ModelList",
	items: Array<GraphQLTypes["Model"]>,
	totalItems: number
};
	["ModelListOptions"]: {
		/** Skips the first n results, for use in pagination */
	skip?: number | undefined,
	/** Takes n results, for use in pagination */
	take?: number | undefined,
	/** Specifies which properties to sort the results by */
	sort?: GraphQLTypes["ModelSortParameter"] | undefined,
	/** Allows the results to be filtered */
	filter?: GraphQLTypes["ModelFilterParameter"] | undefined,
	/** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
	filterOperator?: GraphQLTypes["LogicalOperator"] | undefined
};
	["ModelTranslationInput"]: {
		id?: string | undefined,
	languageCode: GraphQLTypes["LanguageCode"],
	title: string,
	content: string
};
	["UpdateModelInput"]: {
		id: string,
	productId?: string | undefined,
	translations?: Array<GraphQLTypes["ModelTranslationInput"]> | undefined
};
	["CreateModelInput"]: {
		file: GraphQLTypes["Upload"],
	productId?: string | undefined,
	translations: Array<GraphQLTypes["ModelTranslationInput"]>
};
	["DeleteModelInput"]: {
		id: string
};
	["AdministratorFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	firstName?: GraphQLTypes["StringOperators"] | undefined,
	lastName?: GraphQLTypes["StringOperators"] | undefined,
	emailAddress?: GraphQLTypes["StringOperators"] | undefined
};
	["AdministratorSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	firstName?: GraphQLTypes["SortOrder"] | undefined,
	lastName?: GraphQLTypes["SortOrder"] | undefined,
	emailAddress?: GraphQLTypes["SortOrder"] | undefined
};
	["AssetFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	fileSize?: GraphQLTypes["NumberOperators"] | undefined,
	mimeType?: GraphQLTypes["StringOperators"] | undefined,
	width?: GraphQLTypes["NumberOperators"] | undefined,
	height?: GraphQLTypes["NumberOperators"] | undefined,
	source?: GraphQLTypes["StringOperators"] | undefined,
	preview?: GraphQLTypes["StringOperators"] | undefined
};
	["AssetSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	fileSize?: GraphQLTypes["SortOrder"] | undefined,
	mimeType?: GraphQLTypes["SortOrder"] | undefined,
	width?: GraphQLTypes["SortOrder"] | undefined,
	height?: GraphQLTypes["SortOrder"] | undefined,
	source?: GraphQLTypes["SortOrder"] | undefined,
	preview?: GraphQLTypes["SortOrder"] | undefined
};
	["ChannelFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	token?: GraphQLTypes["StringOperators"] | undefined,
	defaultLanguageCode?: GraphQLTypes["StringOperators"] | undefined,
	currencyCode?: GraphQLTypes["StringOperators"] | undefined,
	defaultCurrencyCode?: GraphQLTypes["StringOperators"] | undefined,
	trackInventory?: GraphQLTypes["BooleanOperators"] | undefined,
	outOfStockThreshold?: GraphQLTypes["NumberOperators"] | undefined,
	pricesIncludeTax?: GraphQLTypes["BooleanOperators"] | undefined
};
	["ChannelSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	token?: GraphQLTypes["SortOrder"] | undefined,
	outOfStockThreshold?: GraphQLTypes["SortOrder"] | undefined
};
	["CollectionFilterParameter"]: {
		isPrivate?: GraphQLTypes["BooleanOperators"] | undefined,
	inheritFilters?: GraphQLTypes["BooleanOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	slug?: GraphQLTypes["StringOperators"] | undefined,
	position?: GraphQLTypes["NumberOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	parentId?: GraphQLTypes["IDOperators"] | undefined,
	seoTitle?: GraphQLTypes["StringOperators"] | undefined,
	seoDescription?: GraphQLTypes["StringOperators"] | undefined
};
	["CollectionSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	slug?: GraphQLTypes["SortOrder"] | undefined,
	position?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined,
	parentId?: GraphQLTypes["SortOrder"] | undefined,
	seoTitle?: GraphQLTypes["SortOrder"] | undefined,
	seoDescription?: GraphQLTypes["SortOrder"] | undefined,
	facebookImage?: GraphQLTypes["SortOrder"] | undefined,
	twitterImage?: GraphQLTypes["SortOrder"] | undefined
};
	["ProductVariantSortParameter"]: {
		stockOnHand?: GraphQLTypes["SortOrder"] | undefined,
	stockAllocated?: GraphQLTypes["SortOrder"] | undefined,
	outOfStockThreshold?: GraphQLTypes["SortOrder"] | undefined,
	id?: GraphQLTypes["SortOrder"] | undefined,
	productId?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	sku?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	price?: GraphQLTypes["SortOrder"] | undefined,
	priceWithTax?: GraphQLTypes["SortOrder"] | undefined,
	stockLevel?: GraphQLTypes["SortOrder"] | undefined,
	omnibusPrice?: GraphQLTypes["SortOrder"] | undefined
};
	["CountryFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	parentId?: GraphQLTypes["IDOperators"] | undefined
};
	["CountrySortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	type?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	parentId?: GraphQLTypes["SortOrder"] | undefined
};
	["CustomerGroupFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined
};
	["CustomerGroupSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined
};
	["CustomerSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	title?: GraphQLTypes["SortOrder"] | undefined,
	firstName?: GraphQLTypes["SortOrder"] | undefined,
	lastName?: GraphQLTypes["SortOrder"] | undefined,
	phoneNumber?: GraphQLTypes["SortOrder"] | undefined,
	emailAddress?: GraphQLTypes["SortOrder"] | undefined
};
	["FacetFilterParameter"]: {
		isPrivate?: GraphQLTypes["BooleanOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	usedForColors?: GraphQLTypes["BooleanOperators"] | undefined,
	usedForProductCreations?: GraphQLTypes["BooleanOperators"] | undefined,
	colorsCollection?: GraphQLTypes["BooleanOperators"] | undefined
};
	["FacetSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	usedForColors?: GraphQLTypes["SortOrder"] | undefined,
	usedForProductCreations?: GraphQLTypes["SortOrder"] | undefined,
	colorsCollection?: GraphQLTypes["SortOrder"] | undefined
};
	["FacetValueFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	facetId?: GraphQLTypes["IDOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	hexColor?: GraphQLTypes["StringOperators"] | undefined,
	isNew?: GraphQLTypes["BooleanOperators"] | undefined
};
	["FacetValueSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	facetId?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	image?: GraphQLTypes["SortOrder"] | undefined,
	hexColor?: GraphQLTypes["SortOrder"] | undefined,
	isNew?: GraphQLTypes["SortOrder"] | undefined
};
	["JobFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	startedAt?: GraphQLTypes["DateOperators"] | undefined,
	settledAt?: GraphQLTypes["DateOperators"] | undefined,
	queueName?: GraphQLTypes["StringOperators"] | undefined,
	state?: GraphQLTypes["StringOperators"] | undefined,
	progress?: GraphQLTypes["NumberOperators"] | undefined,
	isSettled?: GraphQLTypes["BooleanOperators"] | undefined,
	duration?: GraphQLTypes["NumberOperators"] | undefined,
	retries?: GraphQLTypes["NumberOperators"] | undefined,
	attempts?: GraphQLTypes["NumberOperators"] | undefined
};
	["JobSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	startedAt?: GraphQLTypes["SortOrder"] | undefined,
	settledAt?: GraphQLTypes["SortOrder"] | undefined,
	queueName?: GraphQLTypes["SortOrder"] | undefined,
	progress?: GraphQLTypes["SortOrder"] | undefined,
	duration?: GraphQLTypes["SortOrder"] | undefined,
	retries?: GraphQLTypes["SortOrder"] | undefined,
	attempts?: GraphQLTypes["SortOrder"] | undefined
};
	["PaymentMethodFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	modalTitle?: GraphQLTypes["StringOperators"] | undefined,
	modalDescription?: GraphQLTypes["StringOperators"] | undefined,
	modalAdditionalDescription?: GraphQLTypes["StringOperators"] | undefined
};
	["PaymentMethodSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined,
	modalTitle?: GraphQLTypes["SortOrder"] | undefined,
	modalDescription?: GraphQLTypes["SortOrder"] | undefined,
	modalAdditionalDescription?: GraphQLTypes["SortOrder"] | undefined
};
	["ProductSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	slug?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined,
	seoTitle?: GraphQLTypes["SortOrder"] | undefined,
	seoDescription?: GraphQLTypes["SortOrder"] | undefined,
	facebookImage?: GraphQLTypes["SortOrder"] | undefined,
	twitterImage?: GraphQLTypes["SortOrder"] | undefined,
	optionsOrder?: GraphQLTypes["SortOrder"] | undefined,
	sizes?: GraphQLTypes["SortOrder"] | undefined,
	finish?: GraphQLTypes["SortOrder"] | undefined,
	materials?: GraphQLTypes["SortOrder"] | undefined,
	payment?: GraphQLTypes["SortOrder"] | undefined,
	delivery?: GraphQLTypes["SortOrder"] | undefined,
	realization?: GraphQLTypes["SortOrder"] | undefined,
	discountBy?: GraphQLTypes["SortOrder"] | undefined
};
	["PromotionFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	startsAt?: GraphQLTypes["DateOperators"] | undefined,
	endsAt?: GraphQLTypes["DateOperators"] | undefined,
	couponCode?: GraphQLTypes["StringOperators"] | undefined,
	perCustomerUsageLimit?: GraphQLTypes["NumberOperators"] | undefined,
	usageLimit?: GraphQLTypes["NumberOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined
};
	["PromotionSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	startsAt?: GraphQLTypes["SortOrder"] | undefined,
	endsAt?: GraphQLTypes["SortOrder"] | undefined,
	couponCode?: GraphQLTypes["SortOrder"] | undefined,
	perCustomerUsageLimit?: GraphQLTypes["SortOrder"] | undefined,
	usageLimit?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined
};
	["ProvinceFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	parentId?: GraphQLTypes["IDOperators"] | undefined
};
	["ProvinceSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	type?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	parentId?: GraphQLTypes["SortOrder"] | undefined
};
	["RoleFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined
};
	["RoleSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined
};
	["SellerFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined
};
	["SellerSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined
};
	["ShippingMethodFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	languageCode?: GraphQLTypes["StringOperators"] | undefined,
	code?: GraphQLTypes["StringOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	fulfillmentHandlerCode?: GraphQLTypes["StringOperators"] | undefined,
	modalTitle?: GraphQLTypes["StringOperators"] | undefined,
	modalDescription?: GraphQLTypes["StringOperators"] | undefined,
	modalAdditionalDescription?: GraphQLTypes["StringOperators"] | undefined
};
	["ShippingMethodSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	code?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined,
	fulfillmentHandlerCode?: GraphQLTypes["SortOrder"] | undefined,
	modalTitle?: GraphQLTypes["SortOrder"] | undefined,
	modalDescription?: GraphQLTypes["SortOrder"] | undefined,
	modalAdditionalDescription?: GraphQLTypes["SortOrder"] | undefined
};
	["StockLocationFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined
};
	["StockLocationSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined
};
	["TagFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	value?: GraphQLTypes["StringOperators"] | undefined
};
	["TagSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	value?: GraphQLTypes["SortOrder"] | undefined
};
	["TaxCategoryFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	isDefault?: GraphQLTypes["BooleanOperators"] | undefined
};
	["TaxCategorySortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined
};
	["TaxRateFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	value?: GraphQLTypes["NumberOperators"] | undefined
};
	["TaxRateSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	value?: GraphQLTypes["SortOrder"] | undefined
};
	["ZoneFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined
};
	["ZoneSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined
};
	["PageFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	content?: GraphQLTypes["StringOperators"] | undefined,
	title?: GraphQLTypes["StringOperators"] | undefined,
	description?: GraphQLTypes["StringOperators"] | undefined,
	slug?: GraphQLTypes["StringOperators"] | undefined,
	position?: GraphQLTypes["NumberOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined
};
	["PageSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	content?: GraphQLTypes["SortOrder"] | undefined,
	title?: GraphQLTypes["SortOrder"] | undefined,
	description?: GraphQLTypes["SortOrder"] | undefined,
	slug?: GraphQLTypes["SortOrder"] | undefined,
	position?: GraphQLTypes["SortOrder"] | undefined
};
	["AnnouncementBarFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	title?: GraphQLTypes["StringOperators"] | undefined,
	enabled?: GraphQLTypes["BooleanOperators"] | undefined,
	startDate?: GraphQLTypes["DateOperators"] | undefined,
	endDate?: GraphQLTypes["DateOperators"] | undefined,
	speed?: GraphQLTypes["NumberOperators"] | undefined,
	spaceBetween?: GraphQLTypes["NumberOperators"] | undefined,
	colorBackground?: GraphQLTypes["StringOperators"] | undefined,
	nowActive?: GraphQLTypes["BooleanOperators"] | undefined
};
	["AnnouncementBarSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	title?: GraphQLTypes["SortOrder"] | undefined,
	startDate?: GraphQLTypes["SortOrder"] | undefined,
	endDate?: GraphQLTypes["SortOrder"] | undefined,
	speed?: GraphQLTypes["SortOrder"] | undefined,
	spaceBetween?: GraphQLTypes["SortOrder"] | undefined,
	colorBackground?: GraphQLTypes["SortOrder"] | undefined
};
	["WishlistFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	currencyCode?: GraphQLTypes["StringOperators"] | undefined
};
	["WishlistSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined
};
	["NewsletterSubscriberFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	email?: GraphQLTypes["StringOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined,
	data?: GraphQLTypes["StringOperators"] | undefined,
	seen?: GraphQLTypes["BooleanOperators"] | undefined
};
	["NewsletterSubscriberSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	email?: GraphQLTypes["SortOrder"] | undefined,
	type?: GraphQLTypes["SortOrder"] | undefined,
	data?: GraphQLTypes["SortOrder"] | undefined
};
	["BackInStockSubscriberFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	email?: GraphQLTypes["StringOperators"] | undefined,
	data?: GraphQLTypes["StringOperators"] | undefined,
	registerToNewsletter?: GraphQLTypes["BooleanOperators"] | undefined,
	options?: GraphQLTypes["StringOperators"] | undefined,
	seen?: GraphQLTypes["BooleanOperators"] | undefined
};
	["BackInStockSubscriberSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	email?: GraphQLTypes["SortOrder"] | undefined,
	data?: GraphQLTypes["SortOrder"] | undefined,
	options?: GraphQLTypes["SortOrder"] | undefined
};
	["B2BSubscriberFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	name?: GraphQLTypes["StringOperators"] | undefined,
	email?: GraphQLTypes["StringOperators"] | undefined,
	NIP?: GraphQLTypes["StringOperators"] | undefined,
	city?: GraphQLTypes["StringOperators"] | undefined,
	number?: GraphQLTypes["StringOperators"] | undefined,
	message?: GraphQLTypes["StringOperators"] | undefined,
	seen?: GraphQLTypes["BooleanOperators"] | undefined
};
	["B2BSubscriberSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	name?: GraphQLTypes["SortOrder"] | undefined,
	email?: GraphQLTypes["SortOrder"] | undefined,
	NIP?: GraphQLTypes["SortOrder"] | undefined,
	city?: GraphQLTypes["SortOrder"] | undefined,
	number?: GraphQLTypes["SortOrder"] | undefined,
	message?: GraphQLTypes["SortOrder"] | undefined
};
	["ModelFilterParameter"]: {
		id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	title?: GraphQLTypes["StringOperators"] | undefined,
	content?: GraphQLTypes["StringOperators"] | undefined,
	url?: GraphQLTypes["StringOperators"] | undefined,
	key?: GraphQLTypes["StringOperators"] | undefined
};
	["ModelSortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined,
	title?: GraphQLTypes["SortOrder"] | undefined,
	content?: GraphQLTypes["SortOrder"] | undefined,
	url?: GraphQLTypes["SortOrder"] | undefined,
	key?: GraphQLTypes["SortOrder"] | undefined
};
	["HistoryEntryFilterParameter"]: {
		isPublic?: GraphQLTypes["BooleanOperators"] | undefined,
	id?: GraphQLTypes["IDOperators"] | undefined,
	createdAt?: GraphQLTypes["DateOperators"] | undefined,
	updatedAt?: GraphQLTypes["DateOperators"] | undefined,
	type?: GraphQLTypes["StringOperators"] | undefined
};
	["HistoryEntrySortParameter"]: {
		id?: GraphQLTypes["SortOrder"] | undefined,
	createdAt?: GraphQLTypes["SortOrder"] | undefined,
	updatedAt?: GraphQLTypes["SortOrder"] | undefined
};
	["AddressCustomFields"]: {
	__typename: "AddressCustomFields",
	companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["CreateAddressCustomFieldsInput"]: {
		companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["UpdateAddressCustomFieldsInput"]: {
		companyName?: string | undefined,
	companyTaxId?: string | undefined
};
	["CollectionCustomFields"]: {
	__typename: "CollectionCustomFields",
	seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	facebookImage?: GraphQLTypes["Asset"] | undefined,
	twitterImage?: GraphQLTypes["Asset"] | undefined
};
	["CollectionTranslationCustomFields"]: {
	__typename: "CollectionTranslationCustomFields",
	seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["CreateCollectionCustomFieldsInput"]: {
		facebookImageId?: string | undefined,
	twitterImageId?: string | undefined
};
	["UpdateCollectionCustomFieldsInput"]: {
		facebookImageId?: string | undefined,
	twitterImageId?: string | undefined
};
	["CreateCollectionTranslationInputCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["UpdateCollectionTranslationInputCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined
};
	["FacetCustomFields"]: {
	__typename: "FacetCustomFields",
	usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["CreateFacetCustomFieldsInput"]: {
		usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["UpdateFacetCustomFieldsInput"]: {
		usedForColors?: boolean | undefined,
	usedForProductCreations?: boolean | undefined,
	colorsCollection?: boolean | undefined
};
	["FacetValueCustomFields"]: {
	__typename: "FacetValueCustomFields",
	image?: GraphQLTypes["Asset"] | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["CreateFacetValueCustomFieldsInput"]: {
		imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["UpdateFacetValueCustomFieldsInput"]: {
		imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["OrderCustomFields"]: {
	__typename: "OrderCustomFields",
	registeredOnCheckout?: boolean | undefined,
	selectedPaymentMethod?: GraphQLTypes["PaymentMethod"] | undefined,
	additionalInformation?: string | undefined
};
	["UpdateOrderCustomFieldsInput"]: {
		registeredOnCheckout?: boolean | undefined,
	selectedPaymentMethodId?: string | undefined,
	additionalInformation?: string | undefined
};
	["OrderLineCustomFields"]: {
	__typename: "OrderLineCustomFields",
	attributes?: string | undefined,
	discountBy?: number | undefined,
	selectedImage?: GraphQLTypes["Asset"] | undefined
};
	["PaymentMethodCustomFields"]: {
	__typename: "PaymentMethodCustomFields",
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["PaymentMethodTranslationCustomFields"]: {
	__typename: "PaymentMethodTranslationCustomFields",
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["PaymentMethodTranslationInputCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ProductCustomFields"]: {
	__typename: "ProductCustomFields",
	seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	facebookImage?: GraphQLTypes["Asset"] | undefined,
	twitterImage?: GraphQLTypes["Asset"] | undefined,
	optionsOrder?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined,
	discountBy?: number | undefined
};
	["ProductTranslationCustomFields"]: {
	__typename: "ProductTranslationCustomFields",
	seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined
};
	["CreateProductCustomFieldsInput"]: {
		facebookImageId?: string | undefined,
	twitterImageId?: string | undefined,
	optionsOrder?: string | undefined,
	discountBy?: number | undefined
};
	["UpdateProductCustomFieldsInput"]: {
		facebookImageId?: string | undefined,
	twitterImageId?: string | undefined,
	optionsOrder?: string | undefined,
	discountBy?: number | undefined
};
	["ProductTranslationInputCustomFields"]: {
		seoTitle?: string | undefined,
	seoDescription?: string | undefined,
	sizes?: string | undefined,
	finish?: string | undefined,
	materials?: string | undefined,
	payment?: string | undefined,
	delivery?: string | undefined,
	realization?: string | undefined
};
	["ProductOptionCustomFields"]: {
	__typename: "ProductOptionCustomFields",
	image?: GraphQLTypes["Asset"] | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["CreateProductOptionCustomFieldsInput"]: {
		imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["UpdateProductOptionCustomFieldsInput"]: {
		imageId?: string | undefined,
	hexColor?: string | undefined,
	isNew?: boolean | undefined
};
	["ShippingMethodCustomFields"]: {
	__typename: "ShippingMethodCustomFields",
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ShippingMethodTranslationCustomFields"]: {
	__typename: "ShippingMethodTranslationCustomFields",
	modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["ShippingMethodTranslationInputCustomFields"]: {
		modalTitle?: string | undefined,
	modalDescription?: string | undefined,
	modalAdditionalDescription?: string | undefined
};
	["OrderLineCustomFieldsInput"]: {
		attributes?: string | undefined,
	discountBy?: number | undefined,
	selectedImageId?: string | undefined
};
	["NativeAuthInput"]: {
		username: string,
	password: string
};
	["CustomFields"]: {
	__typename: "CustomFields",
	Address: Array<GraphQLTypes["CustomFieldConfig"]>,
	Administrator: Array<GraphQLTypes["CustomFieldConfig"]>,
	Asset: Array<GraphQLTypes["CustomFieldConfig"]>,
	Channel: Array<GraphQLTypes["CustomFieldConfig"]>,
	Collection: Array<GraphQLTypes["CustomFieldConfig"]>,
	Customer: Array<GraphQLTypes["CustomFieldConfig"]>,
	CustomerGroup: Array<GraphQLTypes["CustomFieldConfig"]>,
	Facet: Array<GraphQLTypes["CustomFieldConfig"]>,
	FacetValue: Array<GraphQLTypes["CustomFieldConfig"]>,
	Fulfillment: Array<GraphQLTypes["CustomFieldConfig"]>,
	GlobalSettings: Array<GraphQLTypes["CustomFieldConfig"]>,
	Order: Array<GraphQLTypes["CustomFieldConfig"]>,
	OrderLine: Array<GraphQLTypes["CustomFieldConfig"]>,
	PaymentMethod: Array<GraphQLTypes["CustomFieldConfig"]>,
	Product: Array<GraphQLTypes["CustomFieldConfig"]>,
	ProductOption: Array<GraphQLTypes["CustomFieldConfig"]>,
	ProductOptionGroup: Array<GraphQLTypes["CustomFieldConfig"]>,
	ProductVariant: Array<GraphQLTypes["CustomFieldConfig"]>,
	Promotion: Array<GraphQLTypes["CustomFieldConfig"]>,
	Region: Array<GraphQLTypes["CustomFieldConfig"]>,
	Seller: Array<GraphQLTypes["CustomFieldConfig"]>,
	ShippingMethod: Array<GraphQLTypes["CustomFieldConfig"]>,
	StockLocation: Array<GraphQLTypes["CustomFieldConfig"]>,
	TaxCategory: Array<GraphQLTypes["CustomFieldConfig"]>,
	TaxRate: Array<GraphQLTypes["CustomFieldConfig"]>,
	User: Array<GraphQLTypes["CustomFieldConfig"]>,
	Zone: Array<GraphQLTypes["CustomFieldConfig"]>
}
    }
/** @description
The state of a Job in the JobQueue

@docsCategory common */
export const enum JobState {
	PENDING = "PENDING",
	RUNNING = "RUNNING",
	COMPLETED = "COMPLETED",
	RETRYING = "RETRYING",
	FAILED = "FAILED",
	CANCELLED = "CANCELLED"
}
export const enum StockMovementType {
	ADJUSTMENT = "ADJUSTMENT",
	ALLOCATION = "ALLOCATION",
	RELEASE = "RELEASE",
	SALE = "SALE",
	CANCELLATION = "CANCELLATION",
	RETURN = "RETURN"
}
export const enum AssetType {
	IMAGE = "IMAGE",
	VIDEO = "VIDEO",
	BINARY = "BINARY"
}
export const enum GlobalFlag {
	TRUE = "TRUE",
	FALSE = "FALSE",
	INHERIT = "INHERIT"
}
export const enum AdjustmentType {
	PROMOTION = "PROMOTION",
	DISTRIBUTED_ORDER_PROMOTION = "DISTRIBUTED_ORDER_PROMOTION",
	OTHER = "OTHER"
}
export const enum DeletionResult {
	DELETED = "DELETED",
	NOT_DELETED = "NOT_DELETED"
}
/** @description
Permissions for administrators and customers. Used to control access to
GraphQL resolvers via the {@link Allow} decorator.

## Understanding Permission.Owner

`Permission.Owner` is a special permission which is used in some Vendure resolvers to indicate that that resolver should only
be accessible to the "owner" of that resource.

For example, the Shop API `activeCustomer` query resolver should only return the Customer object for the "owner" of that Customer, i.e.
based on the activeUserId of the current session. As a result, the resolver code looks like this:

@example
```TypeScript
\@Query()
\@Allow(Permission.Owner)
async activeCustomer(\@Ctx() ctx: RequestContext): Promise<Customer | undefined> {
  const userId = ctx.activeUserId;
  if (userId) {
    return this.customerService.findOneByUserId(ctx, userId);
  }
}
```

Here we can see that the "ownership" must be enforced by custom logic inside the resolver. Since "ownership" cannot be defined generally
nor statically encoded at build-time, any resolvers using `Permission.Owner` **must** include logic to enforce that only the owner
of the resource has access. If not, then it is the equivalent of using `Permission.Public`.


@docsCategory common */
export const enum Permission {
	Authenticated = "Authenticated",
	SuperAdmin = "SuperAdmin",
	Owner = "Owner",
	Public = "Public",
	UpdateGlobalSettings = "UpdateGlobalSettings",
	CreateCatalog = "CreateCatalog",
	ReadCatalog = "ReadCatalog",
	UpdateCatalog = "UpdateCatalog",
	DeleteCatalog = "DeleteCatalog",
	CreateSettings = "CreateSettings",
	ReadSettings = "ReadSettings",
	UpdateSettings = "UpdateSettings",
	DeleteSettings = "DeleteSettings",
	CreateAdministrator = "CreateAdministrator",
	ReadAdministrator = "ReadAdministrator",
	UpdateAdministrator = "UpdateAdministrator",
	DeleteAdministrator = "DeleteAdministrator",
	CreateAsset = "CreateAsset",
	ReadAsset = "ReadAsset",
	UpdateAsset = "UpdateAsset",
	DeleteAsset = "DeleteAsset",
	CreateChannel = "CreateChannel",
	ReadChannel = "ReadChannel",
	UpdateChannel = "UpdateChannel",
	DeleteChannel = "DeleteChannel",
	CreateCollection = "CreateCollection",
	ReadCollection = "ReadCollection",
	UpdateCollection = "UpdateCollection",
	DeleteCollection = "DeleteCollection",
	CreateCountry = "CreateCountry",
	ReadCountry = "ReadCountry",
	UpdateCountry = "UpdateCountry",
	DeleteCountry = "DeleteCountry",
	CreateCustomer = "CreateCustomer",
	ReadCustomer = "ReadCustomer",
	UpdateCustomer = "UpdateCustomer",
	DeleteCustomer = "DeleteCustomer",
	CreateCustomerGroup = "CreateCustomerGroup",
	ReadCustomerGroup = "ReadCustomerGroup",
	UpdateCustomerGroup = "UpdateCustomerGroup",
	DeleteCustomerGroup = "DeleteCustomerGroup",
	CreateFacet = "CreateFacet",
	ReadFacet = "ReadFacet",
	UpdateFacet = "UpdateFacet",
	DeleteFacet = "DeleteFacet",
	CreateOrder = "CreateOrder",
	ReadOrder = "ReadOrder",
	UpdateOrder = "UpdateOrder",
	DeleteOrder = "DeleteOrder",
	CreatePaymentMethod = "CreatePaymentMethod",
	ReadPaymentMethod = "ReadPaymentMethod",
	UpdatePaymentMethod = "UpdatePaymentMethod",
	DeletePaymentMethod = "DeletePaymentMethod",
	CreateProduct = "CreateProduct",
	ReadProduct = "ReadProduct",
	UpdateProduct = "UpdateProduct",
	DeleteProduct = "DeleteProduct",
	CreatePromotion = "CreatePromotion",
	ReadPromotion = "ReadPromotion",
	UpdatePromotion = "UpdatePromotion",
	DeletePromotion = "DeletePromotion",
	CreateShippingMethod = "CreateShippingMethod",
	ReadShippingMethod = "ReadShippingMethod",
	UpdateShippingMethod = "UpdateShippingMethod",
	DeleteShippingMethod = "DeleteShippingMethod",
	CreateTag = "CreateTag",
	ReadTag = "ReadTag",
	UpdateTag = "UpdateTag",
	DeleteTag = "DeleteTag",
	CreateTaxCategory = "CreateTaxCategory",
	ReadTaxCategory = "ReadTaxCategory",
	UpdateTaxCategory = "UpdateTaxCategory",
	DeleteTaxCategory = "DeleteTaxCategory",
	CreateTaxRate = "CreateTaxRate",
	ReadTaxRate = "ReadTaxRate",
	UpdateTaxRate = "UpdateTaxRate",
	DeleteTaxRate = "DeleteTaxRate",
	CreateSeller = "CreateSeller",
	ReadSeller = "ReadSeller",
	UpdateSeller = "UpdateSeller",
	DeleteSeller = "DeleteSeller",
	CreateStockLocation = "CreateStockLocation",
	ReadStockLocation = "ReadStockLocation",
	UpdateStockLocation = "UpdateStockLocation",
	DeleteStockLocation = "DeleteStockLocation",
	CreateSystem = "CreateSystem",
	ReadSystem = "ReadSystem",
	UpdateSystem = "UpdateSystem",
	DeleteSystem = "DeleteSystem",
	CreateZone = "CreateZone",
	ReadZone = "ReadZone",
	UpdateZone = "UpdateZone",
	DeleteZone = "DeleteZone"
}
export const enum SortOrder {
	ASC = "ASC",
	DESC = "DESC"
}
export const enum ErrorCode {
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
	MIME_TYPE_ERROR = "MIME_TYPE_ERROR",
	LANGUAGE_NOT_AVAILABLE_ERROR = "LANGUAGE_NOT_AVAILABLE_ERROR",
	FACET_IN_USE_ERROR = "FACET_IN_USE_ERROR",
	CHANNEL_DEFAULT_LANGUAGE_ERROR = "CHANNEL_DEFAULT_LANGUAGE_ERROR",
	SETTLE_PAYMENT_ERROR = "SETTLE_PAYMENT_ERROR",
	CANCEL_PAYMENT_ERROR = "CANCEL_PAYMENT_ERROR",
	EMPTY_ORDER_LINE_SELECTION_ERROR = "EMPTY_ORDER_LINE_SELECTION_ERROR",
	ITEMS_ALREADY_FULFILLED_ERROR = "ITEMS_ALREADY_FULFILLED_ERROR",
	INVALID_FULFILLMENT_HANDLER_ERROR = "INVALID_FULFILLMENT_HANDLER_ERROR",
	CREATE_FULFILLMENT_ERROR = "CREATE_FULFILLMENT_ERROR",
	INSUFFICIENT_STOCK_ON_HAND_ERROR = "INSUFFICIENT_STOCK_ON_HAND_ERROR",
	MULTIPLE_ORDER_ERROR = "MULTIPLE_ORDER_ERROR",
	CANCEL_ACTIVE_ORDER_ERROR = "CANCEL_ACTIVE_ORDER_ERROR",
	PAYMENT_ORDER_MISMATCH_ERROR = "PAYMENT_ORDER_MISMATCH_ERROR",
	REFUND_ORDER_STATE_ERROR = "REFUND_ORDER_STATE_ERROR",
	NOTHING_TO_REFUND_ERROR = "NOTHING_TO_REFUND_ERROR",
	ALREADY_REFUNDED_ERROR = "ALREADY_REFUNDED_ERROR",
	QUANTITY_TOO_GREAT_ERROR = "QUANTITY_TOO_GREAT_ERROR",
	REFUND_STATE_TRANSITION_ERROR = "REFUND_STATE_TRANSITION_ERROR",
	PAYMENT_STATE_TRANSITION_ERROR = "PAYMENT_STATE_TRANSITION_ERROR",
	FULFILLMENT_STATE_TRANSITION_ERROR = "FULFILLMENT_STATE_TRANSITION_ERROR",
	ORDER_MODIFICATION_STATE_ERROR = "ORDER_MODIFICATION_STATE_ERROR",
	NO_CHANGES_SPECIFIED_ERROR = "NO_CHANGES_SPECIFIED_ERROR",
	PAYMENT_METHOD_MISSING_ERROR = "PAYMENT_METHOD_MISSING_ERROR",
	REFUND_PAYMENT_ID_MISSING_ERROR = "REFUND_PAYMENT_ID_MISSING_ERROR",
	MANUAL_PAYMENT_STATE_ERROR = "MANUAL_PAYMENT_STATE_ERROR",
	PRODUCT_OPTION_IN_USE_ERROR = "PRODUCT_OPTION_IN_USE_ERROR",
	MISSING_CONDITIONS_ERROR = "MISSING_CONDITIONS_ERROR",
	NATIVE_AUTH_STRATEGY_ERROR = "NATIVE_AUTH_STRATEGY_ERROR",
	INVALID_CREDENTIALS_ERROR = "INVALID_CREDENTIALS_ERROR",
	ORDER_STATE_TRANSITION_ERROR = "ORDER_STATE_TRANSITION_ERROR",
	EMAIL_ADDRESS_CONFLICT_ERROR = "EMAIL_ADDRESS_CONFLICT_ERROR",
	GUEST_CHECKOUT_ERROR = "GUEST_CHECKOUT_ERROR",
	ORDER_LIMIT_ERROR = "ORDER_LIMIT_ERROR",
	NEGATIVE_QUANTITY_ERROR = "NEGATIVE_QUANTITY_ERROR",
	INSUFFICIENT_STOCK_ERROR = "INSUFFICIENT_STOCK_ERROR",
	COUPON_CODE_INVALID_ERROR = "COUPON_CODE_INVALID_ERROR",
	COUPON_CODE_EXPIRED_ERROR = "COUPON_CODE_EXPIRED_ERROR",
	COUPON_CODE_LIMIT_ERROR = "COUPON_CODE_LIMIT_ERROR",
	ORDER_MODIFICATION_ERROR = "ORDER_MODIFICATION_ERROR",
	INELIGIBLE_SHIPPING_METHOD_ERROR = "INELIGIBLE_SHIPPING_METHOD_ERROR",
	NO_ACTIVE_ORDER_ERROR = "NO_ACTIVE_ORDER_ERROR"
}
export const enum LogicalOperator {
	AND = "AND",
	OR = "OR"
}
/** @description
ISO 4217 currency code

@docsCategory common */
export const enum CurrencyCode {
	AED = "AED",
	AFN = "AFN",
	ALL = "ALL",
	AMD = "AMD",
	ANG = "ANG",
	AOA = "AOA",
	ARS = "ARS",
	AUD = "AUD",
	AWG = "AWG",
	AZN = "AZN",
	BAM = "BAM",
	BBD = "BBD",
	BDT = "BDT",
	BGN = "BGN",
	BHD = "BHD",
	BIF = "BIF",
	BMD = "BMD",
	BND = "BND",
	BOB = "BOB",
	BRL = "BRL",
	BSD = "BSD",
	BTN = "BTN",
	BWP = "BWP",
	BYN = "BYN",
	BZD = "BZD",
	CAD = "CAD",
	CDF = "CDF",
	CHF = "CHF",
	CLP = "CLP",
	CNY = "CNY",
	COP = "COP",
	CRC = "CRC",
	CUC = "CUC",
	CUP = "CUP",
	CVE = "CVE",
	CZK = "CZK",
	DJF = "DJF",
	DKK = "DKK",
	DOP = "DOP",
	DZD = "DZD",
	EGP = "EGP",
	ERN = "ERN",
	ETB = "ETB",
	EUR = "EUR",
	FJD = "FJD",
	FKP = "FKP",
	GBP = "GBP",
	GEL = "GEL",
	GHS = "GHS",
	GIP = "GIP",
	GMD = "GMD",
	GNF = "GNF",
	GTQ = "GTQ",
	GYD = "GYD",
	HKD = "HKD",
	HNL = "HNL",
	HRK = "HRK",
	HTG = "HTG",
	HUF = "HUF",
	IDR = "IDR",
	ILS = "ILS",
	INR = "INR",
	IQD = "IQD",
	IRR = "IRR",
	ISK = "ISK",
	JMD = "JMD",
	JOD = "JOD",
	JPY = "JPY",
	KES = "KES",
	KGS = "KGS",
	KHR = "KHR",
	KMF = "KMF",
	KPW = "KPW",
	KRW = "KRW",
	KWD = "KWD",
	KYD = "KYD",
	KZT = "KZT",
	LAK = "LAK",
	LBP = "LBP",
	LKR = "LKR",
	LRD = "LRD",
	LSL = "LSL",
	LYD = "LYD",
	MAD = "MAD",
	MDL = "MDL",
	MGA = "MGA",
	MKD = "MKD",
	MMK = "MMK",
	MNT = "MNT",
	MOP = "MOP",
	MRU = "MRU",
	MUR = "MUR",
	MVR = "MVR",
	MWK = "MWK",
	MXN = "MXN",
	MYR = "MYR",
	MZN = "MZN",
	NAD = "NAD",
	NGN = "NGN",
	NIO = "NIO",
	NOK = "NOK",
	NPR = "NPR",
	NZD = "NZD",
	OMR = "OMR",
	PAB = "PAB",
	PEN = "PEN",
	PGK = "PGK",
	PHP = "PHP",
	PKR = "PKR",
	PLN = "PLN",
	PYG = "PYG",
	QAR = "QAR",
	RON = "RON",
	RSD = "RSD",
	RUB = "RUB",
	RWF = "RWF",
	SAR = "SAR",
	SBD = "SBD",
	SCR = "SCR",
	SDG = "SDG",
	SEK = "SEK",
	SGD = "SGD",
	SHP = "SHP",
	SLL = "SLL",
	SOS = "SOS",
	SRD = "SRD",
	SSP = "SSP",
	STN = "STN",
	SVC = "SVC",
	SYP = "SYP",
	SZL = "SZL",
	THB = "THB",
	TJS = "TJS",
	TMT = "TMT",
	TND = "TND",
	TOP = "TOP",
	TRY = "TRY",
	TTD = "TTD",
	TWD = "TWD",
	TZS = "TZS",
	UAH = "UAH",
	UGX = "UGX",
	USD = "USD",
	UYU = "UYU",
	UZS = "UZS",
	VES = "VES",
	VND = "VND",
	VUV = "VUV",
	WST = "WST",
	XAF = "XAF",
	XCD = "XCD",
	XOF = "XOF",
	XPF = "XPF",
	YER = "YER",
	ZAR = "ZAR",
	ZMW = "ZMW",
	ZWL = "ZWL"
}
export const enum HistoryEntryType {
	CUSTOMER_REGISTERED = "CUSTOMER_REGISTERED",
	CUSTOMER_VERIFIED = "CUSTOMER_VERIFIED",
	CUSTOMER_DETAIL_UPDATED = "CUSTOMER_DETAIL_UPDATED",
	CUSTOMER_ADDED_TO_GROUP = "CUSTOMER_ADDED_TO_GROUP",
	CUSTOMER_REMOVED_FROM_GROUP = "CUSTOMER_REMOVED_FROM_GROUP",
	CUSTOMER_ADDRESS_CREATED = "CUSTOMER_ADDRESS_CREATED",
	CUSTOMER_ADDRESS_UPDATED = "CUSTOMER_ADDRESS_UPDATED",
	CUSTOMER_ADDRESS_DELETED = "CUSTOMER_ADDRESS_DELETED",
	CUSTOMER_PASSWORD_UPDATED = "CUSTOMER_PASSWORD_UPDATED",
	CUSTOMER_PASSWORD_RESET_REQUESTED = "CUSTOMER_PASSWORD_RESET_REQUESTED",
	CUSTOMER_PASSWORD_RESET_VERIFIED = "CUSTOMER_PASSWORD_RESET_VERIFIED",
	CUSTOMER_EMAIL_UPDATE_REQUESTED = "CUSTOMER_EMAIL_UPDATE_REQUESTED",
	CUSTOMER_EMAIL_UPDATE_VERIFIED = "CUSTOMER_EMAIL_UPDATE_VERIFIED",
	CUSTOMER_NOTE = "CUSTOMER_NOTE",
	ORDER_STATE_TRANSITION = "ORDER_STATE_TRANSITION",
	ORDER_PAYMENT_TRANSITION = "ORDER_PAYMENT_TRANSITION",
	ORDER_FULFILLMENT = "ORDER_FULFILLMENT",
	ORDER_CANCELLATION = "ORDER_CANCELLATION",
	ORDER_REFUND_TRANSITION = "ORDER_REFUND_TRANSITION",
	ORDER_FULFILLMENT_TRANSITION = "ORDER_FULFILLMENT_TRANSITION",
	ORDER_NOTE = "ORDER_NOTE",
	ORDER_COUPON_APPLIED = "ORDER_COUPON_APPLIED",
	ORDER_COUPON_REMOVED = "ORDER_COUPON_REMOVED",
	ORDER_MODIFIED = "ORDER_MODIFIED"
}
/** @description
Languages in the form of a ISO 639-1 language code with optional
region or script modifier (e.g. de_AT). The selection available is based
on the [Unicode CLDR summary list](https://unicode-org.github.io/cldr-staging/charts/37/summary/root.html)
and includes the major spoken languages of the world and any widely-used variants.

@docsCategory common */
export const enum LanguageCode {
	af = "af",
	ak = "ak",
	sq = "sq",
	am = "am",
	ar = "ar",
	hy = "hy",
	as = "as",
	az = "az",
	bm = "bm",
	bn = "bn",
	eu = "eu",
	be = "be",
	bs = "bs",
	br = "br",
	bg = "bg",
	my = "my",
	ca = "ca",
	ce = "ce",
	zh = "zh",
	zh_Hans = "zh_Hans",
	zh_Hant = "zh_Hant",
	cu = "cu",
	kw = "kw",
	co = "co",
	hr = "hr",
	cs = "cs",
	da = "da",
	nl = "nl",
	nl_BE = "nl_BE",
	dz = "dz",
	en = "en",
	en_AU = "en_AU",
	en_CA = "en_CA",
	en_GB = "en_GB",
	en_US = "en_US",
	eo = "eo",
	et = "et",
	ee = "ee",
	fo = "fo",
	fi = "fi",
	fr = "fr",
	fr_CA = "fr_CA",
	fr_CH = "fr_CH",
	ff = "ff",
	gl = "gl",
	lg = "lg",
	ka = "ka",
	de = "de",
	de_AT = "de_AT",
	de_CH = "de_CH",
	el = "el",
	gu = "gu",
	ht = "ht",
	ha = "ha",
	he = "he",
	hi = "hi",
	hu = "hu",
	is = "is",
	ig = "ig",
	id = "id",
	ia = "ia",
	ga = "ga",
	it = "it",
	ja = "ja",
	jv = "jv",
	kl = "kl",
	kn = "kn",
	ks = "ks",
	kk = "kk",
	km = "km",
	ki = "ki",
	rw = "rw",
	ko = "ko",
	ku = "ku",
	ky = "ky",
	lo = "lo",
	la = "la",
	lv = "lv",
	ln = "ln",
	lt = "lt",
	lu = "lu",
	lb = "lb",
	mk = "mk",
	mg = "mg",
	ms = "ms",
	ml = "ml",
	mt = "mt",
	gv = "gv",
	mi = "mi",
	mr = "mr",
	mn = "mn",
	ne = "ne",
	nd = "nd",
	se = "se",
	nb = "nb",
	nn = "nn",
	ny = "ny",
	or = "or",
	om = "om",
	os = "os",
	ps = "ps",
	fa = "fa",
	fa_AF = "fa_AF",
	pl = "pl",
	pt = "pt",
	pt_BR = "pt_BR",
	pt_PT = "pt_PT",
	pa = "pa",
	qu = "qu",
	ro = "ro",
	ro_MD = "ro_MD",
	rm = "rm",
	rn = "rn",
	ru = "ru",
	sm = "sm",
	sg = "sg",
	sa = "sa",
	gd = "gd",
	sr = "sr",
	sn = "sn",
	ii = "ii",
	sd = "sd",
	si = "si",
	sk = "sk",
	sl = "sl",
	so = "so",
	st = "st",
	es = "es",
	es_ES = "es_ES",
	es_MX = "es_MX",
	su = "su",
	sw = "sw",
	sw_CD = "sw_CD",
	sv = "sv",
	tg = "tg",
	ta = "ta",
	tt = "tt",
	te = "te",
	th = "th",
	bo = "bo",
	ti = "ti",
	to = "to",
	tr = "tr",
	tk = "tk",
	uk = "uk",
	ur = "ur",
	ug = "ug",
	uz = "uz",
	vi = "vi",
	vo = "vo",
	cy = "cy",
	fy = "fy",
	wo = "wo",
	xh = "xh",
	yi = "yi",
	yo = "yo",
	zu = "zu"
}
export const enum OrderType {
	Regular = "Regular",
	Seller = "Seller",
	Aggregate = "Aggregate"
}
export const enum MetricInterval {
	Daily = "Daily"
}
export const enum MetricType {
	OrderCount = "OrderCount",
	OrderTotal = "OrderTotal",
	AverageOrderValue = "AverageOrderValue"
}
export const enum PageType {
	BLOG = "BLOG",
	PAGE = "PAGE"
}

type ZEUS_VARIABLES = {
	["AdministratorListOptions"]: ValueTypes["AdministratorListOptions"];
	["CreateAdministratorInput"]: ValueTypes["CreateAdministratorInput"];
	["UpdateAdministratorInput"]: ValueTypes["UpdateAdministratorInput"];
	["UpdateActiveAdministratorInput"]: ValueTypes["UpdateActiveAdministratorInput"];
	["AssetListOptions"]: ValueTypes["AssetListOptions"];
	["CreateAssetInput"]: ValueTypes["CreateAssetInput"];
	["CoordinateInput"]: ValueTypes["CoordinateInput"];
	["DeleteAssetInput"]: ValueTypes["DeleteAssetInput"];
	["DeleteAssetsInput"]: ValueTypes["DeleteAssetsInput"];
	["UpdateAssetInput"]: ValueTypes["UpdateAssetInput"];
	["AssignAssetsToChannelInput"]: ValueTypes["AssignAssetsToChannelInput"];
	["AuthenticationInput"]: ValueTypes["AuthenticationInput"];
	["ChannelListOptions"]: ValueTypes["ChannelListOptions"];
	["CreateChannelInput"]: ValueTypes["CreateChannelInput"];
	["UpdateChannelInput"]: ValueTypes["UpdateChannelInput"];
	["CollectionListOptions"]: ValueTypes["CollectionListOptions"];
	["MoveCollectionInput"]: ValueTypes["MoveCollectionInput"];
	["CreateCollectionTranslationInput"]: ValueTypes["CreateCollectionTranslationInput"];
	["UpdateCollectionTranslationInput"]: ValueTypes["UpdateCollectionTranslationInput"];
	["CreateCollectionInput"]: ValueTypes["CreateCollectionInput"];
	["PreviewCollectionVariantsInput"]: ValueTypes["PreviewCollectionVariantsInput"];
	["UpdateCollectionInput"]: ValueTypes["UpdateCollectionInput"];
	["AssignCollectionsToChannelInput"]: ValueTypes["AssignCollectionsToChannelInput"];
	["RemoveCollectionsFromChannelInput"]: ValueTypes["RemoveCollectionsFromChannelInput"];
	["CountryTranslationInput"]: ValueTypes["CountryTranslationInput"];
	["CreateCountryInput"]: ValueTypes["CreateCountryInput"];
	["UpdateCountryInput"]: ValueTypes["UpdateCountryInput"];
	["CountryListOptions"]: ValueTypes["CountryListOptions"];
	["CustomerGroupListOptions"]: ValueTypes["CustomerGroupListOptions"];
	["CreateCustomerGroupInput"]: ValueTypes["CreateCustomerGroupInput"];
	["UpdateCustomerGroupInput"]: ValueTypes["UpdateCustomerGroupInput"];
	["UpdateCustomerInput"]: ValueTypes["UpdateCustomerInput"];
	["CustomerFilterParameter"]: ValueTypes["CustomerFilterParameter"];
	["CustomerListOptions"]: ValueTypes["CustomerListOptions"];
	["AddNoteToCustomerInput"]: ValueTypes["AddNoteToCustomerInput"];
	["UpdateCustomerNoteInput"]: ValueTypes["UpdateCustomerNoteInput"];
	["FacetListOptions"]: ValueTypes["FacetListOptions"];
	["FacetTranslationInput"]: ValueTypes["FacetTranslationInput"];
	["CreateFacetInput"]: ValueTypes["CreateFacetInput"];
	["UpdateFacetInput"]: ValueTypes["UpdateFacetInput"];
	["FacetValueTranslationInput"]: ValueTypes["FacetValueTranslationInput"];
	["CreateFacetValueWithFacetInput"]: ValueTypes["CreateFacetValueWithFacetInput"];
	["CreateFacetValueInput"]: ValueTypes["CreateFacetValueInput"];
	["UpdateFacetValueInput"]: ValueTypes["UpdateFacetValueInput"];
	["AssignFacetsToChannelInput"]: ValueTypes["AssignFacetsToChannelInput"];
	["RemoveFacetsFromChannelInput"]: ValueTypes["RemoveFacetsFromChannelInput"];
	["UpdateGlobalSettingsInput"]: ValueTypes["UpdateGlobalSettingsInput"];
	["JobState"]: ValueTypes["JobState"];
	["JobListOptions"]: ValueTypes["JobListOptions"];
	["OrderFilterParameter"]: ValueTypes["OrderFilterParameter"];
	["OrderSortParameter"]: ValueTypes["OrderSortParameter"];
	["OrderListOptions"]: ValueTypes["OrderListOptions"];
	["UpdateOrderInput"]: ValueTypes["UpdateOrderInput"];
	["FulfillOrderInput"]: ValueTypes["FulfillOrderInput"];
	["CancelOrderInput"]: ValueTypes["CancelOrderInput"];
	["RefundOrderInput"]: ValueTypes["RefundOrderInput"];
	["OrderLineInput"]: ValueTypes["OrderLineInput"];
	["SettleRefundInput"]: ValueTypes["SettleRefundInput"];
	["AddNoteToOrderInput"]: ValueTypes["AddNoteToOrderInput"];
	["UpdateOrderNoteInput"]: ValueTypes["UpdateOrderNoteInput"];
	["AdministratorPaymentInput"]: ValueTypes["AdministratorPaymentInput"];
	["AdministratorRefundInput"]: ValueTypes["AdministratorRefundInput"];
	["ModifyOrderOptions"]: ValueTypes["ModifyOrderOptions"];
	["UpdateOrderAddressInput"]: ValueTypes["UpdateOrderAddressInput"];
	["ModifyOrderInput"]: ValueTypes["ModifyOrderInput"];
	["AddItemInput"]: ValueTypes["AddItemInput"];
	["SurchargeInput"]: ValueTypes["SurchargeInput"];
	["ManualPaymentInput"]: ValueTypes["ManualPaymentInput"];
	["AddItemToDraftOrderInput"]: ValueTypes["AddItemToDraftOrderInput"];
	["AdjustDraftOrderLineInput"]: ValueTypes["AdjustDraftOrderLineInput"];
	["PaymentMethodListOptions"]: ValueTypes["PaymentMethodListOptions"];
	["PaymentMethodTranslationInput"]: ValueTypes["PaymentMethodTranslationInput"];
	["CreatePaymentMethodInput"]: ValueTypes["CreatePaymentMethodInput"];
	["UpdatePaymentMethodInput"]: ValueTypes["UpdatePaymentMethodInput"];
	["AssignPaymentMethodsToChannelInput"]: ValueTypes["AssignPaymentMethodsToChannelInput"];
	["RemovePaymentMethodsFromChannelInput"]: ValueTypes["RemovePaymentMethodsFromChannelInput"];
	["ProductOptionGroupTranslationInput"]: ValueTypes["ProductOptionGroupTranslationInput"];
	["CreateProductOptionGroupInput"]: ValueTypes["CreateProductOptionGroupInput"];
	["UpdateProductOptionGroupInput"]: ValueTypes["UpdateProductOptionGroupInput"];
	["ProductOptionTranslationInput"]: ValueTypes["ProductOptionTranslationInput"];
	["CreateGroupOptionInput"]: ValueTypes["CreateGroupOptionInput"];
	["CreateProductOptionInput"]: ValueTypes["CreateProductOptionInput"];
	["UpdateProductOptionInput"]: ValueTypes["UpdateProductOptionInput"];
	["StockMovementListOptions"]: ValueTypes["StockMovementListOptions"];
	["ProductListOptions"]: ValueTypes["ProductListOptions"];
	["ProductFilterParameter"]: ValueTypes["ProductFilterParameter"];
	["ProductVariantListOptions"]: ValueTypes["ProductVariantListOptions"];
	["ProductVariantFilterParameter"]: ValueTypes["ProductVariantFilterParameter"];
	["ProductTranslationInput"]: ValueTypes["ProductTranslationInput"];
	["CreateProductInput"]: ValueTypes["CreateProductInput"];
	["UpdateProductInput"]: ValueTypes["UpdateProductInput"];
	["ProductVariantTranslationInput"]: ValueTypes["ProductVariantTranslationInput"];
	["CreateProductVariantOptionInput"]: ValueTypes["CreateProductVariantOptionInput"];
	["StockLevelInput"]: ValueTypes["StockLevelInput"];
	["ProductVariantPriceInput"]: ValueTypes["ProductVariantPriceInput"];
	["CreateProductVariantInput"]: ValueTypes["CreateProductVariantInput"];
	["UpdateProductVariantInput"]: ValueTypes["UpdateProductVariantInput"];
	["AssignProductsToChannelInput"]: ValueTypes["AssignProductsToChannelInput"];
	["RemoveProductsFromChannelInput"]: ValueTypes["RemoveProductsFromChannelInput"];
	["AssignProductVariantsToChannelInput"]: ValueTypes["AssignProductVariantsToChannelInput"];
	["RemoveProductVariantsFromChannelInput"]: ValueTypes["RemoveProductVariantsFromChannelInput"];
	["PromotionListOptions"]: ValueTypes["PromotionListOptions"];
	["PromotionTranslationInput"]: ValueTypes["PromotionTranslationInput"];
	["CreatePromotionInput"]: ValueTypes["CreatePromotionInput"];
	["UpdatePromotionInput"]: ValueTypes["UpdatePromotionInput"];
	["AssignPromotionsToChannelInput"]: ValueTypes["AssignPromotionsToChannelInput"];
	["RemovePromotionsFromChannelInput"]: ValueTypes["RemovePromotionsFromChannelInput"];
	["ProvinceTranslationInput"]: ValueTypes["ProvinceTranslationInput"];
	["CreateProvinceInput"]: ValueTypes["CreateProvinceInput"];
	["UpdateProvinceInput"]: ValueTypes["UpdateProvinceInput"];
	["ProvinceListOptions"]: ValueTypes["ProvinceListOptions"];
	["RoleListOptions"]: ValueTypes["RoleListOptions"];
	["CreateRoleInput"]: ValueTypes["CreateRoleInput"];
	["UpdateRoleInput"]: ValueTypes["UpdateRoleInput"];
	["SellerListOptions"]: ValueTypes["SellerListOptions"];
	["CreateSellerInput"]: ValueTypes["CreateSellerInput"];
	["UpdateSellerInput"]: ValueTypes["UpdateSellerInput"];
	["ShippingMethodListOptions"]: ValueTypes["ShippingMethodListOptions"];
	["ShippingMethodTranslationInput"]: ValueTypes["ShippingMethodTranslationInput"];
	["CreateShippingMethodInput"]: ValueTypes["CreateShippingMethodInput"];
	["UpdateShippingMethodInput"]: ValueTypes["UpdateShippingMethodInput"];
	["TestShippingMethodInput"]: ValueTypes["TestShippingMethodInput"];
	["TestEligibleShippingMethodsInput"]: ValueTypes["TestEligibleShippingMethodsInput"];
	["TestShippingMethodOrderLineInput"]: ValueTypes["TestShippingMethodOrderLineInput"];
	["AssignShippingMethodsToChannelInput"]: ValueTypes["AssignShippingMethodsToChannelInput"];
	["RemoveShippingMethodsFromChannelInput"]: ValueTypes["RemoveShippingMethodsFromChannelInput"];
	["StockLocationListOptions"]: ValueTypes["StockLocationListOptions"];
	["CreateStockLocationInput"]: ValueTypes["CreateStockLocationInput"];
	["UpdateStockLocationInput"]: ValueTypes["UpdateStockLocationInput"];
	["DeleteStockLocationInput"]: ValueTypes["DeleteStockLocationInput"];
	["AssignStockLocationsToChannelInput"]: ValueTypes["AssignStockLocationsToChannelInput"];
	["RemoveStockLocationsFromChannelInput"]: ValueTypes["RemoveStockLocationsFromChannelInput"];
	["StockMovementType"]: ValueTypes["StockMovementType"];
	["TagListOptions"]: ValueTypes["TagListOptions"];
	["CreateTagInput"]: ValueTypes["CreateTagInput"];
	["UpdateTagInput"]: ValueTypes["UpdateTagInput"];
	["TaxCategoryListOptions"]: ValueTypes["TaxCategoryListOptions"];
	["CreateTaxCategoryInput"]: ValueTypes["CreateTaxCategoryInput"];
	["UpdateTaxCategoryInput"]: ValueTypes["UpdateTaxCategoryInput"];
	["TaxRateListOptions"]: ValueTypes["TaxRateListOptions"];
	["CreateTaxRateInput"]: ValueTypes["CreateTaxRateInput"];
	["UpdateTaxRateInput"]: ValueTypes["UpdateTaxRateInput"];
	["ZoneListOptions"]: ValueTypes["ZoneListOptions"];
	["CreateZoneInput"]: ValueTypes["CreateZoneInput"];
	["UpdateZoneInput"]: ValueTypes["UpdateZoneInput"];
	["AssetType"]: ValueTypes["AssetType"];
	["GlobalFlag"]: ValueTypes["GlobalFlag"];
	["AdjustmentType"]: ValueTypes["AdjustmentType"];
	["DeletionResult"]: ValueTypes["DeletionResult"];
	["Permission"]: ValueTypes["Permission"];
	["SortOrder"]: ValueTypes["SortOrder"];
	["ErrorCode"]: ValueTypes["ErrorCode"];
	["LogicalOperator"]: ValueTypes["LogicalOperator"];
	["JSON"]: ValueTypes["JSON"];
	["DateTime"]: ValueTypes["DateTime"];
	["Upload"]: ValueTypes["Upload"];
	["Money"]: ValueTypes["Money"];
	["ConfigArgInput"]: ValueTypes["ConfigArgInput"];
	["ConfigurableOperationInput"]: ValueTypes["ConfigurableOperationInput"];
	["StringOperators"]: ValueTypes["StringOperators"];
	["IDOperators"]: ValueTypes["IDOperators"];
	["BooleanOperators"]: ValueTypes["BooleanOperators"];
	["NumberRange"]: ValueTypes["NumberRange"];
	["NumberOperators"]: ValueTypes["NumberOperators"];
	["DateRange"]: ValueTypes["DateRange"];
	["DateOperators"]: ValueTypes["DateOperators"];
	["StringListOperators"]: ValueTypes["StringListOperators"];
	["NumberListOperators"]: ValueTypes["NumberListOperators"];
	["BooleanListOperators"]: ValueTypes["BooleanListOperators"];
	["IDListOperators"]: ValueTypes["IDListOperators"];
	["DateListOperators"]: ValueTypes["DateListOperators"];
	["FacetValueFilterInput"]: ValueTypes["FacetValueFilterInput"];
	["SearchInput"]: ValueTypes["SearchInput"];
	["SearchResultSortParameter"]: ValueTypes["SearchResultSortParameter"];
	["CreateCustomerInput"]: ValueTypes["CreateCustomerInput"];
	["CreateAddressInput"]: ValueTypes["CreateAddressInput"];
	["UpdateAddressInput"]: ValueTypes["UpdateAddressInput"];
	["CurrencyCode"]: ValueTypes["CurrencyCode"];
	["FacetValueListOptions"]: ValueTypes["FacetValueListOptions"];
	["HistoryEntryType"]: ValueTypes["HistoryEntryType"];
	["HistoryEntryListOptions"]: ValueTypes["HistoryEntryListOptions"];
	["LanguageCode"]: ValueTypes["LanguageCode"];
	["OrderType"]: ValueTypes["OrderType"];
	["MetricInterval"]: ValueTypes["MetricInterval"];
	["MetricType"]: ValueTypes["MetricType"];
	["MetricSummaryInput"]: ValueTypes["MetricSummaryInput"];
	["PageType"]: ValueTypes["PageType"];
	["PageListOptions"]: ValueTypes["PageListOptions"];
	["PageTranslationInput"]: ValueTypes["PageTranslationInput"];
	["UpdatePageInput"]: ValueTypes["UpdatePageInput"];
	["CreatePageInput"]: ValueTypes["CreatePageInput"];
	["DeletePageInput"]: ValueTypes["DeletePageInput"];
	["AnnouncementBarListOptions"]: ValueTypes["AnnouncementBarListOptions"];
	["AnnouncementBarEntryTranslationInput"]: ValueTypes["AnnouncementBarEntryTranslationInput"];
	["AnnouncementBarEntryInput"]: ValueTypes["AnnouncementBarEntryInput"];
	["UpdateAnnouncementBarInput"]: ValueTypes["UpdateAnnouncementBarInput"];
	["CreateAnnouncementBarInput"]: ValueTypes["CreateAnnouncementBarInput"];
	["DeleteAnnouncementBarInput"]: ValueTypes["DeleteAnnouncementBarInput"];
	["ChangeStatusAnnouncementBarInput"]: ValueTypes["ChangeStatusAnnouncementBarInput"];
	["WishlistListOptions"]: ValueTypes["WishlistListOptions"];
	["RealizationAssetInput"]: ValueTypes["RealizationAssetInput"];
	["OrderRealizationInput"]: ValueTypes["OrderRealizationInput"];
	["RegisterProformaInput"]: ValueTypes["RegisterProformaInput"];
	["NewsletterSubscriberListOptions"]: ValueTypes["NewsletterSubscriberListOptions"];
	["BackInStockSubscriberListOptions"]: ValueTypes["BackInStockSubscriberListOptions"];
	["B2BSubscriberListOptions"]: ValueTypes["B2BSubscriberListOptions"];
	["ModelListOptions"]: ValueTypes["ModelListOptions"];
	["ModelTranslationInput"]: ValueTypes["ModelTranslationInput"];
	["UpdateModelInput"]: ValueTypes["UpdateModelInput"];
	["CreateModelInput"]: ValueTypes["CreateModelInput"];
	["DeleteModelInput"]: ValueTypes["DeleteModelInput"];
	["AdministratorFilterParameter"]: ValueTypes["AdministratorFilterParameter"];
	["AdministratorSortParameter"]: ValueTypes["AdministratorSortParameter"];
	["AssetFilterParameter"]: ValueTypes["AssetFilterParameter"];
	["AssetSortParameter"]: ValueTypes["AssetSortParameter"];
	["ChannelFilterParameter"]: ValueTypes["ChannelFilterParameter"];
	["ChannelSortParameter"]: ValueTypes["ChannelSortParameter"];
	["CollectionFilterParameter"]: ValueTypes["CollectionFilterParameter"];
	["CollectionSortParameter"]: ValueTypes["CollectionSortParameter"];
	["ProductVariantSortParameter"]: ValueTypes["ProductVariantSortParameter"];
	["CountryFilterParameter"]: ValueTypes["CountryFilterParameter"];
	["CountrySortParameter"]: ValueTypes["CountrySortParameter"];
	["CustomerGroupFilterParameter"]: ValueTypes["CustomerGroupFilterParameter"];
	["CustomerGroupSortParameter"]: ValueTypes["CustomerGroupSortParameter"];
	["CustomerSortParameter"]: ValueTypes["CustomerSortParameter"];
	["FacetFilterParameter"]: ValueTypes["FacetFilterParameter"];
	["FacetSortParameter"]: ValueTypes["FacetSortParameter"];
	["FacetValueFilterParameter"]: ValueTypes["FacetValueFilterParameter"];
	["FacetValueSortParameter"]: ValueTypes["FacetValueSortParameter"];
	["JobFilterParameter"]: ValueTypes["JobFilterParameter"];
	["JobSortParameter"]: ValueTypes["JobSortParameter"];
	["PaymentMethodFilterParameter"]: ValueTypes["PaymentMethodFilterParameter"];
	["PaymentMethodSortParameter"]: ValueTypes["PaymentMethodSortParameter"];
	["ProductSortParameter"]: ValueTypes["ProductSortParameter"];
	["PromotionFilterParameter"]: ValueTypes["PromotionFilterParameter"];
	["PromotionSortParameter"]: ValueTypes["PromotionSortParameter"];
	["ProvinceFilterParameter"]: ValueTypes["ProvinceFilterParameter"];
	["ProvinceSortParameter"]: ValueTypes["ProvinceSortParameter"];
	["RoleFilterParameter"]: ValueTypes["RoleFilterParameter"];
	["RoleSortParameter"]: ValueTypes["RoleSortParameter"];
	["SellerFilterParameter"]: ValueTypes["SellerFilterParameter"];
	["SellerSortParameter"]: ValueTypes["SellerSortParameter"];
	["ShippingMethodFilterParameter"]: ValueTypes["ShippingMethodFilterParameter"];
	["ShippingMethodSortParameter"]: ValueTypes["ShippingMethodSortParameter"];
	["StockLocationFilterParameter"]: ValueTypes["StockLocationFilterParameter"];
	["StockLocationSortParameter"]: ValueTypes["StockLocationSortParameter"];
	["TagFilterParameter"]: ValueTypes["TagFilterParameter"];
	["TagSortParameter"]: ValueTypes["TagSortParameter"];
	["TaxCategoryFilterParameter"]: ValueTypes["TaxCategoryFilterParameter"];
	["TaxCategorySortParameter"]: ValueTypes["TaxCategorySortParameter"];
	["TaxRateFilterParameter"]: ValueTypes["TaxRateFilterParameter"];
	["TaxRateSortParameter"]: ValueTypes["TaxRateSortParameter"];
	["ZoneFilterParameter"]: ValueTypes["ZoneFilterParameter"];
	["ZoneSortParameter"]: ValueTypes["ZoneSortParameter"];
	["PageFilterParameter"]: ValueTypes["PageFilterParameter"];
	["PageSortParameter"]: ValueTypes["PageSortParameter"];
	["AnnouncementBarFilterParameter"]: ValueTypes["AnnouncementBarFilterParameter"];
	["AnnouncementBarSortParameter"]: ValueTypes["AnnouncementBarSortParameter"];
	["WishlistFilterParameter"]: ValueTypes["WishlistFilterParameter"];
	["WishlistSortParameter"]: ValueTypes["WishlistSortParameter"];
	["NewsletterSubscriberFilterParameter"]: ValueTypes["NewsletterSubscriberFilterParameter"];
	["NewsletterSubscriberSortParameter"]: ValueTypes["NewsletterSubscriberSortParameter"];
	["BackInStockSubscriberFilterParameter"]: ValueTypes["BackInStockSubscriberFilterParameter"];
	["BackInStockSubscriberSortParameter"]: ValueTypes["BackInStockSubscriberSortParameter"];
	["B2BSubscriberFilterParameter"]: ValueTypes["B2BSubscriberFilterParameter"];
	["B2BSubscriberSortParameter"]: ValueTypes["B2BSubscriberSortParameter"];
	["ModelFilterParameter"]: ValueTypes["ModelFilterParameter"];
	["ModelSortParameter"]: ValueTypes["ModelSortParameter"];
	["HistoryEntryFilterParameter"]: ValueTypes["HistoryEntryFilterParameter"];
	["HistoryEntrySortParameter"]: ValueTypes["HistoryEntrySortParameter"];
	["CreateAddressCustomFieldsInput"]: ValueTypes["CreateAddressCustomFieldsInput"];
	["UpdateAddressCustomFieldsInput"]: ValueTypes["UpdateAddressCustomFieldsInput"];
	["CreateCollectionCustomFieldsInput"]: ValueTypes["CreateCollectionCustomFieldsInput"];
	["UpdateCollectionCustomFieldsInput"]: ValueTypes["UpdateCollectionCustomFieldsInput"];
	["CreateCollectionTranslationInputCustomFields"]: ValueTypes["CreateCollectionTranslationInputCustomFields"];
	["UpdateCollectionTranslationInputCustomFields"]: ValueTypes["UpdateCollectionTranslationInputCustomFields"];
	["CreateFacetCustomFieldsInput"]: ValueTypes["CreateFacetCustomFieldsInput"];
	["UpdateFacetCustomFieldsInput"]: ValueTypes["UpdateFacetCustomFieldsInput"];
	["CreateFacetValueCustomFieldsInput"]: ValueTypes["CreateFacetValueCustomFieldsInput"];
	["UpdateFacetValueCustomFieldsInput"]: ValueTypes["UpdateFacetValueCustomFieldsInput"];
	["UpdateOrderCustomFieldsInput"]: ValueTypes["UpdateOrderCustomFieldsInput"];
	["PaymentMethodTranslationInputCustomFields"]: ValueTypes["PaymentMethodTranslationInputCustomFields"];
	["CreateProductCustomFieldsInput"]: ValueTypes["CreateProductCustomFieldsInput"];
	["UpdateProductCustomFieldsInput"]: ValueTypes["UpdateProductCustomFieldsInput"];
	["ProductTranslationInputCustomFields"]: ValueTypes["ProductTranslationInputCustomFields"];
	["CreateProductOptionCustomFieldsInput"]: ValueTypes["CreateProductOptionCustomFieldsInput"];
	["UpdateProductOptionCustomFieldsInput"]: ValueTypes["UpdateProductOptionCustomFieldsInput"];
	["ShippingMethodTranslationInputCustomFields"]: ValueTypes["ShippingMethodTranslationInputCustomFields"];
	["OrderLineCustomFieldsInput"]: ValueTypes["OrderLineCustomFieldsInput"];
	["NativeAuthInput"]: ValueTypes["NativeAuthInput"];
}