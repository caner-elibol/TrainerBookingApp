using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261103150000_NormalizeUserPhones")]
    public partial class NormalizeUserPhones : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                WITH digits AS (
                    SELECT "Id", "Phone", regexp_replace("Phone", '\D', '', 'g') AS d
                    FROM "Users"
                    WHERE "Phone" IS NOT NULL
                ),
                candidates AS (
                    SELECT "Id", "Phone", right(d, 10) AS normalized
                    FROM digits
                    WHERE length(d) >= 10
                      AND left(d, length(d) - 10) IN ('', '0', '90', '0090')
                      AND left(right(d, 10), 1) = '5'
                ),
                unambiguous AS (
                    SELECT c.*
                    FROM candidates c
                    WHERE (SELECT count(*) FROM candidates c2 WHERE c2.normalized = c.normalized) = 1
                )
                UPDATE "Users" u
                SET "Phone" = un.normalized
                FROM unambiguous un
                WHERE u."Id" = un."Id"
                  AND u."Phone" <> un.normalized
                  AND NOT EXISTS (
                      SELECT 1 FROM "Users" other
                      WHERE other."Phone" = un.normalized AND other."Id" <> un."Id"
                  );
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
