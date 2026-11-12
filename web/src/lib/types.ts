export type DayOfWeekValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkingHourDto {
  dayOfWeek: DayOfWeekValue;
  startTime: string;
  endTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

export interface OnboardingRequest {
  expertiseArea: string;
  sessionDurationMinutes: number;
  bufferDurationMinutes: number;
  workingHours: WorkingHourDto[];
}

export interface TrainerSettingsResponse {
  expertiseArea: string;
  sessionDurationMinutes: number;
  bufferDurationMinutes: number;
  workingHours: WorkingHourDto[];
  calendarSlug: string | null;
  bio: string;
  specialties: string[];
  yearsExperience: number;
  monthlyRevenueTarget: number;
  monthlyActiveClientTarget: number;
  monthlyRenewalTargetPercent: number;
  notifyPushEnabled: boolean;
  notifyEmailEnabled: boolean;
  notifyPaymentEnabled: boolean;
  paytrMerchantId: string | null;
  paytrMerchantKey: string | null;
  paytrMerchantSalt: string | null;
}

export interface UpdateExtendedSettingsRequest {
  bio: string;
  specialties: string[];
  yearsExperience: number;
  monthlyRevenueTarget: number;
  monthlyActiveClientTarget: number;
  monthlyRenewalTargetPercent: number;
  notifyPushEnabled: boolean;
  notifyEmailEnabled: boolean;
  notifyPaymentEnabled: boolean;
  paytrMerchantId: string | null;
  paytrMerchantKey: string | null;
  paytrMerchantSalt: string | null;
}

export interface PackageDto {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  sessionCount: number;
  price: number;
  isActive: boolean;
}

export interface CreatePackageRequest {
  title: string;
  description: string;
  sessionCount: number;
  price: number;
}

export type UpdatePackageRequest = CreatePackageRequest;

export interface TrainerProfile {
  trainerId: string;
  fullName: string;
  expertiseArea: string;
  calendarSlug: string;
  bio: string;
  city: string | null;
  specialties: string[];
  yearsExperience: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  createdAtUtc: string;
}

export interface UpsertReviewRequest {
  rating: number;
  comment: string | null;
}

export interface UpcomingBirthday {
  clientId: string;
  clientName: string;
  dateOfBirth: string;
  daysUntil: number;
}

export interface UpdateSlugRequest {
  slug: string;
}

export interface AvailableSlot {
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface BusySlot {
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface TrainerLocation {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CreateLocationRequest {
  name: string;
}

export interface LocationTravelTime {
  locationAId: string;
  locationBId: string;
  minutes: number;
}

export interface SetTravelTimeRequest {
  otherLocationId: string;
  minutes: number;
}

export interface MyPackage {
  userPackageId: string;
  packageId: string;
  packageTitle: string;
  remainingSessions: number;
  totalSessions: number;
}

export type PaymentMethod = "Cash" | "BankTransfer";

export type MyPackageStatus = "Active" | "Completed" | "Pending";

export interface MyPackageDetail {
  userPackageId: string;
  packageId: string;
  packageTitle: string;
  remainingSessions: number;
  totalSessions: number;
  status: MyPackageStatus;
  purchasedAtUtc: string;
}

export interface LockResult {
  appointmentId: string;
  lockExpirationTimeUtc: string;
}

export const SlotStatusValue = { Selecting: 0, Available: 1, Booked: 2 } as const;

export interface SlotStatusChangedMessage {
  trainerId: string;
  startTimeUtc: string;
  status: 0 | 1 | 2;
}

export interface ClientAppointment {
  id: string;
  trainerId: string;
  trainerName: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
}

export interface TrainerAppointment {
  id: string;
  clientId: string;
  clientName: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  locationName: string;
}

export interface TodayAppointmentLocationCount {
  locationId: string;
  locationName: string;
  count: number;
}

export interface TrainerDashboardStats {
  todayAppointmentCount: number;
  totalClients: number;
  totalRevenue: number;
  isTodayClosed: boolean;
  todayByLocation: TodayAppointmentLocationCount[];
}

export interface TrainerClientSummary {
  clientId: string;
  clientName: string;
  remainingSessions: number;
  dateOfBirth: string | null;
  activePackageTitle: string | null;
}

export interface ClientPackageHistory {
  userPackageId: string;
  packageId: string;
  packageTitle: string;
  totalSessions: number;
  remainingSessions: number;
  isActive: boolean;
  purchasedAtUtc: string;
}

export interface ClientPaymentHistory {
  paymentId: string;
  packageTitle: string;
  amount: number;
  status: TrainerPaymentStatus;
  method: PaymentMethod | null;
  createdAtUtc: string;
}

export interface ClientHistory {
  clientName: string;
  email: string;
  phone: string | null;
  city: string | null;
  dateOfBirth: string | null;
  packages: ClientPackageHistory[];
  payments: ClientPaymentHistory[];
}

export interface MyTrainerSummary {
  trainerId: string;
  trainerName: string;
  calendarSlug: string;
}

export interface ClientGoal {
  id: string;
  label: string;
  caption: string | null;
  percentComplete: number;
  createdAtUtc: string;
}

export interface CreateClientGoalRequest {
  label: string;
  caption: string | null;
  percentComplete: number;
}

export interface ClientNote {
  id: string;
  authorName: string;
  body: string;
  tags: string[];
  createdAtUtc: string;
}

export interface CreateClientNoteRequest {
  body: string;
  tags: string[];
}

export type TrainerPaymentStatus = "Paid" | "Pending" | "Failed";

export interface TrainerPayment {
  paymentId: string;
  clientId: string;
  clientName: string;
  packageTitle: string;
  amount: number;
  status: TrainerPaymentStatus;
  method: PaymentMethod | null;
  createdAtUtc: string;
}

export interface TrainerPaymentsSummary {
  paidThisMonth: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  averageAmount: number;
  payments: TrainerPayment[];
}

export interface ReportsSummary {
  monthlyRevenue: number;
  activeClients: number;
  completedSessions: number;
  cancellationRatePercent: number;
}

export interface MonthlyPoint {
  year: number;
  month: number;
  value: number;
}

export interface WeeklySessionCount {
  dayOfWeek: number;
  count: number;
}

export interface ServiceMixEntry {
  packageTitle: string;
  count: number;
}

export interface TopPackage {
  title: string;
  revenue: number;
  sales: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface TrainerReports {
  summary: ReportsSummary;
  revenueTrend: MonthlyPoint[];
  clientGrowth: MonthlyPoint[];
  weeklySessions: WeeklySessionCount[];
  serviceMix: ServiceMixEntry[];
  topPackages: TopPackage[];
  busiestHours: HeatmapCell[];
}

export interface PackageInsight {
  packageId: string;
  salesCount: number;
  popularityPercent: number;
}

export interface BodyMetric {
  id: string;
  recordedAtUtc: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  bodyFatPercent: number | null;
}

export interface CreateBodyMetricRequest {
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  bodyFatPercent: number | null;
}

export interface AccountProfile {
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  emailConfirmed: boolean;
}

export interface UpdateAccountProfileRequest {
  phone: string | null;
  city: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
}

export interface CreateClientRequest {
  fullName: string;
  phone: string | null;
  packageId: string | null;
  sessionCount: number | null;
  isPaid: boolean;
  method: PaymentMethod | null;
}

export interface MarkPaymentPaidRequest {
  method: PaymentMethod;
}

export interface CreateClientResponse {
  clientId: string;
  inviteToken: string;
}

export interface AssignPackageRequest {
  packageId: string;
  sessionCount: number;
  isPaid: boolean;
  method: PaymentMethod | null;
}

export interface AssignPackageResponse {
  userPackageId: string;
}

export interface ResumeInviteResponse {
  isNewAccount: boolean;
  auth: unknown;
}

export interface MarkAttendanceRequest {
  attended: boolean;
}

export interface BookForClientRequest {
  userPackageId: string;
  locationId: string;
  startTimeUtc: string;
}

export interface BookForClientResponse {
  appointmentId: string;
}

