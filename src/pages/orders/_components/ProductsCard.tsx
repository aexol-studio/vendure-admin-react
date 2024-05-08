import { apiCall } from '@/graphql/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ProductVariantSearch,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Label,
  Dialog,
  DialogContent,
  Button,
  Table,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components';
import { CustomFieldsComponent } from '@/custom_fields';
import {
  DraftOrderType,
  ProductVariantType,
  draftOrderSelector,
  removeOrderItemsResultSelector,
  updatedDraftOrderSelector,
} from '@/graphql/draft_order';
import { useGFFLP } from '@/lists/useGflp';
import { Mode } from '@/pages/orders/OrderPage';
import { LineItem } from '@/pages/orders/_components/LineItem';
import { Info } from 'lucide-react';

import { useState } from 'react';

import { useTranslation } from 'react-i18next';

interface Props {
  mode: Mode;
  order: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
}
export const ProductsCard: React.FC<Props> = ({ mode, order, setOrder }) => {
  const { t } = useTranslation('orders');

  const [variantToAdd, setVariantToAdd] = useState<ProductVariantType | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});

  const addToOrder = async (productVariantId: string, quantity: number, customFields: Record<string, unknown>) => {
    const { addItemToDraftOrder } = await apiCall('mutation')({
      addItemToDraftOrder: [
        { input: { productVariantId, quantity, customFields }, orderId: order.id },
        updatedDraftOrderSelector,
      ],
    });
    if (addItemToDraftOrder.__typename === 'Order' || addItemToDraftOrder.__typename === 'InsufficientStockError') {
      if (addItemToDraftOrder.__typename === 'Order') setOrder(addItemToDraftOrder);
      else setOrder(addItemToDraftOrder.order);
      setVariantToAdd(undefined);
      setOpen(false);
    }
  };

  const removeLineItem = async (orderLineId: string) => {
    const { removeDraftOrderLine } = await apiCall('mutation')({
      removeDraftOrderLine: [{ orderId: order.id, orderLineId }, removeOrderItemsResultSelector],
    });
    if (removeDraftOrderLine.__typename === 'Order') setOrder(removeDraftOrderLine);
  };

  const adjustLineItem = async (orderLineId: string, quantity: number) => {
    const { adjustDraftOrderLine } = await apiCall('mutation')({
      adjustDraftOrderLine: [
        { orderId: order.id, input: { orderLineId, quantity } },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on InsufficientStockError': {
            errorCode: true,
            message: true,
            order: draftOrderSelector,
            quantityAvailable: true,
          },
          '...on NegativeQuantityError': {
            errorCode: true,
            message: true,
          },
          '...on OrderLimitError': {
            errorCode: true,
            message: true,
            maxItems: true,
          },
          '...on OrderModificationError': {
            errorCode: true,
            message: true,
          },
        },
      ],
    });
    if (adjustDraftOrderLine.__typename === 'Order' || adjustDraftOrderLine.__typename === 'InsufficientStockError') {
      if (adjustDraftOrderLine.__typename === 'Order') setOrder(adjustDraftOrderLine);
      else setOrder(adjustDraftOrderLine.order);
    }
  };

  const openAddVariantDialog = (variant: ProductVariantType) => {
    setOpen(true);
    setVariantToAdd(variant);
  };

  const closeAddVariantDialog = () => {
    setOpen(false);
    setVariantToAdd(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle> {t(mode === 'view' ? 'create.viewTitle' : 'create.addTitle')}</CardTitle>
        <CardDescription> {t(mode === 'view' ? 'create.viewHeader' : 'create.addHeader')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {mode !== 'view' ? (
            <>
              <Label htmlFor="product">{t('create.searchPlaceholder')}</Label>
              <ProductVariantSearch onSelectItem={(i) => openAddVariantDialog(i)} />
              <Dialog open={open} onOpenChange={(e) => (!e ? closeAddVariantDialog() : setOpen(true))}>
                <DialogContent className="h-[90vh] max-w-[90vw]">
                  {variantToAdd ? (
                    <form
                      className="flex h-full w-full flex-col"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await addToOrder(variantToAdd.id, 1, state.customFields?.value || {});
                      }}
                    >
                      <div className="flex w-full flex-col items-center gap-2">
                        <div className="flex w-full">
                          <LineItem
                            noBorder
                            noHover
                            variant={{
                              ...variantToAdd,
                              quantity: 1,
                            }}
                          >
                            <Button type="submit" size="sm" variant="outline">
                              {t('create.addItem')}
                            </Button>
                          </LineItem>
                        </div>
                      </div>
                      <CustomFieldsComponent
                        getValue={(field) => {
                          const value = state.customFields?.value ? state.customFields?.value[field.name as never] : '';
                          return value;
                        }}
                        setValue={(field, data) => {
                          setField('customFields', { ...state.customFields?.value, [field.name]: data });
                        }}
                        data={{ variantToAdd }}
                      />
                      {/* HERE COMPONENT FOR CUSTOM FIELDS */}
                      <div className="float-end flex flex-row justify-end gap-4">
                        <Button type="submit">{t('create.add')}</Button>
                      </div>
                    </form>
                  ) : (
                    <div>{t('create.somethingWrong')}</div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : null}
          <Table>
            <TableHeader className="text-nowrap">
              <TableRow noHover>
                <TableHead>{t('create.product')}</TableHead>
                <TableHead>{t('create.sku')}</TableHead>
                <TableHead>{t('create.customFields')}</TableHead>
                <TableHead>{t('create.price')}</TableHead>
                <TableHead>{t('create.priceWithTax')}</TableHead>
                <TableHead>{t('create.quantity')}</TableHead>
                <TableHead>{t('create.totalWithTax')}</TableHead>
                {mode !== 'view' && <TableHead>{t('create.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.length ? (
                order.lines.map((line) => (
                  <TableRow>
                    <TableCell>
                      <div className="flex w-max items-center gap-2">
                        <img
                          alt="Product image"
                          className="aspect-square w-10 rounded-md object-cover"
                          height="40"
                          width="40"
                          src={
                            line.productVariant.featuredAsset?.preview ||
                            line.productVariant.product?.featuredAsset?.preview
                          }
                        />
                        <div className="font-semibold">{line.productVariant.product.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">{line.productVariant.sku}</TableCell>
                    <TableCell>
                      {line.customFields && (
                        <HoverCard openDelay={100}>
                          <HoverCardTrigger asChild>
                            <Info />
                          </HoverCardTrigger>
                          <HoverCardContent className="w-fit">
                            {Object.entries(JSON.parse(JSON.stringify(line.customFields || {}))).map(([key, value]) => (
                              <div>
                                {key}: {JSON.stringify(value)}
                              </div>
                            ))}
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </TableCell>
                    <TableCell className="text-nowrap">
                      {line.discountedLinePrice / 100} {line.productVariant.currencyCode}
                    </TableCell>
                    <TableCell className="text-nowrap">{line.discountedLinePriceWithTax / 100}</TableCell>
                    <TableCell>
                      {adjustLineItem ? (
                        <div className="flex items-center gap-2">
                          {mode !== 'view' && (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => adjustLineItem(line.id, line.quantity ? line.quantity + 1 : 1)}
                            >
                              +
                            </Button>
                          )}
                          <span>{line.quantity}</span>
                          {mode !== 'view' && (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => adjustLineItem(line.id, line.quantity ? line.quantity - 1 : 1)}
                            >
                              -
                            </Button>
                          )}
                        </div>
                      ) : (
                        line.quantity
                      )}
                    </TableCell>
                    <TableCell>{(line.productVariant.priceWithTax * (line.quantity || 1)) / 100}</TableCell>
                    {mode !== 'view' && (
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => removeLineItem(line.id)}>
                          {t('create.remove')}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableCell colSpan={4}>
                  <div className="mt-4 flex items-center justify-center">
                    <span>{t('create.noItems')}</span>
                  </div>
                </TableCell>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
