using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalTrainer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileSettingsBodyMetricsReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateOfBirth",
                table: "Users",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "TrainerSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MonthlyActiveClientTarget",
                table: "TrainerSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MonthlyRenewalTargetPercent",
                table: "TrainerSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRevenueTarget",
                table: "TrainerSettings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyEmailEnabled",
                table: "TrainerSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyPaymentEnabled",
                table: "TrainerSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyPushEnabled",
                table: "TrainerSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PaytrMerchantId",
                table: "TrainerSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaytrMerchantKey",
                table: "TrainerSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaytrMerchantSalt",
                table: "TrainerSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string[]>(
                name: "Specialties",
                table: "TrainerSettings",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<int>(
                name: "YearsExperience",
                table: "TrainerSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BodyMetrics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WeightKg = table.Column<decimal>(type: "numeric", nullable: true),
                    ChestCm = table.Column<decimal>(type: "numeric", nullable: true),
                    WaistCm = table.Column<decimal>(type: "numeric", nullable: true),
                    HipCm = table.Column<decimal>(type: "numeric", nullable: true),
                    ArmCm = table.Column<decimal>(type: "numeric", nullable: true),
                    BodyFatPercent = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BodyMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BodyMetrics_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BodyMetrics_Users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BodyMetrics_ClientId",
                table: "BodyMetrics",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_BodyMetrics_TrainerId_ClientId_RecordedAt",
                table: "BodyMetrics",
                columns: new[] { "TrainerId", "ClientId", "RecordedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ClientId",
                table: "Reviews",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_TrainerId_ClientId",
                table: "Reviews",
                columns: new[] { "TrainerId", "ClientId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BodyMetrics");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "MonthlyActiveClientTarget",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "MonthlyRenewalTargetPercent",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "MonthlyRevenueTarget",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "NotifyEmailEnabled",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "NotifyPaymentEnabled",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "NotifyPushEnabled",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "PaytrMerchantId",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "PaytrMerchantKey",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "PaytrMerchantSalt",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "Specialties",
                table: "TrainerSettings");

            migrationBuilder.DropColumn(
                name: "YearsExperience",
                table: "TrainerSettings");
        }
    }
}
