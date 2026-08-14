import "dotenv/config";
import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

/** MYSQL_SSL=true em produção (ex: Railway) força conexão criptografada com o
 * banco. Fica desligado por padrão pra não quebrar o MySQL local do docker-compose,
 * que não tem certificado configurado. */
function resolveSsl(): mysql.SslOptions | undefined {
  if (process.env.MYSQL_SSL !== "true") return undefined;
  return {
    rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "localhost",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      ssl: resolveSsl(),
      waitForConnections: true,
      // Ambientes serverless rodam várias instâncias da função ao mesmo tempo,
      // cada uma com sua própria pool — um limite baixo por instância evita
      // estourar o max_connections do banco quando há tráfego concorrente.
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 5),
    });
  }
  return pool;
}
