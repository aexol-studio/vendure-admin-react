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
import { AddressBaseType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { useGFFLP } from '@/lists/useGflp';
import React, { PropsWithChildren, useState } from 'react';

export const AddressCard: React.FC<
  PropsWithChildren<{
    type: 'shipping' | 'billing';
    defaultValue?: AddressBaseType & { country?: string };
    countries: { code: string; name: string }[];
    orderId?: string;
    isDraft?: boolean;
    customerAddresses?: (AddressBaseType & {
      id?: string;
      defaultBillingAddress?: boolean;
      defaultShippingAddress?: boolean;
      country?: { code?: string; name?: string };
    })[];
    onSubmitted: ({
      address,
      tab,
      isShipping,
      createForCustomer,
    }: {
      address?: AddressBaseType & { countryCode: string };
      tab: string;
      isShipping: boolean;
      createForCustomer: boolean;
    }) => Promise<void>;
  }>
> = ({ onSubmitted, isDraft, orderId, children, type, defaultValue, customerAddresses, countries }) => {
  const [tab, setTab] = useState(customerAddresses?.length ? 'select' : 'create');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<
    | (AddressBaseType & {
        id?: string;
        defaultBillingAddress?: boolean;
        defaultShippingAddress?: boolean;
        country?: { code?: string; name?: string };
      })
    | null
  >(null);
  const isShipping = type === 'shipping';

  const [createForCustomer, setCreateForCustomer] = useState(false);
  const { state, setField } = useGFFLP('CreateAddressInput')({
    fullName: {
      initialValue: defaultValue?.fullName,
      validate: (v) => (!v || v === '' ? ['Full Name is required'] : undefined),
    },
    company: { initialValue: defaultValue?.company },
    streetLine1: {
      initialValue: defaultValue?.streetLine1,
      validate: (v) => (!v || v === '' ? ['Street Line 1 is required'] : undefined),
    },
    streetLine2: { initialValue: defaultValue?.streetLine2, validate: (v) => {} },
    postalCode: {
      initialValue: defaultValue?.postalCode,
      validate: (v) => (!v || v === '' ? ['Postal Code is required'] : undefined),
    },
    countryCode: {
      initialValue: defaultValue?.country,
      validate: (v) => (!v || v === '' ? ['Country is required'] : undefined),
    },
    phoneNumber: {
      initialValue: defaultValue?.phoneNumber,
      validate: (v) => (!v || v === '' ? ['Phone Number is required'] : undefined),
    },
  });

  return (
    <Card
      className={cn(!isDraft ? 'border-primary' : defaultValue?.streetLine1 ? 'border-green-500' : 'border-orange-800')}
    >
      <CardHeader>
        <CardTitle>{isShipping ? 'Shipping' : 'Billing'} address</CardTitle>
        <CardDescription>{`Here you can set ${isShipping ? 'shipping' : 'billing'} address`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div>
            {defaultValue ? (
              <div className="flex flex-wrap">
                <div className="flex w-1/2 flex-col pb-1">
                  <p className="text-xs font-medium">Full Name</p>
                  <p className="text-sm font-medium">{defaultValue.fullName}</p>
                </div>
                <div className="flex w-1/2 flex-col pb-1">
                  <p className="text-xs font-medium">Company</p>
                  <p className="text-sm font-medium">{defaultValue.company}</p>
                </div>
                <div className="flex w-1/2 flex-col py-1">
                  <p className="text-xs font-medium">Street Line 1</p>
                  <p className="text-sm font-medium">{defaultValue.streetLine1}</p>
                </div>
                <div className="flex w-1/2 flex-col py-1">
                  <p className="text-xs font-medium">Street Line 2</p>
                  <p className="text-sm font-medium">{defaultValue.streetLine2}</p>
                </div>
                <div className="flex w-1/2 flex-col py-1">
                  <p className="text-xs font-medium">City</p>
                  <p className="text-sm font-medium">{defaultValue.city}</p>
                </div>
                <div className="flex w-1/2 flex-col py-1">
                  <p className="text-xs font-medium">Postal Code</p>
                  <p className="text-sm font-medium">{defaultValue.postalCode}</p>
                </div>
                <div className="flex w-1/2 flex-col pt-1">
                  <p className="text-xs font-medium">Country</p>
                  <p className="text-sm font-medium">{defaultValue.country}</p>
                </div>
                <div className="flex w-1/2 flex-col pt-1">
                  <p className="text-xs font-medium">Phone Number</p>
                  <p className="text-sm font-medium">{defaultValue.phoneNumber}</p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!orderId}>
                  {isShipping
                    ? defaultValue
                      ? 'Change shipping address'
                      : customerAddresses?.length
                        ? 'Select shipping address'
                        : 'Create shipping address'
                    : defaultValue
                      ? 'Change billing address'
                      : customerAddresses?.length
                        ? 'Select billing address'
                        : 'Create billing address'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    const address = selectedAddress
                      ? {
                          fullName: selectedAddress.fullName,
                          company: selectedAddress.company,
                          streetLine1: selectedAddress.streetLine1,
                          streetLine2: selectedAddress.streetLine2,
                          postalCode: selectedAddress.postalCode,
                          countryCode: selectedAddress.country?.code || '',
                          phoneNumber: selectedAddress.phoneNumber,
                        }
                      : {
                          fullName: state.fullName?.value,
                          company: state.company?.value,
                          streetLine1: state.streetLine1?.value || defaultValue?.streetLine1 || '',
                          streetLine2: state.streetLine2?.value,
                          postalCode: state.postalCode?.value,
                          countryCode: state.countryCode?.value || defaultValue?.country || '',
                          phoneNumber: state.phoneNumber?.value,
                        };
                    await onSubmitted({ address, tab, isShipping, createForCustomer });
                    setSubmitting(false);
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Select Address</DialogTitle>
                    <DialogDescription>
                      {isShipping
                        ? customerAddresses?.length
                          ? 'Select shipping address'
                          : 'Create shipping address'
                        : customerAddresses?.length
                          ? 'Select billing address'
                          : 'Create billing address'}
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={tab} defaultValue={tab} onValueChange={setTab}>
                    {customerAddresses?.length ? (
                      <TabsList className="w-full">
                        <TabsTrigger className="w-full" value="select">
                          Select Address
                        </TabsTrigger>
                        <TabsTrigger className="w-full" value="create">
                          Create Address
                        </TabsTrigger>
                      </TabsList>
                    ) : null}
                    <TabsContent value="select">
                      <Select
                        value={selectedAddress?.id}
                        onValueChange={(value) => {
                          const address = customerAddresses?.find((addr) => addr.id === value);
                          if (address) setSelectedAddress(address);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {customerAddresses?.map((address) => (
                              <SelectItem key={address.id} value={address.id || ''}>
                                {address.streetLine1}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    <TabsContent value="create">
                      <form>
                        <Input
                          label="Full Name"
                          placeholder="Full Name"
                          value={state.fullName?.value}
                          defaultValue={state?.fullName?.value}
                          onChange={(e) => setField('fullName', e.target.value)}
                          required
                        />
                        <Input
                          label="Company"
                          placeholder="Company"
                          value={state.company?.value}
                          defaultValue={state?.company?.value}
                          onChange={(e) => setField('company', e.target.value)}
                        />
                        <Input
                          label="Street Line 1"
                          placeholder="Street Line 1"
                          value={state.streetLine1?.value}
                          defaultValue={state?.streetLine1?.value}
                          onChange={(e) => setField('streetLine1', e.target.value)}
                          required
                        />
                        <Input
                          label="Street Line 2"
                          placeholder="Street Line 2"
                          value={state.streetLine2?.value}
                          defaultValue={state?.streetLine2?.value}
                          onChange={(e) => setField('streetLine2', e.target.value)}
                        />
                        <Input label="City" placeholder="City" defaultValue={defaultValue?.city} required />
                        <Input
                          label="Postal Code"
                          placeholder="Postal Code"
                          value={state.postalCode?.value}
                          defaultValue={state?.postalCode?.value}
                          onChange={(e) => setField('postalCode', e.target.value)}
                          required
                        />
                        <Select
                          value={state.countryCode?.value}
                          onValueChange={(value) => setField('countryCode', value)}
                        >
                          <SelectTrigger>
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
                        <Input
                          label="Phone Number"
                          placeholder="Phone Number"
                          value={state.phoneNumber?.value}
                          defaultValue={state?.phoneNumber?.value}
                          onChange={(e) => setField('phoneNumber', e.target.value)}
                          required
                        />
                        {customerAddresses?.length ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="default" />
                              <Label
                                htmlFor="default"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Set as default {isShipping ? 'shipping' : 'billing'} address
                              </Label>
                            </div>
                          </div>
                        ) : null}
                        <div className="my-2 flex items-center space-x-2">
                          <Checkbox
                            id="createForCustomer"
                            value={createForCustomer ? 'true' : 'false'}
                            onChange={() => setCreateForCustomer(!createForCustomer)}
                          />
                          <Label
                            htmlFor="createForCustomer"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Create for customer
                          </Label>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                  <div className="flex w-full justify-between gap-2">
                    <DialogClose asChild>
                      <Button type="button" className="w-full" variant="secondary" disabled={submitting}>
                        Close
                      </Button>
                    </DialogClose>
                    <Button type="submit" className="w-full" variant="outline" disabled={submitting}>
                      {customerAddresses?.length ? 'Select Address' : 'Create Address'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
