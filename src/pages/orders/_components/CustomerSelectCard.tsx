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
import { DraftOrderType } from '@/graphql/draft_order';
import { ResolverInputTypes } from '@/zeus';
import { useState } from 'react';

export const CustomerSelectCard: React.FC<{
  customer: DraftOrderType['customer'];
  handleCustomerEvent: ({
    customerId,
    input,
  }: {
    customerId?: string;
    input?: ResolverInputTypes['CreateCustomerInput'];
  }) => Promise<void>;
}> = ({ customer, handleCustomerEvent }) => {
  const [tab, setTab] = useState('select');
  const [tempID, setTempID] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
        {customer ? (
          <CardDescription>
            {customer.firstName} {customer.lastName}
          </CardDescription>
        ) : (
          <CardDescription>Select customer for this order</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Dialog>
            <Tabs>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {customer ? 'Change Customer' : 'Select Customer'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Customer</DialogTitle>
                  <DialogDescription>Select a customer from the list below or create new one</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const input: ResolverInputTypes['CreateCustomerInput'] = {
                      title: formData.get('title') as string,
                      firstName: formData.get('firstName') as string,
                      lastName: formData.get('lastName') as string,
                      emailAddress: formData.get('emailAddress') as string,
                      phoneNumber: formData.get('phoneNumber') as string,
                    };
                    await handleCustomerEvent({ input });
                  }}
                >
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
                        selected={
                          customer && { value: customer.id, label: `${customer.firstName} ${customer.lastName}` }
                        }
                        onSelect={(selected) => setTempID(selected?.value ?? null)}
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
                      <Input label="Title" name="title" />
                      <Input label="First Name" name="firstName" />
                      <Input label="Last Name" name="lastName" />
                      <Input label="Email" name="emailAddress" />
                      <Input label="Phone" name="phoneNumber" />
                    </TabsContent>
                  </Tabs>
                  <div className="flex w-full gap-2 justify-between">
                    <DialogClose asChild>
                      <Button type="button" className="w-full" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      {tab === 'create' ? (
                        <Button type="submit" className="w-full" variant="outline">
                          Create Customer
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={!tempID}
                          onClick={async () => {
                            if (!tempID) return;
                            await handleCustomerEvent({ customerId: tempID });
                          }}
                          className="w-full"
                        >
                          Select Customer
                        </Button>
                      )}
                    </DialogClose>
                  </div>
                </form>
              </DialogContent>
            </Tabs>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
