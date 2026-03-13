import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import InvoiceGrid from '@/components/invoices/InvoiceGrid';
import PaymentGrid from '@/components/payments/PaymentGrid';

export default function TabsContainer() {
  const role = useSelector((s: RootState) => s.auth.user?.role);

  const canSeeInvoices = role === 'admin' || role === 'sales';
  const canSeePayments = role === 'admin' || role === 'accounts';

  const defaultTab = canSeeInvoices ? 'invoices' : 'payments';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        {canSeeInvoices && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
        {canSeePayments && <TabsTrigger value="payments">Payments</TabsTrigger>}
      </TabsList>

      {canSeeInvoices && (
        <TabsContent value="invoices">
          <InvoiceGrid />
        </TabsContent>
      )}
      {canSeePayments && (
        <TabsContent value="payments">
          <PaymentGrid />
        </TabsContent>
      )}
    </Tabs>
  );
}

