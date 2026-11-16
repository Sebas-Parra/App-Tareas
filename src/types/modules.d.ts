// Migraciones SQL de Drizzle (inline-import las convierte en string)
declare module '*.sql' {
  const sql: string;
  export default sql;
}
