import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DEFAULT_PLUMBING_SERVICES } from "./default-plumbing-services";
import { provisionPlumbingServices } from "./provision-plumbing-services";

type Row = Record<string, unknown>;
function fixture(plumberCount = 1) {
  const tables: Record<string, Row[]> = {
    trades: [{ id: "plumbing", slug_singular: "plombier" }],
    services: DEFAULT_PLUMBING_SERVICES.map((service, index) => ({ ...service, id: `service-${index}`, trade_id: "plumbing" })),
    professionals: [...Array.from({ length: plumberCount }, (_, index) => ({ profile_id: `plumber-${String(index).padStart(3, "0")}`, trade_id: "plumbing" })), { profile_id: "electrician", trade_id: "electric" }],
    professional_services: [],
  };
  let sequence = 0;
  function from(table: string) {
    const filters: ((row: Row) => boolean)[] = [];
    let update: Row | undefined;
    let insert: Row[] | undefined;
    let conflicts: string[] = [];
    let start = 0, end = 999;
    const query = {
      select: (_columns: string) => query,
      eq: (column: string, value: unknown) => { filters.push(row => row[column] === value); return query; },
      in: (column: string, values: unknown[]) => { filters.push(row => values.includes(row[column])); return query; },
      not: (column: string, _operator: string, value: string) => { const values = value.slice(1, -1).split(","); filters.push(row => !values.includes(String(row[column]))); return query; },
      order: (_column: string) => query,
      range: (first: number, last: number) => { start = first; end = last; return query; },
      limit: (count: number) => { end = Math.min(count, 1000) - 1; return query; },
      update: (value: Row) => { update = value; return query; },
      upsert: (rows: Row[], options: { onConflict: string; ignoreDuplicates: boolean }) => { insert = rows; conflicts = options.onConflict.split(","); expect(options.ignoreDuplicates).toBe(true); return query; },
      single: async () => { const result = execute(); return { ...result, data: result.data[0] ?? null }; },
      then: (resolve: (value: { data: Row[]; error: null }) => unknown) => Promise.resolve(execute()).then(resolve),
    };
    function execute() {
      if (insert) {
        for (const row of insert) if (!tables[table].some(existing => conflicts.every(key => row[key] === existing[key]))) tables[table].push({ id: `generated-${++sequence}`, ...row });
      }
      const matching = tables[table].filter(row => filters.every(filter => filter(row)));
      if (update) matching.forEach(row => Object.assign(row, update));
      return { data: matching.slice(start, end + 1), error: null };
    }
    return query;
  }
  return { client: { from } as unknown as SupabaseClient<Database>, tables };
}

describe("automatic plumbing services", () => {
  it("assigns the complete standard set without changing existing prices or booking references", async () => {
    const { client, tables } = fixture();
    tables.professional_services.push(
      { id: "booked-service", professional_id: "plumber-000", service_id: "service-1", pricing_type: "fixed", price_cents: 9900, duration_minutes: 60, active: false },
      { id: "legacy", professional_id: "plumber-000", service_id: "nonstandard", active: true },
      { id: "electric-service", professional_id: "electrician", service_id: "electric", active: true },
    );
    expect(await provisionPlumbingServices(client)).toEqual({ plumbers: 1, servicesPerPlumber: 7 });
    expect(tables.professional_services.find(row => row.id === "booked-service")).toMatchObject({ pricing_type: "fixed", price_cents: 9900, duration_minutes: 60, active: true });
    expect(tables.professional_services.find(row => row.id === "legacy")).toMatchObject({ active: false });
    expect(tables.professional_services.find(row => row.id === "electric-service")).toMatchObject({ active: true });
    const count = tables.professional_services.length;
    await provisionPlumbingServices(client);
    expect(tables.professional_services).toHaveLength(count);
  });

  it("assigns a new plumber without modifying another plumber", async () => {
    const { client, tables } = fixture(2);
    await provisionPlumbingServices(client, "plumber-001");
    expect(tables.professional_services).toHaveLength(7);
    expect(tables.professional_services.every(row => row.professional_id === "plumber-001" && row.pricing_type === "quote" && row.price_cents === null)).toBe(true);
  });

  it("covers all plumbers across pages under the API row limit", async () => {
    const { client, tables } = fixture(150);
    expect(await provisionPlumbingServices(client)).toEqual({ plumbers: 150, servicesPerPlumber: 7 });
    expect(tables.professional_services).toHaveLength(1050);
  });
});
