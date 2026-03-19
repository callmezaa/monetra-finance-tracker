# Migrations

Jalankan migration untuk memastikan schema database dan index siap untuk Reports.

```bash
# Dari folder project, dengan kredensial PostgreSQL Anda
psql -U <DB_USER> -d finance_tracker -f backend/migrations/001_schema.sql
```

Atau dari psql:
```sql
\i backend/migrations/001_schema.sql
```

Schema ini membuat tabel (jika belum ada) dan menambahkan index untuk performa query Reports.
