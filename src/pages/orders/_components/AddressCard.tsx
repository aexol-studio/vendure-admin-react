import { adminApiMutation } from '@/common/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  SelectGroup,
  CardDescription,
  Checkbox,
  Label,
  SelectItem,
  ScrollArea,
} from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddressBaseType, CreateAddressBaseType, DraftOrderType, draftOrderSelector } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { useGFFLP } from '@/lists/useGflp';
import { Mode } from '@/pages/orders/OrderPage';
import { useServer } from '@/state/server';
import { phoneNumberRegExp } from '@/utils/regExp';
import { Edit } from 'lucide-react';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type DefaultAddress = AddressBaseType & {
  id?: string;
  defaultBillingAddress?: boolean;
  defaultShippingAddress?: boolean;
  country?: { code?: string; name?: string };
};
interface DefaultAddressValue extends Omit<AddressBaseType, 'streetLine1'> {
  streetLine1?: string;
  country?: string;
  countryCode?: string;
}

export const AddressCard: React.FC<{
  type: 'shipping' | 'billing';
  mode: Mode;
  order?: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
}> = ({ mode, order, setOrder, type }) => {
  const { t } = useTranslation('orders');
  const countries = useServer((p) => p.countries);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const currentAddress = useMemo(
    () =>
      order?.shippingAddress && type === 'shipping'
        ? order?.shippingAddress
        : order?.billingAddress && type === 'billing'
          ? order.billingAddress
          : undefined,
    [order, type],
  );
  const [selectedAddress, setSelectedAddress] = useState<DefaultAddress | undefined>(
    currentAddress &&
      order?.customer?.addresses?.find(
        (i) =>
          i.streetLine1 === currentAddress.streetLine1 &&
          i.fullName === currentAddress.fullName &&
          i.postalCode === currentAddress.postalCode,
      ),
  );
  const [tab, setTab] = useState<'select' | 'create'>(
    currentAddress &&
      order?.customer?.addresses?.some(
        (i) =>
          i.streetLine1 === currentAddress?.streetLine1 &&
          i.fullName === currentAddress.fullName &&
          i.postalCode === currentAddress.postalCode,
      )
      ? 'select'
      : 'create',
  );
  const isShipping = type === 'shipping';

  const handleMethodChange = async ({
    address,
    isShipping,
    createForCustomer,
  }: {
    address: CreateAddressBaseType;
    isShipping: boolean;
    createForCustomer: boolean;
  }) => {
    const orderId = order?.id;
    if (orderId && address) {
      if (createForCustomer && order?.customer?.id) {
        const { createCustomerAddress } = await adminApiMutation({
          createCustomerAddress: [{ customerId: order.customer.id, input: address }, { streetLine1: true }],
        });
        if (createCustomerAddress.streetLine1) {
          toast.success(t('selectAddress.newAddress', { address: createCustomerAddress.streetLine1 }));
        } else {
          toast.error(t('selectAddress.addressAddFailed'));
        }
      }
      const { setDraftOrderShippingAddress, setDraftOrderBillingAddress } = await adminApiMutation(
        isShipping
          ? { setDraftOrderShippingAddress: [{ orderId, input: address }, draftOrderSelector] }
          : { setDraftOrderBillingAddress: [{ orderId, input: address }, draftOrderSelector] },
      );
      if (setDraftOrderShippingAddress || setDraftOrderBillingAddress) {
        setOrder(isShipping ? setDraftOrderShippingAddress : setDraftOrderBillingAddress);
        toast(
          t(createForCustomer ? 'selectAddress.addressSuccessCreateToast' : 'selectAddress.addressSuccessSelectToast'),
        );
      } else {
        toast.error(
          t(createForCustomer ? 'selectAddress.addressFailedCreateToast' : 'selectAddress.addressFailedSelectToast'),
        );
      }
    }
  };

  const [createForCustomer, setCreateForCustomer] = useState(false);
  const { state, setField, checkIfAllFieldsAreValid, setState } = useGFFLP(
    'CreateAddressInput',
    'city',
    'company',
    'countryCode',
    'postalCode',
    'fullName',
    'phoneNumber',
    'postalCode',
    'streetLine1',
    'streetLine2',
    'province',
  )({
    fullName: {
      initialValue: currentAddress?.fullName,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.nameRequired')];
      },
    },
    company: { initialValue: currentAddress?.company },
    streetLine1: {
      initialValue: currentAddress?.streetLine1,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.streetRequired')];
      },
    },
    streetLine2: { initialValue: currentAddress?.streetLine2 },
    postalCode: {
      initialValue: currentAddress?.postalCode,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.postalCodeRequired')];
      },
    },
    countryCode: {
      initialValue: currentAddress?.country,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.countryRequired')];
      },
    },
    phoneNumber: {
      initialValue: currentAddress?.phoneNumber,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.phoneNumberRequired')];
        if (!phoneNumberRegExp.test(v)) return [t('selectAddress.phoneError')];
      },
    },
    city: {
      initialValue: currentAddress?.city,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.cityRequired')];
      },
    },
    province: {
      initialValue: currentAddress?.province,
    },
  });

  const submitAddress = async () => {
    if (tab === 'create') {
      const isValid = checkIfAllFieldsAreValid();
      if (!isValid) return;
      setSubmitting(true);
      await handleMethodChange({
        address: {
          fullName: state.fullName?.validatedValue,
          company: state.company?.validatedValue,
          streetLine1: state.streetLine1?.validatedValue || '',
          streetLine2: state.streetLine2?.validatedValue,
          postalCode: state.postalCode?.validatedValue,
          countryCode: state.countryCode?.validatedValue || '',
          phoneNumber: state.phoneNumber?.validatedValue,
          city: state.city?.validatedValue,
          province: state.province?.validatedValue,
        },
        isShipping,
        createForCustomer,
      });
      setSubmitting(false);
      setOpen(false);
    } else {
      if (!selectedAddress) return;
      setSubmitting(true);
      await handleMethodChange({
        address: {
          fullName: selectedAddress.fullName,
          company: selectedAddress.company,
          streetLine1: selectedAddress.streetLine1,
          streetLine2: selectedAddress.streetLine2,
          countryCode: selectedAddress.country?.code || '',
          city: selectedAddress.city,
          phoneNumber: selectedAddress.phoneNumber,
          postalCode: selectedAddress.postalCode,
          province: selectedAddress.province,
        },
        isShipping,
        createForCustomer,
      });
      setSubmitting(false);
      setOpen(false);
    }
  };
  console.log('toto', currentAddress, order);

  return (
    <Card
      className={cn(
        mode !== 'create' ? 'border-primary' : currentAddress?.streetLine1 ? 'border-green-500' : 'border-orange-800',
      )}
    >
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          {t(isShipping ? 'selectAddress.shippingHeader' : 'selectAddress.billingHeader')}
          {mode !== 'view' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Edit className="cursor-pointer" onClick={() => setOpen(true)} />
              </DialogTrigger>
              <DialogContent className="flex h-[80vh] max-h-[80vh] min-h-[80vh] flex-col">
                <DialogHeader>
                  <DialogTitle>{t('selectAddress.selectAddress')}</DialogTitle>
                  <DialogDescription>
                    {isShipping
                      ? order?.customer?.addresses?.length
                        ? t('selectAddress.selectShippingAddress')
                        : t('selectAddress.createShippingAddress')
                      : order?.customer?.addresses?.length
                        ? t('selectAddress.selectBillingAddress')
                        : t('selectAddress.createBillingAddress')}
                  </DialogDescription>
                </DialogHeader>
                <Tabs
                  value={tab}
                  defaultValue={tab}
                  onValueChange={(e) => setTab(e as 'select' | 'create')}
                  className="flex flex-1 basis-1 flex-col overflow-hidden"
                >
                  {order?.customer?.addresses?.length ? (
                    <TabsList className="my-4 w-full">
                      <TabsTrigger className="w-full" value="select">
                        {t('selectAddress.selectAddress')}
                      </TabsTrigger>
                      <TabsTrigger className="w-full" value="create">
                        {t('selectAddress.createAddress')}
                      </TabsTrigger>
                    </TabsList>
                  ) : null}
                  <TabsContent
                    value="select"
                    className={cn('flex flex-1 flex-col overflow-hidden', tab !== 'select' && 'hidden')}
                  >
                    <ScrollArea>
                      <div className="flex flex-col gap-2 px-4">
                        {order?.customer?.addresses?.map((address, index) => (
                          <Card
                            key={`${address.id}-${index}`}
                            className={cn(
                              'flex cursor-pointer items-center justify-between gap-4 p-4',
                              selectedAddress?.id === address.id && 'border-primary',
                            )}
                            onClick={() => setSelectedAddress(address)}
                          >
                            <div>
                              <CardDescription>{`${address.fullName} ${address.streetLine1} ${address.streetLine2}`}</CardDescription>
                              <CardDescription>{`${address.postalCode} ${address.city} ${address.country?.name || address.country?.code}`}</CardDescription>
                              <CardDescription>{`${t('selectAddress.phoneNumberShort', { value: address.phoneNumber })} ${address.company} `}</CardDescription>
                              {((isShipping && address.defaultShippingAddress) ||
                                (!isShipping && address.defaultBillingAddress)) && (
                                <CardDescription className="pt-2 text-primary">
                                  {t(isShipping ? 'selectAddress.isDefaultShipping' : 'selectAddress.isDefaultBilling')}
                                </CardDescription>
                              )}
                            </div>
                            <Edit
                              onClick={(e) => {
                                e.stopPropagation();
                                setState({ countryCode: address.country?.code || '', ...address });
                                setTab('create');
                              }}
                            />
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent
                    value="create"
                    className={cn('flex flex-1 flex-col overflow-hidden ', tab !== 'create' && 'hidden')}
                  >
                    <ScrollArea>
                      <Input
                        label="Full Name"
                        placeholder="Full Name"
                        value={state.fullName?.value}
                        defaultValue={state?.fullName?.value}
                        onChange={(e) => setField('fullName', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.fullName?.errors || []).toString()}
                      </p>
                      <Input
                        label="Company"
                        placeholder="Company"
                        value={state.company?.value}
                        defaultValue={state?.company?.value}
                        onChange={(e) => setField('company', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.company?.errors || []).toString()}
                      </p>
                      <Input
                        label="Street Line 1"
                        placeholder="Street Line 1"
                        value={state.streetLine1?.value}
                        defaultValue={state?.streetLine1?.value}
                        onChange={(e) => setField('streetLine1', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.streetLine1?.errors || []).toString()}
                      </p>
                      <Input
                        label="Street Line 2"
                        placeholder="Street Line 2"
                        value={state.streetLine2?.value}
                        defaultValue={state?.streetLine2?.value}
                        onChange={(e) => setField('streetLine2', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.streetLine2?.errors || []).toString()}
                      </p>
                      <Input
                        label="City"
                        placeholder="City"
                        defaultValue={currentAddress?.city}
                        onChange={(e) => setField('city', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.city?.errors || []).toString()}
                      </p>
                      <Input
                        label="Province"
                        placeholder="Province"
                        defaultValue={currentAddress?.province}
                        onChange={(e) => setField('province', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.province?.errors || []).toString()}
                      </p>
                      <Input
                        label="Postal Code"
                        placeholder="Postal Code"
                        value={state.postalCode?.value}
                        defaultValue={state?.postalCode?.value}
                        onChange={(e) => setField('postalCode', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.postalCode?.errors || []).toString()}
                      </p>
                      <Input
                        label="Phone Number"
                        placeholder="Phone Number"
                        value={state.phoneNumber?.value}
                        defaultValue={state?.phoneNumber?.value}
                        onChange={(e) => setField('phoneNumber', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.phoneNumber?.errors || []).toString()}
                      </p>
                      <div className="flex flex-row items-center gap-2">
                        <Label
                          htmlFor="createForCustomer"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('selectAddress.countrySelectLabel')}
                        </Label>
                        <Select
                          value={state.countryCode?.value}
                          onValueChange={(value) => setField('countryCode', value)}
                          required
                        >
                          <SelectTrigger className="my-2 ml-1 w-auto">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.countryCode?.errors || []).toString()}
                      </p>
                      {/* TO BE DONE I THE FUTURE - SET NEW ADDRESS AS DEFAULT */}
                      {/* {customerAddresses?.length ? (
                     <div className="my-2 flex flex-col gap-2">
                       <div className="flex items-center space-x-2">
                         <Checkbox id="default" />
                         <Label
                           htmlFor="default"
                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                         >
                           {t(
                             isShipping ? 'selectAddress.setAsDefaultShipping' : 'selectAddress.setAsDefaultBilling',
                           )}
                         </Label>
                       </div>
                     ) : null}
                     <div className="my-2 flex items-center space-x-2">
                       <Checkbox
                         id="createForCustomer"
                         value={createForCustomer ? 'true' : 'false'}
                         onCheckedChange={() => setCreateForCustomer(!createForCustomer)}
                       />
                       <Label
                         htmlFor="createForCustomer"
                         className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                       >
                         Create for customer
                       </Label>
                     </div>
                   ) : null} */}
                      <div className="my-2 flex items-center space-x-2 py-2">
                        <Checkbox
                          id="createForCustomer"
                          value={createForCustomer ? 'true' : 'false'}
                          onCheckedChange={() => setCreateForCustomer((p) => !p)}
                        />
                        <Label
                          htmlFor="createForCustomer"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('selectAddress.createForCustomer')}
                        </Label>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                <Button
                  className="self-end"
                  variant="outline"
                  disabled={submitting || (tab === 'select' && !selectedAddress)}
                  onClick={submitAddress}
                >
                  {t(tab === 'select' ? 'selectAddress.selectAddress' : 'selectAddress.createAddress')}
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
        <CardDescription className="pt-2">
          {!currentAddress ? (
            <div>{t(isShipping ? 'selectAddress.shippingDescription' : 'selectAddress.billingDescription')}</div>
          ) : (
            <Label className="flex flex-col ">
              <p className="text-sm">{currentAddress?.fullName}</p>
              <p className="text-sm">
                {currentAddress.streetLine1} {currentAddress?.streetLine2}
              </p>
              <p className="text-sm">
                {currentAddress.city} {currentAddress.postalCode} {currentAddress.province} {currentAddress.country}
              </p>
              <p className="text-sm">
                {currentAddress.company}{' '}
                {currentAddress.phoneNumber &&
                  t('selectAddress.phoneNumberShort', { value: currentAddress.phoneNumber })}
              </p>
            </Label>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
