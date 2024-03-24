import { adminApiMutation, adminApiQuery } from '@/common/client';
import { Stack } from '@/components/ui/Stack';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <Tabs defaultValue="product" className="w-full">
        <TabsList>
          <TabsTrigger value="product">{t('forms.update')}</TabsTrigger>
          <TabsTrigger value="variants">{t('variants')}</TabsTrigger>
          <TabsTrigger value="options">{t('options')}</TabsTrigger>
        </TabsList>
        <TabsContent className="w-full" value="product">
          <Stack className="gap-x-16">
            <Stack className="gap-x-8 flex-2">
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
            <Stack column className="flex-1 gap-y-8">
              <Stack column className="gap-y-2">
                <h3>{t('options')}</h3>
                <Stack className="gap-x-2">
                  {object?.optionGroups.map((fv) => <Badge key={fv.id}>{fv.name}</Badge>)}
                </Stack>
              </Stack>
              <Stack column className="gap-y-2">
                <h3>{t('facets')}</h3>
                <Stack className="gap-x-2">
                  {object?.facetValues.map((fv) => <Badge key={fv.id}>{fv.name}</Badge>)}
                </Stack>
              </Stack>
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
        </TabsContent>
        <TabsContent value="variants">
          <Stack column>
            <h2>{t('variants')}</h2>
            <Tabs defaultValue={object?.variants?.[0].id}>
              <TabsList className="flex-wrap h-auto justify-start">
                {object?.variants.map((v) => (
                  <TabsTrigger key={v.id} value={v.id}>
                    {v.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {object?.variants.map((v) => (
                <TabsContent value={v.id} key={v.id}>
                  <Stack column key={v.id}>
                    <Input
                      label={t('sku')}
                      placeholder={t('sku')}
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
                    <Input
                      type="number"
                      label={t('price')}
                      placeholder={t('price')}
                      key={currentTranslationLng}
                      value={v?.price}
                      onChange={(e) => {}}
                    />
                  </Stack>
                </TabsContent>
              ))}
            </Tabs>
          </Stack>
        </TabsContent>
      </Tabs>
    </Stack>
  );
};
