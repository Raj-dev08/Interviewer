
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  Globe2,
  Loader2,
  Search,
  Save,
  Plus,
  X,
  SlidersHorizontal,
} from "lucide-react";

import {
  useAutomationStore,
  type SearchPreference,
} from "@/store/useAutomation";

const createEmptyForm = (): SearchPreference => ({
  role: [],
  keywords: [],
  locations: [],
  remote: false,
  experience: "any",
  employmentType: [],
  excludedCompanies: [],
});

const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

const inputClassName =
  `box-border h-11 w-full min-w-0 rounded-lg 
  border border-zinc-800 bg-zinc-950 
  px-10 text-sm text-zinc-100 text-center
  outline-none transition placeholder:text-zinc-600 
  focus:border-blue-500 focus:ring-2 
  focus:ring-blue-500/15`;

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-indigo-400">
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-zinc-100">
          {title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-200">
      {children}
    </label>
  );
}

function TagInput({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [value, setValue] = useState("");

  const addItem = () => {
    const item = value.trim();

    if (!item) return;

    const exists = items.some(
      (existing) =>
        existing.toLowerCase() === item.toLowerCase()
    );

    if (exists) {
      setValue("");
      return;
    }

    onChange([...items, item]);
    setValue("");
  };

  return (
    <div className="space-y-3">
      <FieldLabel>{label}</FieldLabel>

      <div className="flex min-w-0 items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className={inputClassName}
        />

        <button
          type="button"
          onClick={addItem}
          disabled={!value.trim()}
          className="inline-flex px-4 h-11 shrink-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/70 px-3.5 text-sm font-medium text-zinc-300 transition hover:border-indigo-500/50 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300"
            >
              {item}

              <button
                type="button"
                onClick={() =>
                  onChange(
                    items.filter((_, i) => i !== index)
                  )
                }
                className="text-zinc-500 transition hover:text-red-400"
                aria-label={`Remove ${item}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutomationPreferencesPage() {
  const router = useRouter();

  const {
    profile,
    loading,
    savingPreferences,
    fetchAutomationData,
    updatePreferences,
  } = useAutomationStore();

  const [form, setForm] = useState<SearchPreference>(
    createEmptyForm()
  );

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!profile) {
      fetchAutomationData();
    }
  }, [profile, fetchAutomationData]);

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        ...createEmptyForm(),
        ...(profile.searchPreference?.[0] || {}),
        role: profile.searchPreference?.[0]?.role || [],
        keywords:
          profile.searchPreference?.[0]?.keywords || [],
        locations:
          profile.searchPreference?.[0]?.locations || [],
        employmentType:
          profile.searchPreference?.[0]?.employmentType || [],
        excludedCompanies:
          profile.searchPreference?.[0]?.excludedCompanies || [],
      });

      setInitialized(true);
    }
  }, [profile, initialized]);

  const updateField = (
    key: keyof SearchPreference,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleEmployment = (type: string) => {
    const current = form.employmentType || [];

    updateField(
      "employmentType",
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  const save = async () => {
    const preferences = [
      form,
      ...(profile?.searchPreference?.slice(1) || []),
    ];

    await updatePreferences({
      searchPreference: preferences,
    });
  };

  if (loading && !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-400">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Loading preferences...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="mx-auto max-w-4xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">

        {/* Header */}
        <header className="mt-8 mb-3">
          

          <div className="flex items-center justify-between gap-3">
            
            <button
                type="button"
                onClick={() =>
                router.back()
                }
                className="inline-flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
                <ArrowLeft size={16} />
                Back
          </button>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Search preferences
            </h1>
          </div>
        </header>

        {/* Preferences */}
        <div className="space-y-5">

          {/* Target opportunities */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <SectionHeading
              icon={Search}
              title="Target opportunities"
              description="Define the roles and skills you're looking for."
            />

            <div className="mt-6 space-y-6">
              <TagInput
                label="Target roles"
                placeholder="e.g. Backend Developer"
                items={form.role || []}
                onChange={(value) =>
                  updateField("role", value)
                }
              />

              <TagInput
                label="Skills and keywords"
                placeholder="e.g. Node.js, TypeScript"
                items={form.keywords || []}
                onChange={(value) =>
                  updateField("keywords", value)
                }
              />

              <TagInput
                label="Preferred locations"
                placeholder="e.g. Kolkata, Remote"
                items={form.locations || []}
                onChange={(value) =>
                  updateField("locations", value)
                }
              />
            </div>
          </section>

          {/* Work preferences */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <SectionHeading
              icon={BriefcaseBusiness}
              title="Work preferences"
              description="Choose your preferred employment options."
            />

            <div className="mt-6 space-y-6">

              {/* Experience */}
              <div className="space-y-3">
                <FieldLabel>Experience level</FieldLabel>

                <select
                  value={form.experience || "any"}
                  onChange={(e) =>
                    updateField("experience", e.target.value)
                  }
                  className={`${inputClassName} sm:max-w-sm`}
                >
                  <option className="bg-zinc-900" value="any">
                    Any experience
                  </option>
                  <option className="bg-zinc-900" value="Entry level">
                    Entry level
                  </option>
                  <option className="bg-zinc-900" value="0-1 years">
                    0-1 years
                  </option>
                  <option className="bg-zinc-900" value="1-2 years">
                    1-2 years
                  </option>
                  <option className="bg-zinc-900" value="2-5 years">
                    2-5 years
                  </option>
                  <option className="bg-zinc-900" value="5+ years">
                    5+ years
                  </option>
                </select>
              </div>

              {/* Employment type */}
              <div className="space-y-3">
                <FieldLabel>Employment type</FieldLabel>

                <div className="flex flex-wrap gap-2">
                  {employmentTypes.map((type) => {
                    const selected = (
                      form.employmentType || []
                    ).includes(type);

                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          toggleEmployment(type)
                        }
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-zinc-700"
                          }`}
                        >
                          {selected && (
                            <Check
                              size={11}
                              strokeWidth={3}
                            />
                          )}
                        </span>

                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remote jobs - single checkbox */}
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-indigo-400">
                    <Globe2 size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Remote jobs
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Prioritize work-from-home opportunities.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={Boolean(form.remote)}
                  onChange={(e) =>
                    updateField("remote", e.target.checked)
                  }
                  className="h-5 w-5 shrink-0 cursor-pointer accent-indigo-500"
                />
              </label>
            </div>
          </section>

          {/* Company exclusions */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <SectionHeading
              icon={Building2}
              title="Company exclusions"
              description="Skip companies you don't want in your results."
            />

            <div className="mt-6">
              <TagInput
                label="Excluded companies"
                placeholder="e.g. Company name"
                items={form.excludedCompanies || []}
                onChange={(value) =>
                  updateField("excludedCompanies", value)
                }
              />
            </div>
          </section>
        </div>

        {/* Bottom save footer */}
        <footer className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              Save to apply your preferences.
            </p>

            <button
              type="button"
              onClick={save}
              disabled={savingPreferences}
              className=" inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPreferences ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {savingPreferences
                ? "Saving..."
                : "Save preferences"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
