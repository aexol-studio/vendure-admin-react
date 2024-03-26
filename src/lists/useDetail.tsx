import { DetailCacheables, cache } from '@/lists/cache';
import { GenericReturnDetail, PromiseDetail } from '@/lists/models';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export const useDetail = <T extends PromiseDetail>({ route, cacheKey }: { route: T; cacheKey: DetailCacheables }) => {
  const { slug } = useParams();
  const [object, setObject] = useState<GenericReturnDetail<T>>();
  const c = cache<GenericReturnDetail<T>>(cacheKey);

  useEffect(() => {
    if (!slug) return;
    const valueFromCache = c.get(slug);
    if (valueFromCache) {
      setObject(valueFromCache);
      return;
    }
    route({ slug }).then((r) => {
      setObject(r);
      c.set(slug, r);
      return;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return {
    object,
    reset: () => slug && c.resetKey(slug),
  };
};
