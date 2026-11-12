using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261103170000_AddDefaultTrainerLocation")]
    public partial class AddDefaultTrainerLocation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "TrainerLocations" ("Id", "TrainerId", "Name", "SortOrder")
                SELECT gen_random_uuid(), s."TrainerId", 'Ana Konum', 0
                FROM "TrainerSettings" s
                WHERE NOT EXISTS (
                    SELECT 1 FROM "TrainerLocations" l WHERE l."TrainerId" = s."TrainerId"
                );
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
