import pg from "pg";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

const TENANT_SQL_PATH = path.resolve(
  __dirname,
  "../../prisma/tenant-tables.sql"
);

export const provisionTenantSchema = async (
  schemaName: string
): Promise<void> => {

  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    // Create the tenant schema
    await client.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
    );

    // Set search_path to the new schema
    await client.query(
      `SET search_path TO "${schemaName}"`
    );

    // Run the DDL to create tenant tables
    const sql = fs.readFileSync(TENANT_SQL_PATH, "utf-8");
    await client.query(sql);
  } finally {
    await client.end();
  }
};

export const dropTenantSchema = async (schemaName: string): Promise<void> => {

  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await client.end();
  }
};
