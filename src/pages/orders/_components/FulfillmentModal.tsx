import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  ScrollArea,
  Table,
  Input,
} from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfigurableOperationDefinitionType, DraftOrderType } from '@/graphql/draft_order';
import { LineItem } from './LineItem';
import { useGFFLP } from '@/lists/useGflp';
import { ResolverInputTypes } from '@/zeus';

export const FulfillmentModal = ({
  draftOrder,
  fulfillmentHandlers,
  onSubmitted,
}: {
  draftOrder: DraftOrderType;
  fulfillmentHandlers: ConfigurableOperationDefinitionType[];
  onSubmitted: (data: ResolverInputTypes['FulfillOrderInput']) => Promise<void>;
}) => {
  const neededFulfillmentHandlers = draftOrder?.shippingLines?.map(
    (line) => line.shippingMethod.fulfillmentHandlerCode,
  );
  const filteredFulfillmentHandlers = fulfillmentHandlers.filter((handler) =>
    neededFulfillmentHandlers?.includes(handler.code),
  );
  const { state, setField } = useGFFLP('FulfillOrderInput')({
    lines: {
      initialValue: draftOrder.lines.map((line) => ({
        orderLineId: line.id,
        quantity: line.quantity || 1,
        customFields: {},
      })),
    },
    handler: {
      initialValue: {
        code: filteredFulfillmentHandlers[0].code,
        arguments: filteredFulfillmentHandlers[0].args.map((arg) => ({
          name: arg.name,
          value: arg.defaultValue,
        })),
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.lines?.value || !state.handler?.value) return;
    onSubmitted({
      lines: state.lines?.value.map((line) => ({
        orderLineId: line.orderLineId,
        quantity: line.quantity,
      })),
      handler: state.handler?.value,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Zrealizuj zamówienie</Button>
      </DialogTrigger>
      <DialogContent className="flex h-[70vh] max-w-[70vw] flex-col">
        <DialogHeader>
          <DialogTitle>Zrealizuj zamówienie</DialogTitle>
          <DialogDescription>Fill fulfillment details</DialogDescription>
        </DialogHeader>
        <div className="flex h-full w-full items-start gap-16">
          <div className="flex h-full w-full flex-col justify-between">
            <ScrollArea className="h-72 w-full">
              <Table>
                <TableHeader>
                  <TableRow noHover>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Fulfilled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="w-full">
                  {draftOrder?.lines.length ? (
                    draftOrder.lines.map((line) => {
                      const onStock = line.productVariant.stockLevels.reduce(
                        (acc, stock) => acc + stock.stockOnHand,
                        0,
                      );
                      const stateLine = state.lines?.value.find((l) => l.orderLineId === line.id);
                      return (
                        <LineItem key={line.id} variant={line.productVariant}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={stateLine?.quantity}
                                  onChange={(e) => {
                                    const value = state.lines?.value;
                                    if (!value) return;
                                    const index = value.findIndex((v) => v.orderLineId === line.id);
                                    if (index === -1) return;
                                    if (parseInt(e.target.value) < 1) return;
                                    if (parseInt(e.target.value) <= line.quantity) {
                                      value[index].quantity = parseInt(e.target.value);
                                      setField('lines', value);
                                    }
                                  }}
                                />
                                / <span>{line.quantity} </span>
                                <p className="whitespace-nowrap">on stock {onStock}</p>
                              </div>
                            </div>
                          </TableCell>
                        </LineItem>
                      );
                    })
                  ) : (
                    <TableCell colSpan={4}>
                      <div className="mt-4 flex items-center justify-center">
                        <span>No items in draft order</span>
                      </div>
                    </TableCell>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            <Card className="pt-8">
              <CardContent className="flex flex-col gap-2">
                <div className="flex">
                  <div className="flex w-full">
                    <div className="flex w-full flex-col gap-2">
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Full Name</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.fullName}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Company</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.company}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Street Line 1</p>
                        <p className="text-v font-medium">{draftOrder.shippingAddress?.streetLine1}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Street Line 2</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.streetLine2}</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">City</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.city}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Postal Code</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.postalCode}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Country</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.country}</p>
                      </div>
                      <div className="grid grid-rows-2">
                        <p className="text-xs font-medium">Phone Number</p>
                        <p className="text-sm font-medium">{draftOrder.shippingAddress?.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col">
                      {draftOrder.shippingLines.map((line) => (
                        <div key={line.id} className="grid grid-cols-2 items-center gap-4">
                          <p className="whitespace-nowrap text-xs font-medium">{line.shippingMethod.name}</p>
                          <p className="text-sm font-medium">{line.priceWithTax}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex w-full flex-col gap-4">
            <form onSubmit={handleSubmit}>
              <Card>
                {filteredFulfillmentHandlers.map((handler) => {
                  return (
                    <div key={handler.code} className="flex flex-col gap-4">
                      <CardHeader>
                        <CardTitle>{handler.code}</CardTitle>
                        <CardDescription>{handler.description}</CardDescription>
                        <CardContent>
                          {handler.args.map((arg) => {
                            return (
                              <div key={arg.name} className="flex flex-col gap-2">
                                <Input
                                  label={arg.name}
                                  value={state.handler?.value.arguments.find((a) => a.name === arg.name)?.value}
                                  onChange={(e) => {
                                    const value = [...(state.handler?.value.arguments || [])];
                                    const index = value.findIndex((v) => v.name === arg.name);
                                    if (index === -1) return;
                                    value[index].name = arg.name;
                                    value[index].value = e.target.value;
                                    setField('handler', { code: handler.code, arguments: value });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </CardContent>
                      </CardHeader>
                    </div>
                  );
                })}
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <Button type="submit" variant="outline">
                      Fulfill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
