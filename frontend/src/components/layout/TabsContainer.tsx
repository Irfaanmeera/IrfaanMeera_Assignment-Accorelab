import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import InvoiceGrid from '@/components/invoices/InvoiceGrid';
import PaymentGrid from '@/components/payments/PaymentGrid';

export default function TabsContainer() {
  const { user, token } = useSelector((s: RootState) => s.auth);
  const role = user?.role;
  const restoring = !!token && !user;

  const canSeeInvoices = role === 'admin' || role === 'sales' || restoring;
  const canSeePayments = role === 'admin' || role === 'accounts' || restoring;

  const defaultTab = canSeeInvoices ? 'invoices' : 'payments';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-6 h-11 bg-slate-100/80 p-1">
        {canSeeInvoices && <TabsTrigger value="invoices" className="px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Invoices</TabsTrigger>}
        {canSeePayments && <TabsTrigger value="payments" className="px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>}
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

