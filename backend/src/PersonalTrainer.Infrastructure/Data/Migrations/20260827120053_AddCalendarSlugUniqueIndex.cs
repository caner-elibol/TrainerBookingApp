using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarSlugUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_CalendarSlug",
                table: "Users",
                column: "CalendarSlug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_CalendarSlug",
                table: "Users");
        }
    }
}
