import Navbar from '@/components/layout/Navbar';
import TabsContainer from '@/components/layout/TabsContainer';

export default function Dashboard() {

  return (
    <div className="min-h-full bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl p-6">
        <TabsContainer />
      </div>
    </div>
  );
}

