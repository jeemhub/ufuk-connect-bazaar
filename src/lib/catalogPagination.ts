/** Stable id cursor avoids the default PostgREST row cap and timestamp ties. */
export async function collectCatalogPages<T extends { id: string }>(
  fetchPage: (afterId: string | undefined, limit: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 500,
): Promise<T[]> {
  const result: T[] = [];
  let after: string | undefined;
  for (let page = 0; page < 200; page++) {
    const { data, error } = await fetchPage(after, pageSize);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const row of rows) {
      if (!row.id || (after !== undefined && row.id <= after)) throw new Error("Invalid catalog pagination order");
      result.push(row); after = row.id;
    }
    if (rows.length < pageSize) return result;
  }
  throw new Error("Catalog pagination exceeded its safety bound");
}
