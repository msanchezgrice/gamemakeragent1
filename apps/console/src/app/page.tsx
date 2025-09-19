import { loadRuns } from '../lib/data-source';
import { withMetrics } from '../lib/mock-data';
import { DashboardWithFilters } from './components/dashboard-with-filters';

export default async function DashboardPage() {
  console.log('🏠 Dashboard: Loading runs...');
  const runs = withMetrics(await loadRuns());
  console.log('🏠 Dashboard: Loaded runs count:', runs.length);
  console.log('🏠 Dashboard: Run themes:', runs.map(r => r.brief.theme));
  
  return <DashboardWithFilters runs={runs} />;
}

