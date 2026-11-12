using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainerLocationsAndAppointmentLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LocationId",
                table: "Appointments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "TrainerLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainerLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainerLocations_Users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LocationTravelTimes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationAId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationBId = table.Column<Guid>(type: "uuid", nullable: false),
                    Minutes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationTravelTimes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LocationTravelTimes_TrainerLocations_LocationAId",
                        column: x => x.LocationAId,
                        principalTable: "TrainerLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LocationTravelTimes_TrainerLocations_LocationBId",
                        column: x => x.LocationBId,
                        principalTable: "TrainerLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LocationTravelTimes_Users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_LocationId",
                table: "Appointments",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationTravelTimes_LocationAId",
                table: "LocationTravelTimes",
                column: "LocationAId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationTravelTimes_LocationBId",
                table: "LocationTravelTimes",
                column: "LocationBId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationTravelTimes_TrainerId_LocationAId_LocationBId",
                table: "LocationTravelTimes",
                columns: new[] { "TrainerId", "LocationAId", "LocationBId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainerLocations_TrainerId_Name",
                table: "TrainerLocations",
                columns: new[] { "TrainerId", "Name" },
                unique: true);

            // Backfill: every trainer that has completed onboarding (i.e. has a TrainerSettings
            // row — the only way an Appointment can exist) gets one default location, and every
            // existing appointment of theirs is pointed at it. Trainers add/rename real locations
            // afterwards through the new locations UI. Uses the md5/random uuid trick instead of
            // gen_random_uuid()/uuid_generate_v4() so this doesn't depend on pgcrypto/uuid-ossp
            // being installed on the target database.
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    r RECORD;
                    new_id uuid;
                BEGIN
                    FOR r IN SELECT DISTINCT ""TrainerId"" FROM ""TrainerSettings"" LOOP
                        new_id := md5(random()::text || clock_timestamp()::text)::uuid;

                        INSERT INTO ""TrainerLocations"" (""Id"", ""TrainerId"", ""Name"", ""SortOrder"")
                        VALUES (new_id, r.""TrainerId"", 'Ana Lokasyon', 0);

                        UPDATE ""Appointments"" SET ""LocationId"" = new_id WHERE ""TrainerId"" = r.""TrainerId"";
                    END LOOP;
                END $$;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_TrainerLocations_LocationId",
                table: "Appointments",
                column: "LocationId",
                principalTable: "TrainerLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_TrainerLocations_LocationId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "LocationTravelTimes");

            migrationBuilder.DropTable(
                name: "TrainerLocations");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_LocationId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "LocationId",
                table: "Appointments");
        }
    }
}
