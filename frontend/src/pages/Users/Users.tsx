import { Filter, Search, User as UserIcon, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { patientsApi, type CaseFilters } from "@/api/patients";
import { PatientCard } from "@/components/analysis/PatientCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { BloodGroup, Case, CaseSex, PredictedClass } from "@/types/api";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface FilterState {
  bloodGroup: "" | BloodGroup;
  prediction: "" | PredictedClass;
  sex: "" | CaseSex;
  ageMin: string;
  ageMax: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = { bloodGroup: "", prediction: "", sex: "", ageMin: "", ageMax: "", dateFrom: "", dateTo: "" };

function FilterFields({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Select value={filters.bloodGroup} onChange={(e) => onChange({ ...filters, bloodGroup: e.target.value as FilterState["bloodGroup"] })} aria-label="Blood group">
        <option value="">Blood group</option>
        {BLOOD_GROUPS.map((bg) => (
          <option key={bg} value={bg}>{bg}</option>
        ))}
      </Select>
      <Select value={filters.prediction} onChange={(e) => onChange({ ...filters, prediction: e.target.value as FilterState["prediction"] })} aria-label="Predicted class">
        <option value="">Predicted class</option>
        <option value="CN">CN</option>
        <option value="MCI">MCI</option>
        <option value="AD">AD</option>
      </Select>
      <Select value={filters.sex} onChange={(e) => onChange({ ...filters, sex: e.target.value as FilterState["sex"] })} aria-label="Gender">
        <option value="">Gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
      </Select>
      <Input type="number" placeholder="Age min" value={filters.ageMin} onChange={(e) => onChange({ ...filters, ageMin: e.target.value })} />
      <Input type="number" placeholder="Age max" value={filters.ageMax} onChange={(e) => onChange({ ...filters, ageMax: e.target.value })} />
      <Input type="date" value={filters.dateFrom} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })} aria-label="From date" />
    </div>
  );
}

export default function Users() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const navigate = useNavigate();

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    setLoading(true);
    const apiFilters: CaseFilters = {
      search: debouncedSearch || undefined,
      blood_group: filters.bloodGroup || undefined,
      prediction: filters.prediction || undefined,
      sex: filters.sex || undefined,
      age_min: filters.ageMin ? Number(filters.ageMin) : undefined,
      age_max: filters.ageMax ? Number(filters.ageMax) : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    };
    patientsApi
      .listCases(apiFilters)
      .then((page) => {
        setCases(page.results);
        setError(null);
      })
      .catch(() => setError("Couldn't load users."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters]);

  const hasAnyRecord = useMemo(() => cases.length > 0 || activeFilterCount > 0 || debouncedSearch, [cases, activeFilterCount, debouncedSearch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading eyebrow="Users" title="Users" description="Search and review analyzed cases." />
        <Button iconLeft={<UserPlus />} onClick={() => navigate("/app/analyze")}>
          Analyze New MRI
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input iconLeft={<Search />} placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="secondary" iconLeft={<Filter />} onClick={() => setFilterDrawerOpen(true)} className="lg:hidden">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <div className="hidden flex-1 lg:block">
          <FilterFields filters={filters} onChange={setFilters} />
        </div>
      </div>

      <Drawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Filters" side="right">
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
            <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={hasAnyRecord ? Search : UserIcon}
          title={hasAnyRecord ? "No matching users found." : "No users yet"}
          description={hasAnyRecord ? "Try a different search or filter." : "Cases appear here once you analyze an MRI."}
          action={!hasAnyRecord ? { label: "Analyze an MRI", onClick: () => navigate("/app/analyze"), icon: <UserPlus /> } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <PatientCard key={c.id} patient={c} />
          ))}
        </div>
      )}
    </div>
  );
}
