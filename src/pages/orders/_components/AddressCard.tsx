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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddressBaseType, CreateAddressBaseType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { useGFFLP } from '@/lists/useGflp';
import { phoneNumberRegExp } from '@/utils/regExp';
import { Edit } from 'lucide-react';
import React, { PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

export const AddressCard: React.FC<
  PropsWithChildren<{
    type: 'shipping' | 'billing';
    defaultValue?: DefaultAddressValue;
    countries: { code: string; name: string }[];
    orderId?: string;
    isDraft?: boolean;
    customerAddresses?: DefaultAddress[];
    onSubmitted: ({
      address,
      tab,
      isShipping,
      createForCustomer,
    }: {
      address: CreateAddressBaseType;
      tab: string;
      isShipping: boolean;
      createForCustomer: boolean;
    }) => Promise<void>;
  }>
> = ({ onSubmitted, isDraft, orderId, children, type, defaultValue, customerAddresses, countries }) => {
  const { t } = useTranslation('orders');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DefaultAddress | undefined>(
    customerAddresses?.find(
      (i) =>
        i.streetLine1 === defaultValue?.streetLine1 &&
        i.fullName === defaultValue.fullName &&
        i.postalCode === defaultValue.postalCode,
    ),
  );
  const [tab, setTab] = useState<'select' | 'create'>(
    customerAddresses?.some(
      (i) =>
        i.streetLine1 === defaultValue?.streetLine1 &&
        i.fullName === defaultValue.fullName &&
        i.postalCode === defaultValue.postalCode,
    )
      ? 'select'
      : 'create',
  );
  const isShipping = type === 'shipping';

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
      initialValue: defaultValue?.fullName,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.nameRequired')];
      },
    },
    company: { initialValue: defaultValue?.company },
    streetLine1: {
      initialValue: defaultValue?.streetLine1,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.streetRequired')];
      },
    },
    streetLine2: { initialValue: defaultValue?.streetLine2 },
    postalCode: {
      initialValue: defaultValue?.postalCode,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.postalCodeRequired')];
      },
    },
    countryCode: {
      initialValue: defaultValue?.country,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.countryRequired')];
      },
    },
    phoneNumber: {
      initialValue: defaultValue?.phoneNumber,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.phoneNumberRequired')];
        if (!phoneNumberRegExp.test(v)) return [t('selectAddress.phoneError')];
      },
    },
    city: {
      initialValue: defaultValue?.city,
      validate: (v) => {
        if (!v || v === '') return [t('selectAddress.cityRequired')];
      },
    },
    province: {
      initialValue: defaultValue?.province,
    },
  });

  const submitAddress = async () => {
    if (tab === 'create') {
      const isValid = checkIfAllFieldsAreValid();
      if (!isValid) return;
      setSubmitting(true);
      await onSubmitted({
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
        tab,
        isShipping,
        createForCustomer,
      });
      setSubmitting(false);
      setOpen(false);
    } else {
      if (!selectedAddress) return;
      setSubmitting(true);
      await onSubmitted({
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
        tab,
        isShipping,
        createForCustomer,
      });
      setSubmitting(false);
      setOpen(false);
    }
  };

  return (
    <Card
      className={cn(!isDraft ? 'border-primary' : defaultValue?.streetLine1 ? 'border-green-500' : 'border-orange-800')}
    >
      <CardHeader>
        <CardTitle> {t(isShipping ? 'selectAddress.shippingHeader' : 'selectAddress.billingHeader')}</CardTitle>
        <CardDescription>
          {t(isShipping ? 'selectAddress.shippingDescription' : 'selectAddress.billingDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div>
            {defaultValue ? (
              <div className="flex flex-wrap">
                {defaultValue.fullName && (
                  <div className="w-full text-sm">
                    {t('selectAddress.fullName')}: <span className="text-gray-300">{defaultValue.fullName}</span>
                  </div>
                )}
                {defaultValue.company && (
                  <div className="w-full  text-sm">
                    {t('selectAddress.company')}: {defaultValue.company}
                  </div>
                )}
                {defaultValue.streetLine1 && (
                  <div className="w-full text-sm">
                    {t('selectAddress.street1')}: {defaultValue.streetLine1}
                  </div>
                )}
                {defaultValue.streetLine2 && (
                  <div className="w-full text-sm">
                    {t('selectAddress.street2')}: {defaultValue.streetLine2}
                  </div>
                )}
                {defaultValue.city && (
                  <div className="w-full  text-sm">
                    {t('selectAddress.city')}: {defaultValue.city}
                  </div>
                )}
                {defaultValue.province && (
                  <div className="w-full text-sm">
                    {t('selectAddress.province')}: {defaultValue.province}
                  </div>
                )}
                {defaultValue.postalCode && (
                  <div className="w-full text-sm">
                    {t('selectAddress.postalCode')}: {defaultValue.postalCode}
                  </div>
                )}
                {defaultValue.country && (
                  <div className="w-full  text-sm">
                    {t('selectAddress.country')}: {defaultValue.country}
                  </div>
                )}
                {defaultValue.phoneNumber && (
                  <div className="w-full  text-sm">
                    {t('selectAddress.phoneNumber')}: {defaultValue.phoneNumber}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!orderId}>
                  {t(
                    isShipping
                      ? defaultValue
                        ? 'selectAddress.changeShippingAddress'
                        : customerAddresses?.length
                          ? 'selectAddress.selectShippingAddress'
                          : 'selectAddress.createShippingAddress'
                      : defaultValue
                        ? 'selectAddress.changeBillingAddress'
                        : customerAddresses?.length
                          ? 'selectAddress.selectBillingAddress'
                          : 'selectAddress.createBillingAddress',
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="flex h-[80vh] max-h-[80vh] min-h-[80vh] flex-col">
                <DialogHeader>
                  <DialogTitle>{t('selectAddress.selectAddress')}</DialogTitle>
                  <DialogDescription>
                    {isShipping
                      ? customerAddresses?.length
                        ? t('selectAddress.selectShippingAddress')
                        : t('selectAddress.createShippingAddress')
                      : customerAddresses?.length
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
                  {customerAddresses?.length ? (
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
                        {customerAddresses?.map((address, index) => (
                          <Card
                            key={`${address.id}-${index}`}
                            className={cn(
                              'flex cursor-pointer items-center gap-4 p-4',
                              selectedAddress?.id === address.id && 'border-primary',
                            )}
                            onClick={() => setSelectedAddress(address)}
                          >
                            <div>
                              <CardDescription>{`${address.fullName} ${address.streetLine1} ${address.streetLine2}`}</CardDescription>
                              <CardDescription>{`${address.postalCode} ${address.city} ${address.country?.name || address.country?.code}`}</CardDescription>
                              <CardDescription>{`${t('selectAddress.phoneNumberShort')}${address.phoneNumber} ${address.company} `}</CardDescription>
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
                        defaultValue={defaultValue?.city}
                        onChange={(e) => setField('city', e.target.value)}
                        required
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.city?.errors || []).toString()}
                      </p>
                      <Input
                        label="Province"
                        placeholder="Province"
                        defaultValue={defaultValue?.province}
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
                <div className="flex w-full justify-between gap-2">
                  <DialogClose asChild>
                    <Button type="button" className="w-full" variant="secondary" disabled={submitting}>
                      {t('selectAddress.close')}
                    </Button>
                  </DialogClose>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={submitting || (tab === 'select' && !selectedAddress)}
                    onClick={submitAddress}
                  >
                    {t(tab === 'select' ? 'selectAddress.selectAddress' : 'selectAddress.createAddress')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
