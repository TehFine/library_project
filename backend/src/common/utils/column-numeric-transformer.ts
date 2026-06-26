import { ValueTransformer } from 'typeorm'

/**
 * TypeORM ValueTransformer for PostgreSQL `decimal` / `numeric` columns.
 *
 * The pg driver serialises numeric values as **strings** in JSON responses.
 * This transformer converts the raw string (or number) back to a plain
 * JavaScript `number` when reading from the database, and keeps it as a
 * number when writing — so the REST API always returns a proper numeric
 * type instead of a string.
 */
export const ColumnNumericTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value
  },
  from(value: string | number | null): number | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    return parseFloat(value)
  },
}
