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
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';

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
        <Dialog open={open} onOpenChange={setOpen}>
          <Tabs>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t(customer ? 'create.selectCustomer.change' : 'create.selectCustomer.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="h-max max-h-[80vh] min-w-max">
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
                  <CustomerSearch selectedCustomer={selected} onSelect={(selected) => setSelected(selected)} />
                </TabsContent>
                <TabsContent value="create" className="h-fit max-h-[calc(80vh-230px)] overflow-y-auto pt-2">
                  <Input
                    label={t('create.selectCustomer.titleLabel')}
                    name="title"
                    value={state.title?.value}
                    onChange={(e) => setField('title', e.target.value)}
                  />
                  <p className="mb-2 mt-1 min-h-5 border-orange-800 text-sm font-medium text-destructive">
                    {(state.title?.errors || []).toString()}
                  </p>
                  <Input
                    label={t('create.selectCustomer.firstNameLabel')}
                    name="firstName"
                    value={state.firstName?.value}
                    onChange={(e) => setField('firstName', e.target.value)}
                  />
                  <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                    {(state.firstName?.errors || []).toString()}
                  </p>
                  <Input
                    label={t('create.selectCustomer.lastNameLabel')}
                    name="lastName"
                    value={state.lastName?.value}
                    onChange={(e) => setField('lastName', e.target.value)}
                  />
                  <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                    {(state.lastName?.errors || []).toString()}
                  </p>
                  <Input
                    label={t('create.selectCustomer.emailLabel')}
                    name="emailAddress"
                    value={state.emailAddress?.value}
                    onChange={(e) => setField('emailAddress', e.target.value)}
                  />
                  <p className="mb-2 mt-1  min-h-5 border-orange-800 text-sm font-medium text-destructive">
                    {(state.emailAddress?.errors || []).toString()}
                  </p>
                  <Input
                    label={t('create.selectCustomer.phoneNumberLabel')}
                    name="phoneNumber"
                    value={state.phoneNumber?.value}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                  />
                  <p className="mt-1 min-h-5 border-orange-800 text-sm font-medium text-destructive">
                    {(state.phoneNumber?.errors || []).toString()}
                  </p>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                {tab === 'create' ? (
                  <Button className="w-min place-self-end " onClick={validateAndSubmitIfCorrect}>
                    {t('create.selectCustomer.create')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!selected}
                    onClick={async () => {
                      if (!selected) {
                        toast.error(t('create.selectCustomer.selectCustomerFailed'));
                        return;
                      }
                      await handleCustomerEvent({ customerId: selected.id });
                    }}
                    className="w-min place-self-end"
                  >
                    {t('create.selectCustomer.select')}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Tabs>
        </Dialog>
      </CardContent>
    </Card>
  );
};
