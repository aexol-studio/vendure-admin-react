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
import { CustomerSearch } from '@/components/AutoComplete/CustomerSearch';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchCustomerType } from '@/graphql/draft_order';
import { ResolverInputTypes } from '@/zeus';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGFFLP } from '@/lists/useGflp';
import { cn } from '@/lib/utils';
import { emailRegExp, phoneNumberRegExp } from '@/utils/regExp';

export const CustomerSelectCard: React.FC<{
  isDraft: boolean;
  customer?: SearchCustomerType;
  handleCustomerEvent: ({
    customerId,
    input,
  }: {
    customerId?: string;
    input?: ResolverInputTypes['CreateCustomerInput'];
  }) => Promise<void>;
}> = ({ isDraft, customer, handleCustomerEvent }) => {
  const { t } = useTranslation('orders');
  const [tab, setTab] = useState('select');
  const [selected, setSelected] = useState<SearchCustomerType | undefined>(customer);
  const [open, setOpen] = useState(false);

  const { state, setField, checkIfAllFieldsAreValid } = useGFFLP(
    'CreateCustomerInput',
    'firstName',
    'lastName',
    'title',
    'phoneNumber',
    'emailAddress',
  )({
    firstName: {
      initialValue: '',
      validate: (v) => {
        if (!v || v === '') return [t('form.requiredError')];
      },
    },
    lastName: {
      initialValue: '',
      validate: (v) => {
        if (!v || v === '') return [t('form.requiredError')];
      },
    },
    phoneNumber: {
      initialValue: '',
      validate: (v) => {
        if (!v || v === '') return [t('form.requiredError')];
        if (!phoneNumberRegExp.test(v)) return [t('form.phoneError')];
      },
    },
    emailAddress: {
      initialValue: '',
      validate: (v) => {
        if (!v || v === '') return [t('form.requiredError')];
        if (!emailRegExp.test(v.toLowerCase())) return [t('form.emailError')];
      },
    },
  });

  useEffect(() => setSelected(customer), [customer]);

  const validateAndSubmitIfCorrect = async () => {
    const fieldsAreValid = checkIfAllFieldsAreValid();

    if (fieldsAreValid) {
      await handleCustomerEvent({
        input: {
          title: state.title?.validatedValue,
          firstName: state.firstName?.validatedValue || '',
          lastName: state.lastName?.validatedValue || '',
          emailAddress: state.emailAddress?.validatedValue || '',
          phoneNumber: state.phoneNumber?.validatedValue,
        },
      });
      setOpen(false);
    }
  };

  return (
    <Card className={cn(!isDraft ? 'border-primary' : customer?.id ? 'border-green-500' : 'border-orange-800')}>
      <CardHeader>
        <CardTitle>{t('create.selectCustomer.select')}</CardTitle>
        {customer ? (
          <CardDescription>
            <p>
              {customer.firstName} {customer.lastName}
            </p>
            <p>{customer.emailAddress}</p>
            {customer.phoneNumber && <p>{customer.phoneNumber}</p>}
          </CardDescription>
        ) : (
          <CardDescription>{t('create.selectCustomer.label')}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <Tabs>
              <DialogTrigger>
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                  {t(customer ? 'create.selectCustomer.change' : 'create.selectCustomer.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('create.selectCustomer.label')}</DialogTitle>
                  <DialogDescription>{t('create.selectCustomer.description')}</DialogDescription>
                </DialogHeader>
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="select">
                      {t('create.selectCustomer.selectTab')}
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="create">
                      {t('create.selectCustomer.createTab')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="select">
                    <CustomerSearch onSelect={(selected) => setSelected(selected)} />
                    <DialogDescription className="pb-10 pl-2 pt-12">
                      {t('create.selectCustomer.selectedCustomerText')}
                      {selected ? `${selected.firstName} ${selected.lastName} ${selected.emailAddress}` : ' ---'}
                    </DialogDescription>
                  </TabsContent>
                  <TabsContent value="create" className="pb-4">
                    <div className="pt-2">
                      <Input
                        label="Title"
                        name="title"
                        value={state.title?.value}
                        onChange={(e) => setField('title', e.target.value)}
                      />
                      <p className="mb-2 mt-1 min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.title?.errors || []).toString()}
                      </p>
                      <Input
                        label="First Name"
                        name="firstName"
                        value={state.firstName?.value}
                        onChange={(e) => setField('firstName', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.firstName?.errors || []).toString()}
                      </p>
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={state.lastName?.value}
                        onChange={(e) => setField('lastName', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.lastName?.errors || []).toString()}
                      </p>
                      <Input
                        label="Email"
                        name="emailAddress"
                        value={state.emailAddress?.value}
                        onChange={(e) => setField('emailAddress', e.target.value)}
                      />
                      <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.emailAddress?.errors || []).toString()}
                      </p>
                      <Input
                        label="Phone"
                        name="phoneNumber"
                        value={state.phoneNumber?.value}
                        onChange={(e) => setField('phoneNumber', e.target.value)}
                      />
                      <p className="mb-2 mt-1 min-h-5 border-orange-800 text-sm font-medium text-destructive">
                        {(state.phoneNumber?.errors || []).toString()}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex w-full justify-between gap-2">
                  <DialogClose asChild>
                    <Button type="button" className="w-full" variant="secondary">
                      {t('create.selectCustomer.close')}
                    </Button>
                  </DialogClose>
                  {tab === 'create' ? (
                    <Button className="w-full" variant="outline" onClick={validateAndSubmitIfCorrect}>
                      {t('create.selectCustomer.create')}
                    </Button>
                  ) : (
                    <DialogClose asChild>
                      <Button
                        type="button"
                        disabled={!selected}
                        onClick={async () => selected && (await handleCustomerEvent({ customerId: selected.id }))}
                        className="w-full"
                      >
                        {t('create.selectCustomer.select')}
                      </Button>
                    </DialogClose>
                  )}
                </div>
              </DialogContent>
            </Tabs>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
