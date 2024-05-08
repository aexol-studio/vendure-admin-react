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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components';
import { CustomerSearch } from '@/components/AutoComplete/CustomerSearch';
import { DraftOrderType, SearchCustomerType, draftOrderSelector } from '@/graphql/draft_order';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGFFLP } from '@/lists/useGflp';
import { cn } from '@/lib/utils';
import { emailRegExp, phoneNumberRegExp } from '@/utils/regExp';
import { toast } from 'sonner';
import { Mode } from '@/pages/orders/OrderPage';
import { adminApiMutation } from '@/graphql/client';
import { Edit } from 'lucide-react';

export const CustomerSelectCard: React.FC<{
  mode: Mode;
  order: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
}> = ({ mode, order, setOrder }) => {
  const { t } = useTranslation('orders');
  const [tab, setTab] = useState<'select' | 'create'>('select');
  const [selected, setSelected] = useState<SearchCustomerType | undefined>(order.customer);
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

  useEffect(() => setSelected(order?.customer), [order]);

  const validateAndSubmitIfCorrect = async () => {
    if (order?.id) {
      if ((tab === 'create' && checkIfAllFieldsAreValid()) || (tab === 'select' && selected)) {
        const { setCustomerForDraftOrder } = await adminApiMutation({
          setCustomerForDraftOrder: [
            {
              orderId: order.id,
              ...(tab === 'select'
                ? { customerId: selected?.id }
                : {
                    input: {
                      title: state.title?.validatedValue,
                      firstName: state.firstName?.validatedValue || '',
                      lastName: state.lastName?.validatedValue || '',
                      emailAddress: state.emailAddress?.validatedValue || '',
                      phoneNumber: state.phoneNumber?.validatedValue,
                    },
                  }),
            },
            {
              __typename: true,
              '...on Order': draftOrderSelector,
              '...on EmailAddressConflictError': { errorCode: true, message: true },
            },
          ],
        });
        if (setCustomerForDraftOrder.__typename === 'Order') {
          setOrder(setCustomerForDraftOrder);
          setOpen(false);
          toast.success(t('create.selectCustomer.success'));
        } else {
          toast.error(t('create.selectCustomer.error'));
        }
      }
    }
  };

  return (
    <Card
      className={cn(
        mode !== 'create' ? 'border-primary' : order?.customer?.id ? 'border-green-500' : 'border-orange-800',
      )}
    >
      <CardHeader>
        <CardTitle className="flex flex-row justify-between text-base">
          {t('create.selectCustomer.select')}
          {mode !== 'view' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Edit size={20} className="cursor-pointer self-center" />
              </DialogTrigger>
              <DialogContent className="h-[80vh] min-w-max">
                <DialogHeader>
                  <DialogTitle>{t('create.selectCustomer.label')}</DialogTitle>
                  <DialogDescription>{t('create.selectCustomer.description')}</DialogDescription>
                </DialogHeader>
                <Tabs value={tab} onValueChange={(e) => setTab(e as 'create' | 'select')}>
                  <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="select">
                      {t('create.selectCustomer.selectTab')}
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="create">
                      {t('create.selectCustomer.createTab')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent className="focus-visible:ring-transparent" value="select">
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
                  <Button
                    disabled={tab === 'create' && !selected}
                    className="w-min place-self-end "
                    onClick={validateAndSubmitIfCorrect}
                  >
                    {t(tab === 'create' ? 'create.selectCustomer.create' : 'create.selectCustomer.selectButton')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
        {order.customer ? (
          <CardDescription className="pt-2">
            <p>
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <p>{order.customer.emailAddress}</p>
            {order.customer.phoneNumber && <p>{order.customer.phoneNumber}</p>}
          </CardDescription>
        ) : (
          <CardDescription>{t('create.selectCustomer.label')}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
};
