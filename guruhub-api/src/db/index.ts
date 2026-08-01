import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../schema/index";

const connectionUri = process.env.DATABASE_URL || "mysql://guruhub:guruhub123@127.0.0.1:3306/guruhub";

const poolConnection = mysql.createPool({
  uri: connectionUri,
  waitForConnections: true,
  connectionLimit: 50,
  maxIdle: 25,
  idleTimeout: 30000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
