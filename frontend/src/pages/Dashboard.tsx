import Navbar from '@/components/layout/Navbar';
import TabsContainer from '@/components/layout/TabsContainer';

export default function Dashboard() {
  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100/80">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <TabsContainer />
      </main>
    </div>
  );
}
