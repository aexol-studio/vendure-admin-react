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
import { AutoCompleteCustomerInput } from '@/components/AutoCompleteCustomerInput';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DraftOrderType, SearchCustomerType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { ResolverInputTypes } from '@/zeus';
import { useState } from 'react';

export const CustomerSelectCard: React.FC<{
  customer: DraftOrderType['customer'];
  valid: boolean;
  handleCustomerEvent: ({
    customerId,
    input,
  }: {
    customerId?: string;
    input?: ResolverInputTypes['CreateCustomerInput'];
  }) => Promise<void>;
}> = ({ customer, valid, handleCustomerEvent }) => {
  const [tab, setTab] = useState('select');
  const [selected, setSelected] = useState<SearchCustomerType | undefined>(undefined);

  return (
    <Card className={cn('w-full', { 'border-red-500': !valid })}>
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
                      <AutoCompleteCustomerInput onSelect={(selected) => setSelected(selected)} />
                      <DialogDescription className="pb-4 pt-4">
                        Selected customer:
                        {selected ? `${selected.firstName} ${selected.lastName} ${selected.emailAddress}` : ' ---'}
                      </DialogDescription>
                    </TabsContent>
                    <TabsContent value="create">
                      <Input label="Title" name="title" />
                      <Input label="First Name" name="firstName" />
                      <Input label="Last Name" name="lastName" />
                      <Input label="Email" name="emailAddress" />
                      <Input label="Phone" name="phoneNumber" />
                    </TabsContent>
                  </Tabs>
                  <div className="flex w-full justify-between gap-2">
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
                          disabled={!selected?.id}
                          onClick={async () => {
                            if (!selected?.id) return;
                            await handleCustomerEvent({ customerId: selected?.id });
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
