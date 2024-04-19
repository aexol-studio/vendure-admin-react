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
  SelectLabel,
  CardDescription,
  Checkbox,
  Label,
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
import React, { PropsWithChildren } from 'react';

export const AddressCard: React.FC<
  PropsWithChildren<{
    type: 'shipping' | 'billing';
    defaultValue?: AddressBaseType & {
      country?: string;
    };
    customerAddresses?: (AddressBaseType & {
      id?: string;
      defaultBillingAddress?: boolean;
      defaultShippingAddress?: boolean;
      country?: { code?: string; name?: string };
    })[];
    valid: boolean;
  }>
> = ({ children, type, defaultValue, customerAddresses, valid }) => {
  const [selectedAddress, setSelectedAddress] = React.useState<AddressBaseType | null>(null);
  const isShipping = type === 'shipping';

  return (
    <Card className={cn('w-full', { 'border-red-500': !valid })}>
      <CardHeader>
        <CardTitle>{isShipping ? 'Shipping' : 'Billing'} address</CardTitle>
        <CardDescription>{`Here you can set ${isShipping ? 'shipping' : 'billing'} address`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {isShipping
                    ? selectedAddress
                      ? 'Change shipping address'
                      : customerAddresses?.length
                        ? 'Select shipping address'
                        : 'Create shipping address'
                    : selectedAddress
                      ? 'Change billing address'
                      : customerAddresses?.length
                        ? 'Select billing address'
                        : 'Create billing address'}
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                <Tabs defaultValue={customerAddresses?.length ? 'select' : 'create'}>
                  {customerAddresses?.length ? (
                    <TabsList className="w-full">
                      <>
                        <TabsTrigger className="w-full" value="select">
                          Select Address
                        </TabsTrigger>
                        <TabsTrigger className="w-full" value="create">
                          Create Address
                        </TabsTrigger>
                      </>
                    </TabsList>
                  ) : null}
                  <TabsContent value="select">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Addresses</SelectLabel>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="create">
                    <form>
                      <Input label="Full Name" placeholder="Full Name" defaultValue={defaultValue?.fullName} required />
                      <Input label="Company" placeholder="Company" defaultValue={defaultValue?.company} />
                      <Input
                        label="Street Line 1"
                        placeholder="Street Line 1"
                        defaultValue={defaultValue?.streetLine1}
                        required
                      />
                      <Input
                        label="Street Line 2"
                        placeholder="Street Line 2"
                        defaultValue={defaultValue?.streetLine2}
                      />
                      <Input label="City" placeholder="City" defaultValue={defaultValue?.city} required />
                      <Input
                        label="Postal Code"
                        placeholder="Postal Code"
                        defaultValue={defaultValue?.postalCode}
                        required
                      />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Countries</SelectLabel>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Input
                        label="Phone Number"
                        placeholder="Phone Number"
                        defaultValue={defaultValue?.phoneNumber}
                        required
                      />
                      {customerAddresses?.length ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="terms" />
                            <Label
                              htmlFor="terms"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Set as default {isShipping ? 'shipping' : 'billing'} address
                            </Label>
                          </div>
                        </div>
                      ) : null}
                    </form>
                  </TabsContent>
                </Tabs>
                <div className="flex w-full gap-2 justify-between">
                  <DialogClose asChild>
                    <Button type="button" className="w-full" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="w-full" variant="outline">
                    {customerAddresses?.length ? 'Select Address' : 'Create Address'}
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
