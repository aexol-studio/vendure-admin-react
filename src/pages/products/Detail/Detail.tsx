import { adminApiMutation, adminApiQuery } from '@/graphql/client';
import { Stack } from '@/components/Stack';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { CurrencyCode, LanguageCode, ModelTypes } from '@/zeus';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const getProduct = async ({ slug }: { slug: string }) => {
  const response = await adminApiQuery({
    product: [{ slug }, ProductDetailSelector],
  });
  return response.product;
};
const updateProduct = async (props: ModelTypes['UpdateProductInput']) => {
  const response = await adminApiMutation({
    updateProduct: [{ input: props }, { id: true }],
  });
  return response.updateProduct.id;
};
const updateProductVariant = async (props: ModelTypes['UpdateProductVariantInput']) => {
  const response = await adminApiMutation({
    updateProduct: [{ input: props }, { id: true }],
  });
  return response.updateProduct.id;
};

export const ProductDetailPage = () => {
  const { t } = useTranslation('products');
  const { object, reset } = useDetail({ cacheKey: 'productDetail', route: getProduct });

  const { state, setField } = useGFFLP('UpdateProductInput', 'translations', 'featuredAssetId', 'enabled')({});
  const { state: variantState } = useGFFLP('UpdateProductVariantInput', 'translations', 'price', 'sku')({});
  const [currentTranslationLng, setCurrentTranslationLng] = useState(LanguageCode.en);
  const translations = state?.translations?.value || [];
  const currentTranslationValue = translations.find((v) => v.languageCode === currentTranslationLng);

  useEffect(() => {
    setField('translations', object?.translations);
  }, [object]);

  return (
    <Stack column className="gap-y-4">
      <h2>{t('forms.update')}</h2>

      <Tabs defaultValue="product" className="w-full">
        <TabsList>
          <TabsTrigger value="product">{t('forms.update')}</TabsTrigger>
          <TabsTrigger value="variants">{t('variants')}</TabsTrigger>
        </TabsList>
        <TabsContent className="w-full" value="product">
          <Stack className="gap-x-8">
            <Stack className="flex-1 gap-x-8">
              <img className="w-72" src={object?.featuredAsset?.source} />
              <Stack column className="flex-1 gap-y-4">
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
                    reset();
                    resetCache('products');
                    return;
                  }}
                >
                  {t('forms.update')}
                </Button>
              </Stack>
            </Stack>
            <Stack column className="flex-0.5 gap-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('options')}</CardTitle>
                  <CardDescription>{t('options')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack className="gap-x-2">
                    {object?.optionGroups.map((fv) => <Badge key={fv.id}>{fv.name}</Badge>)}
                  </Stack>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('facets')}</CardTitle>
                  <CardDescription>{t('facets')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack className="gap-x-2">
                    {object?.facetValues.map((fv) => <Badge key={fv.id}>{fv.name}</Badge>)}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </TabsContent>
        <TabsContent value="variants">
          <Stack column>
            <h2>{t('variants')}</h2>
            <Tabs
              onValueChange={(e) => {
                const variant = object?.variants.find((v) => v.id === e);
                if (variant) {
                }
              }}
              defaultValue={object?.variants?.[0].id}
            >
              <TabsList className="h-auto flex-wrap justify-start">
                {object?.variants.map((v) => (
                  <TabsTrigger key={v.id} value={v.id}>
                    {v.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {object?.variants.map((v) => (
                <TabsContent value={v.id} key={v.id}>
                  <Stack column key={v.id} className="gap-y-4">
                    <Input
                      label={t('sku')}
                      placeholder={t('sku')}
                      key={currentTranslationLng}
                      value={variantState?.sku?.value}
                      onChange={(e) => {}}
                    />
                    <Input
                      label={t('name')}
                      placeholder={t('name')}
                      key={currentTranslationLng}
                      value={v?.name}
                      onChange={(e) => {}}
                    />
                    {v.prices.map((p) => (
                      <Stack key={p.currencyCode} className="items-center gap-x-4">
                        <Input
                          type="number"
                          placeholder={t('price')}
                          key={currentTranslationLng}
                          value={p.price}
                          onChange={(e) => {}}
                        />
                        <Badge>{p.currencyCode}</Badge>
                      </Stack>
                    ))}
                    <Stack className="gap-x-4">
                      <Select defaultValue={CurrencyCode.USD} onValueChange={(e) => {}}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CurrencyCode.EUR}>{CurrencyCode.EUR}</SelectItem>
                          <SelectItem value={CurrencyCode.PLN}>{CurrencyCode.PLN}</SelectItem>
                          <SelectItem value={CurrencyCode.USD}>{CurrencyCode.USD}</SelectItem>
                          <SelectItem value={CurrencyCode.AUD}>{CurrencyCode.AUD}</SelectItem>
                          <SelectItem value={CurrencyCode.CZK}>{CurrencyCode.CZK}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant={'outline'}>{t('addPrice')}</Button>
                    </Stack>
                    <Button
                      onClick={() => {
                        updateProductVariant({
                          id: v.id,
                        });
                      }}
                    >
                      {t('forms.update')}
                    </Button>
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
