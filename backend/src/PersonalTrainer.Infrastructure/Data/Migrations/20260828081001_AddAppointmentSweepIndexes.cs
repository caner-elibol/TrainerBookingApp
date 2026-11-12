using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentSweepIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status_EndTime",
                table: "Appointments",
                columns: new[] { "Status", "EndTime" },
                filter: "\"Status\" = 2");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status_LockExpirationTime",
                table: "Appointments",
                columns: new[] { "Status", "LockExpirationTime" },
                filter: "\"Status\" = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_Status_EndTime",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_Status_LockExpirationTime",
                table: "Appointments");
        }
    }
}
