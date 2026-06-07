import { State } from "ura";

const cache = new Map<string, unknown>();
const keyOf = (key: unknown): string =>
  Array.isArray(key) ? key.join("|") : String(key);

export type QueryResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  refetch: () => void;
};

type QueryState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  _run: boolean;
};

export function useQuery<T = unknown>(
  key: unknown,
  fetcher: () => Promise<T> | T,
): QueryResult<T> {
  const k = keyOf(key);
  const [state, setState] = State({
    data: cache.get(k) as T | undefined,
    error: undefined,
    loading: !cache.has(k),
    _run: false,
  }) as [() => QueryState<T>, (s: QueryState<T>) => void];

  const load = () => {
    const cur = state();
    if (cur.data === undefined) setState({ ...cur, loading: true });
    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        cache.set(k, data);
        setState({ data, error: undefined, loading: false, _run: true });
      })
      .catch((error: Error) =>
        setState({ ...state(), error, loading: false, _run: true }),
      );
  };

  const s = state();
  if (!s._run) {
    s._run = true;
    load();
  }

  return { data: s.data, error: s.error, loading: s.loading, refetch: load };
}

export type MutationResult<T, V> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  mutate: (vars: V) => Promise<T>;
};

type MutationState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
};

export function useMutation<T = unknown, V = unknown>(
  mutator: (vars: V) => Promise<T> | T,
): MutationResult<T, V> {
  const [state, setState] = State({
    data: undefined,
    error: undefined,
    loading: false,
  }) as [() => MutationState<T>, (s: MutationState<T>) => void];

  const mutate = (vars: V): Promise<T> =>
    Promise.resolve()
      .then(() => {
        setState({ data: undefined, error: undefined, loading: true });
        return mutator(vars);
      })
      .then((data) => {
        setState({ data, error: undefined, loading: false });
        return data;
      })
      .catch((error: Error) => {
        setState({ data: undefined, error, loading: false });
        throw error;
      });

  const s = state();
  return { data: s.data, error: s.error, loading: s.loading, mutate };
}
