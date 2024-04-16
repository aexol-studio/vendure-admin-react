import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  SelectContent,
  SelectItem,
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
import React from 'react';

export const AddressCard: React.FC<{ type: 'shipping' | 'billing' }> = ({ type }) => {
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);

  const isShipping = type === 'shipping';
  return (
    <Card>
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
                  {isShipping ? 'Select shipping address' : 'Select billing address'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Customer</DialogTitle>
                  <DialogDescription>Select a customer from the list below or create new one</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="select">
                  <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="select">
                      Select Customer
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="create">
                      Create New Customer
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="select">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Customers</SelectLabel>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="create">
                    <form>
                      <Input label="Title" />
                      <Input label="First Name" />
                      <Input label="Last Name" />
                      <Input label="Email" />
                      <Input label="Phone" />
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
                    Create Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {isShipping ? (
              <Dialog>
                <Button variant="outline" size="sm">
                  <DialogTrigger>Set shipping method</DialogTrigger>
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set shipping method</DialogTitle>
                    <DialogDescription>Select a shipping method</DialogDescription>
                  </DialogHeader>
                  <div className="flex w-full gap-2 justify-between">
                    <DialogClose asChild>
                      <Button type="button" className="w-full" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                    <Button type="submit" className="w-full" variant="outline">
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
