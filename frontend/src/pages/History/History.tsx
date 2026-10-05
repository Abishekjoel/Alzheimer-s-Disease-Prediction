import { Filter, History as HistoryIcon, ScanSearch, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { analysisApi } from "@/api/analysis";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { UNSPLASH } from "@/utils/images";
import type { BloodGroup, CaseSex, MRIAnalysis, PredictedClass, UncertaintyLevel } from "@/types/api";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface FilterState {
  condition: "" | PredictedClass;
  uncertainty: "" | UncertaintyLevel;
  bloodGroup: "" | BloodGroup;
  sex: "" | CaseSex;
  ageMin: string;
  ageMax: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = {
  condition: "", uncertainty: "", bloodGroup: "", sex: "", ageMin: "", ageMax: "", dateFrom: "", dateTo: "",
};

function FilterFields({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Select value={filters.condition} onChange={(e) => onChange({ ...filters, condition: e.target.value as FilterState["condition"] })} aria-label="Filter by condition">
        <option value="">All conditions</option>
        <option value="CN">CN</option>
        <option value="MCI">MCI</option>
        <option value="AD">AD</option>
      </Select>
      <Select value={filters.uncertainty} onChange={(e) => onChange({ ...filters, uncertainty: e.target.value as FilterState["uncertainty"] })} aria-label="Filter by uncertainty">
        <option value="">All uncertainty</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>
      <Select value={filters.bloodGroup} onChange={(e) => onChange({ ...filters, bloodGroup: e.target.value as FilterState["bloodGroup"] })} aria-label="Filter by blood group">
        <option value="">Blood group</option>
        {BLOOD_GROUPS.map((bg) => (
          <option key={bg} value={bg}>{bg}</option>
        ))}
      </Select>
      <Select value={filters.sex} onChange={(e) => onChange({ ...filters, sex: e.target.value as FilterState["sex"] })} aria-label="Filter by gender">
        <option value="">Gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
      </Select>
      <Input type="number" placeholder="Age min" value={filters.ageMin} onChange={(e) => onChange({ ...filters, ageMin: e.target.value })} />
      <Input type="number" placeholder="Age max" value={filters.ageMax} onChange={(e) => onChange({ ...filters, ageMax: e.target.value })} />
      <Input type="date" aria-label="From date" value={filters.dateFrom} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })} />
      <Input type="date" aria-label="To date" value={filters.dateTo} onChange={(e) => onChange({ ...filters, dateTo: e.target.value })} />
    </div>
  );
}

export default function History() {
  const [analyses, setAnalyses] = useState<MRIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    analysisApi
      .history()
      .then((page) => setAnalyses(page.results))
      .catch(() => setError("Couldn't load analysis history."))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filtering over the currently-loaded page — see the note
  // in api/analysis.ts about server-side filtering not existing yet.
  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      if (filters.condition && a.predicted_class !== filters.condition) return false;
      if (filters.uncertainty && a.uncertainty_level !== filters.uncertainty) return false;
      if (filters.bloodGroup && a.case.blood_group !== filters.bloodGroup) return false;
      if (filters.sex && a.case.sex !== filters.sex) return false;
      if (filters.ageMin && (a.case.age_years ?? -1) < Number(filters.ageMin)) return false;
      if (filters.ageMax && (a.case.age_years ?? Infinity) > Number(filters.ageMax)) return false;
      if (filters.dateFrom && a.created_at.slice(0, 10) < filters.dateFrom) return false;
      if (filters.dateTo && a.created_at.slice(0, 10) > filters.dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = a.case.full_name.toLowerCase().includes(q);
        const matchesId = a.case_id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [analyses, search, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-strong bg-cover bg-center px-6 py-10 sm:px-10"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(11,16,32,0.8), rgba(11,16,32,0.5)), url(${UNSPLASH.iridescentBrain(1200)})`,
        }}
      >
        <span className="mono-tag inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase text-white/90 backdrop-blur">
          History
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Analysis history</h1>
        <p className="mt-1.5 max-w-md text-[13.5px] text-white/80">Every analysis you've run, searchable by name or case ID.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          iconLeft={<Search />}
          placeholder="Search by name or case ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="secondary" iconLeft={<Filter />} onClick={() => setDrawerOpen(true)} className="lg:hidden">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <div className="hidden flex-1 lg:block">
          <FilterFields filters={filters} onChange={setFilters} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" side="right">
        <div className="flex flex-col gap-3 p-3">
          <FilterFields filters={filters} onChange={setFilters} />
          <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </Button>
        </div>
      </Drawer>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/13] w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={analyses.length === 0 ? HistoryIcon : Search}
          title={analyses.length === 0 ? "No MRI analyses yet" : "No matching analyses"}
          description={analyses.length === 0 ? "Your first analysis will appear here." : "Try a different search or filter."}
          action={analyses.length === 0 ? { label: "Analyze an MRI", onClick: () => navigate("/app/analyze"), icon: <ScanSearch /> } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} onClick={() => navigate(`/app/results/${analysis.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
