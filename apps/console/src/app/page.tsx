import { loadRuns } from '../lib/data-source';
import { withMetrics } from '../lib/mock-data';
import { DashboardWithFilters } from './components/dashboard-with-filters';

export default async function DashboardPage() {
  const runs = withMetrics(await loadRuns());
  
  return <DashboardWithFilters runs={runs} />;
}

