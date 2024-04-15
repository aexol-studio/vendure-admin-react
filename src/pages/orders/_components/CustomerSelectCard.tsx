import { adminApiQuery } from '@/common/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  CardDescription,
} from '@/components';
import { AutoCompleteInput } from '@/components/AutoCompleteInput';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

const fakeCustomers = [
  { value: '1', label: 'John Doe' },
  { value: '2', label: 'Jane Doe' },
  { value: '3', label: 'John Smith' },
  { value: '4', label: 'Jane Smith' },
];

export const CustomerSelectCard = () => {
  const [tab, setTab] = useState('select');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
        <CardDescription>Select customer for this order</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Dialog>
            <Tabs>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Pick customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Customer</DialogTitle>
                  <DialogDescription>Select a customer from the list below or create new one</DialogDescription>
                </DialogHeader>
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="select">
                      Select Customer
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="create">
                      Create New Customer
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="select">
                    <AutoCompleteInput
                      route={async ({ filter }) => {
                        const data = await adminApiQuery()({
                          customers: [
                            { options: { take: 10, filter } },
                            { items: { id: true, firstName: true, lastName: true }, totalItems: true },
                          ],
                        });
                        return data.customers?.items.map((customer) => ({
                          value: customer?.id,
                          label: `${customer.firstName} ${customer.lastName}`,
                        }));
                      }}
                    />
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
                    {tab === 'select' ? 'Select Customer' : 'Create Customer'}
                  </Button>
                </div>
              </DialogContent>
            </Tabs>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
