import { TendersDashboard } from "./components/TendersDashboard";
import { StatsCards } from "./components/StatsCards";
import { TenderGrid } from "./components/TenderGrid";
import { TenderCard } from "./components/TenderCard";
import { EmptyState } from "./components/EmptyState";

export { TendersDashboard, StatsCards, TenderGrid, TenderCard, EmptyState };
export { StatsCards as StatsSummary };

export default function TendersPage() {
  return <TendersDashboard />;
}