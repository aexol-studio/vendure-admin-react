import { adminApiMutation, adminApiQuery } from '@/common/client';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProductDetailSelector } from '@/graphql/products';
import { resetCache } from '@/lists/cache';
import { useDetail } from '@/lists/useDetail';
import { setInArrayBy, useGFFLP } from '@/lists/useGflp';
import { LanguageCode, ModelTypes } from '@/zeus';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const getProduct = async ({ slug }: { slug: string }) => {
  const response = await adminApiQuery()({
    product: [{ slug }, ProductDetailSelector],
  });
  return response.product;
};
const updateProduct = async (props: ModelTypes['UpdateProductInput']) => {
  const response = await adminApiMutation()({
    updateProduct: [{ input: props }, { id: true }],
  });
  return response.updateProduct.id;
};

export const ProductDetailPage = () => {
  const { t } = useTranslation('products');

  const { object, reset } = useDetail({
    cacheKey: 'productDetail',
    route: getProduct,
  });

  const { state, setField } = useGFFLP('UpdateProductInput', 'translations', 'featuredAssetId', 'enabled')({});
  const [currentTranslationLng, setCurrentTranslationLng] = useState(LanguageCode.en);
  const translations = state?.translations?.value || [];
  const currentTranslationValue = translations.find((v) => v.languageCode === currentTranslationLng);

  useEffect(() => {
    setField('translations', object?.translations);
  }, [object]);

  console.log({ currentTranslationValue, currentTranslationLng, translations });
  return (
    <Stack column className="gap-y-4">
      <h2>{t('forms.update')}</h2>
      <Stack className="gap-x-8">
        <img className="w-96" src={object?.featuredAsset?.source} />
        <Stack column className="gap-y-4 flex-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="product-enabled"
              checked={object?.enabled}
              onCheckedChange={(e) => {
                setField('enabled', e);
              }}
            />
            <Label htmlFor="product-enabled">{t('enabled')}</Label>
          </div>
          <Select
            defaultValue={LanguageCode.en}
            onValueChange={(e) => {
              setCurrentTranslationLng(e as LanguageCode);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LanguageCode.en}>{LanguageCode.en}</SelectItem>
              <SelectItem value={LanguageCode.pl}>{LanguageCode.pl}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            label={t('name')}
            placeholder={t('name')}
            key={currentTranslationLng}
            value={currentTranslationValue?.name}
            onChange={(e) =>
              setField(
                'translations',
                setInArrayBy(translations, (t) => t.languageCode !== currentTranslationLng, {
                  name: e.target.value,
                  languageCode: currentTranslationLng,
                }),
              )
            }
          />
          <Input
            key={currentTranslationLng + 'slug'}
            value={currentTranslationValue?.slug}
            label={t('slug')}
            placeholder={t('slug')}
            onChange={(e) =>
              setField(
                'translations',
                setInArrayBy(translations, (t) => t.languageCode !== currentTranslationLng, {
                  slug: e.target.value,
                  languageCode: currentTranslationLng,
                }),
              )
            }
          />
          <Textarea
            rows={6}
            placeholder={t('name')}
            key={currentTranslationLng + 'area'}
            value={currentTranslationValue?.description}
            style={{ margin: 0 }}
            onChange={(e) =>
              setField(
                'translations',
                setInArrayBy(translations, (t) => t.languageCode !== currentTranslationLng, {
                  description: e.target.value,
                  languageCode: currentTranslationLng,
                }),
              )
            }
          />
        </Stack>
      </Stack>
      <Button
        onClick={() => {
          if (!object || !state.translations?.validatedValue) return;
          updateProduct({
            id: object.id,
            translations: state.translations.validatedValue,
          }).then(() => {
            toast(t('forms.update'), {
              description: new Date().toLocaleString(),
            });
          });
          console.log(object.slug);
          reset();
          resetCache('products');
          return;
        }}
      >
        {t('forms.update')}
      </Button>
      <Stack column>
        <h2>{t('variants')}</h2>
        {object?.variants.map((v) => (
          <Stack column key={v.id}>
            <Input
              label={t('name')}
              placeholder={t('name')}
              key={currentTranslationLng}
              value={v?.sku}
              onChange={(e) => {}}
            />
            <Input
              label={t('name')}
              placeholder={t('name')}
              key={currentTranslationLng}
              value={v?.name}
              onChange={(e) => {}}
            />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
