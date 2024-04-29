import { useEffect, useState } from 'react';
import { adminApiQuery } from '@/common/client';
import { useCustomFields } from '@/custom_fields';
import { Selector } from '@/zeus';
import { FromSelectorWithScalars } from '@/graphql/scalars';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from '@/components';

const ProductSelector = Selector('Product')({
  slug: true,
  facetValues: {
    id: true,
    code: true,
    name: true,
    customFields: { hexColor: true, image: { preview: true } },
    facet: { id: true, name: true, code: true, customFields: { usedForProductCreations: true } },
  },
});
type ProductType = FromSelectorWithScalars<typeof ProductSelector, 'Product'>;
type Data = {
  id: string;
  code: string;
  name: string;
  usedForProductCreations: boolean;
  facetValues: { id: string; code: string; name: string; hexColor?: string; image?: { preview: string } }[];
};

const match = (facetValues?: ProductType['facetValues']) => {
  if (!facetValues) return [];
  const facets = facetValues.reduce((acc, item) => {
    const facet = acc.find((f) => f.id === item.facet.id);
    if (facet) {
      facet.facetValues.push(item);
    } else {
      acc.push({
        id: item.facet.id,
        code: item.facet.code,
        name: item.facet.name,
        usedForProductCreations: !!item.facet.customFields?.usedForProductCreations,
        facetValues: [item],
      });
    }
    return acc;
  }, [] as Data[]);
  return facets;
};

export const CustomComponent = () => {
  const { setValue, value, data } = useCustomFields();
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string;
  }>(value ? JSON.parse(value as string) : {});
  const [facets, setFacets] = useState<Data[]>([]);
  useEffect(() => {
    const init = async () => {
      if (!data) return;
      const id = data.variantToAdd.product.id;
      const { product } = await adminApiQuery({
        product: [{ id }, ProductSelector],
      });
      const facets = match(product?.facetValues);
      setFacets(facets);
    };
    init();
  }, []);

  const onPress = async (key: string, value: string) => {
    const newSelectedValues = { ...selectedValues };
    if (newSelectedValues[key] === value) {
      delete newSelectedValues[key];
    } else {
      newSelectedValues[key] = value;
    }
    setSelectedValues(newSelectedValues);
    const newValuesWithIDAndCode = Object.keys(newSelectedValues).reduce(
      (acc, key) => {
        const facet = facets?.find((f) => f.id === key);
        if (!facet) return acc;
        const selected = facet.facetValues.find((fv) => newSelectedValues[key] === fv.id);
        if (!selected) return acc;
        acc[facet.code] = selected.code;
        return acc;
      },
      {} as { [key: string]: string },
    );
    const json = JSON.stringify(newValuesWithIDAndCode);
    setValue(json);
  };

  return (
    <div>
      <div>
        <p>Wybrane kolory:</p>
        <div>
          {Object.keys(selectedValues).map((key) => {
            const facet = facets?.find((f) => f.id === key);
            if (!facet) return null;
            const selected = facet.facetValues.find((fv) => selectedValues[key] === fv.id);
            if (!selected) return null;
            return (
              <div key={key} className="flex gap-2">
                <span>{facet.name}</span>
                <span>{selected.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Wybierz kolory
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[60vw]">
          <DialogHeader>
            <DialogTitle>Wybierz kolory</DialogTitle>
            <DialogDescription>Wybierz kolory, które mają być przypisane do tego wariantu produktu.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh]">
            <div className="flex justify-between gap-2">
              {facets?.map((facet) => {
                return (
                  <div key={facet.id}>
                    <span>{facet.name}</span>
                    <div className="flex flex-col gap-2">
                      {facet.facetValues.map((value, index) => (
                        <GroupValue
                          key={value.id}
                          first={index === 0}
                          entry={value}
                          isValueSelected={selectedValues[facet.id] === value.id}
                          handleFacetValueSelect={(id) => onPress(facet.id, id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GroupValue = ({
  first,
  entry,
  handleFacetValueSelect,
  isValueSelected,
}: {
  first: boolean;
  entry: { id: string; code: string; name: string; customFields?: { hexColor?: string; image?: { preview: string } } };
  handleFacetValueSelect: (id: string) => void;
  isValueSelected: boolean;
}) => {
  return (
    <div className={`flex items-center gap-2 ${first ? 'mt-2' : ''}`}>
      <Checkbox checked={isValueSelected} onCheckedChange={() => handleFacetValueSelect(entry.id)} />
      <div className="relative min-h-4 min-w-4 rounded-full border-[1px] border-[rgba(0,0,0,0.4)]">
        <div
          className="absolute left-0 top-0 z-0 h-full w-full rounded-full"
          style={{
            ...(entry?.customFields?.hexColor
              ? { backgroundColor: entry.customFields.hexColor }
              : { backgroundColor: 'transparent' }),
          }}
        />
        {entry?.customFields?.image && (
          <img
            className="absolute left-0 top-0 z-10 h-full w-full rounded-full"
            src={entry.customFields.image.preview}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>{entry.name}</span>
      </div>
    </div>
  );
};
