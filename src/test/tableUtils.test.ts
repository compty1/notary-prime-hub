import { describe, it, expect } from "vitest";
import { sortBy, paginate, getPaginationMeta, filterBySearch, filterByField } from "@/lib/tableUtils";

describe("tableUtils", () => {
  const data = [
    { name: "Alice", age: 30, city: "Columbus" },
    { name: "Bob", age: 25, city: "Cleveland" },
    { name: "Charlie", age: 35, city: "Cincinnati" },
  ];

  it("sorts ascending by string", () => {
    const sorted = sortBy(data, "name", "asc");
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[2].name).toBe("Charlie");
  });

  it("sorts descending by number", () => {
    const sorted = sortBy(data, "age", "desc");
    expect(sorted[0].age).toBe(35);
  });

  it("paginates correctly", () => {
    const page1 = paginate(data, 1, 2);
    expect(page1).toHaveLength(2);
    const page2 = paginate(data, 2, 2);
    expect(page2).toHaveLength(1);
  });

  it("gets pagination meta", () => {
    const meta = getPaginationMeta(10, 2, 3);
    expect(meta.totalPages).toBe(4);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
    expect(meta.startIndex).toBe(4);
    expect(meta.endIndex).toBe(6);
  });

  it("filters by search term", () => {
    const filtered = filterBySearch(data, "alice", ["name"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Alice");
  });

  it("filters by field value", () => {
    const filtered = filterByField(data, "city", "Columbus");
    expect(filtered).toHaveLength(1);
  });

  it("returns all items when filter is 'all'", () => {
    const filtered = filterByField(data, "city", "all");
    expect(filtered).toHaveLength(3);
  });
});
