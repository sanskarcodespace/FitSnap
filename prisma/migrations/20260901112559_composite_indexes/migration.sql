-- CreateEnum
CREATE TYPE "AISender" AS ENUM ('CLIENT', 'ASSISTANT');

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "context" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "bio" TEXT,
    "specialties" TEXT[],
    "credentials" TEXT,
    "profilePhoto" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" TIMESTAMP(3),
    "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "currentWeight" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "preferredWeightUnit" TEXT NOT NULL DEFAULT 'kg',
    "preferredMeasurementUnit" TEXT NOT NULL DEFAULT 'cm',
    "height" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "profilePhoto" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "habitReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "habitReminderHour" INTEGER,
    "lastHabitReminderSentDate" TEXT,
    "monthlyReportNotificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastMonthlyReportNotifiedMonth" TEXT,
    "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachClientConnection" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT,
    "invitedEmail" TEXT NOT NULL,
    "invitedName" TEXT,
    "personalMessage" TEXT,
    "invitationToken" TEXT NOT NULL,
    "invitationTokenExpiry" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachClientConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL,
    "coachClientConnectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlanMealGuidance" (
    "id" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "customLabel" TEXT,
    "guidanceText" TEXT NOT NULL,

    CONSTRAINT "DietPlanMealGuidance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlanGuideline" (
    "id" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietPlanGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL,
    "proteinTargetGrams" INTEGER NOT NULL,
    "carbTargetGrams" INTEGER NOT NULL,
    "fatTargetGrams" INTEGER NOT NULL,
    "waterTargetLiters" DOUBLE PRECISION NOT NULL,
    "fiberTargetGrams" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "photoReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "mealLogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portionDescription" TEXT,
    "originType" TEXT NOT NULL DEFAULT 'manual',
    "calories" INTEGER NOT NULL,
    "proteinGrams" INTEGER NOT NULL DEFAULT 0,
    "carbGrams" INTEGER NOT NULL DEFAULT 0,
    "fatGrams" INTEGER NOT NULL DEFAULT 0,
    "fiberGrams" INTEGER NOT NULL DEFAULT 0,
    "sugarGrams" INTEGER,
    "sodiumMg" INTEGER,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLogEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "coachClientConnectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlanSession" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "WorkoutPlanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlanExercise" (
    "id" TEXT NOT NULL,
    "workoutPlanSessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setsRepsDescription" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "WorkoutPlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlanGuideline" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutPlanGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'custom',
    "linkedWorkoutPlanSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YogaPlan" (
    "id" TEXT NOT NULL,
    "coachClientConnectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "YogaPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YogaPlanSequence" (
    "id" TEXT NOT NULL,
    "yogaPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "style" TEXT,
    "durationGuidance" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "YogaPlanSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YogaPlanPose" (
    "id" TEXT NOT NULL,
    "yogaPlanSequenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holdOrRepGuidance" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "YogaPlanPose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YogaPlanGuideline" (
    "id" TEXT NOT NULL,
    "yogaPlanId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YogaPlanGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YogaLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'custom',
    "linkedYogaPlanSequenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YogaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightValue" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurementEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "waistValue" DOUBLE PRECISION,
    "chestValue" DOUBLE PRECISION,
    "hipsValue" DOUBLE PRECISION,
    "armsValue" DOUBLE PRECISION,
    "thighsValue" DOUBLE PRECISION,
    "measurementUnit" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurementEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhotoEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "photoReference" TEXT NOT NULL,
    "angle" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressPhotoEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitPlan" (
    "id" TEXT NOT NULL,
    "coachClientConnectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "HabitPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitPlanItem" (
    "id" TEXT NOT NULL,
    "habitPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetFrequency" TEXT NOT NULL,
    "targetTimesPerWeek" INTEGER,
    "sortOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "HabitPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitPlanGuideline" (
    "id" TEXT NOT NULL,
    "habitPlanId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitPlanGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitCompletion" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "habitPlanItemId" TEXT NOT NULL,
    "habitNameSnapshot" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "steps" INTEGER,
    "mood" INTEGER,
    "energy" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "coachClientConnectionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "aiConversationId" TEXT NOT NULL,
    "sender" "AISender" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "eventType" TEXT NOT NULL,
    "targetUserId" TEXT,
    "metadata" TEXT,
    "ipAddressPartial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddressPartial" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachClientConnection_invitationToken_key" ON "CoachClientConnection"("invitationToken");

-- CreateIndex
CREATE INDEX "CoachClientConnection_coachId_status_idx" ON "CoachClientConnection"("coachId", "status");

-- CreateIndex
CREATE INDEX "CoachClientConnection_clientId_status_idx" ON "CoachClientConnection"("clientId", "status");

-- CreateIndex
CREATE INDEX "CoachClientConnection_invitedEmail_idx" ON "CoachClientConnection"("invitedEmail");

-- CreateIndex
CREATE INDEX "DietPlan_coachClientConnectionId_status_idx" ON "DietPlan"("coachClientConnectionId", "status");

-- CreateIndex
CREATE INDEX "DietPlanMealGuidance_dietPlanId_idx" ON "DietPlanMealGuidance"("dietPlanId");

-- CreateIndex
CREATE INDEX "DietPlanGuideline_dietPlanId_idx" ON "DietPlanGuideline"("dietPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTarget_connectionId_key" ON "NutritionTarget"("connectionId");

-- CreateIndex
CREATE INDEX "MealLog_clientId_date_idx" ON "MealLog"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "FoodItem_mealLogId_idx" ON "FoodItem"("mealLogId");

-- CreateIndex
CREATE INDEX "WaterLogEntry_clientId_date_idx" ON "WaterLogEntry"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "WorkoutPlan_coachClientConnectionId_status_idx" ON "WorkoutPlan"("coachClientConnectionId", "status");

-- CreateIndex
CREATE INDEX "WorkoutPlanSession_workoutPlanId_idx" ON "WorkoutPlanSession"("workoutPlanId");

-- CreateIndex
CREATE INDEX "WorkoutPlanExercise_workoutPlanSessionId_idx" ON "WorkoutPlanExercise"("workoutPlanSessionId");

-- CreateIndex
CREATE INDEX "WorkoutPlanGuideline_workoutPlanId_idx" ON "WorkoutPlanGuideline"("workoutPlanId");

-- CreateIndex
CREATE INDEX "WorkoutLog_clientId_date_idx" ON "WorkoutLog"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "YogaPlan_coachClientConnectionId_status_idx" ON "YogaPlan"("coachClientConnectionId", "status");

-- CreateIndex
CREATE INDEX "YogaPlanSequence_yogaPlanId_idx" ON "YogaPlanSequence"("yogaPlanId");

-- CreateIndex
CREATE INDEX "YogaPlanPose_yogaPlanSequenceId_idx" ON "YogaPlanPose"("yogaPlanSequenceId");

-- CreateIndex
CREATE INDEX "YogaPlanGuideline_yogaPlanId_idx" ON "YogaPlanGuideline"("yogaPlanId");

-- CreateIndex
CREATE INDEX "YogaLog_clientId_date_idx" ON "YogaLog"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "WeightEntry_clientId_date_idx" ON "WeightEntry"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "BodyMeasurementEntry_clientId_date_idx" ON "BodyMeasurementEntry"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "ProgressPhotoEntry_clientId_date_idx" ON "ProgressPhotoEntry"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "HabitPlan_coachClientConnectionId_status_idx" ON "HabitPlan"("coachClientConnectionId", "status");

-- CreateIndex
CREATE INDEX "HabitPlanItem_habitPlanId_idx" ON "HabitPlanItem"("habitPlanId");

-- CreateIndex
CREATE INDEX "HabitPlanGuideline_habitPlanId_idx" ON "HabitPlanGuideline"("habitPlanId");

-- CreateIndex
CREATE INDEX "HabitCompletion_clientId_date_idx" ON "HabitCompletion"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "HabitCompletion_habitPlanItemId_date_idx" ON "HabitCompletion"("habitPlanItemId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_clientId_date_key" ON "DailyCheckIn"("clientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_coachClientConnectionId_key" ON "Conversation"("coachClientConnectionId");

-- CreateIndex
CREATE INDEX "Conversation_coachClientConnectionId_idx" ON "Conversation"("coachClientConnectionId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Notification_clientId_idx" ON "Notification"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AIConversation_clientId_key" ON "AIConversation"("clientId");

-- CreateIndex
CREATE INDEX "AIMessage_aiConversationId_idx" ON "AIMessage"("aiConversationId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_actorUserId_idx" ON "AuditLogEntry"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_targetUserId_idx" ON "AuditLogEntry"("targetUserId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_eventType_idx" ON "AuditLogEntry"("eventType");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClientConnection" ADD CONSTRAINT "CoachClientConnection_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClientConnection" ADD CONSTRAINT "CoachClientConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_coachClientConnectionId_fkey" FOREIGN KEY ("coachClientConnectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlanMealGuidance" ADD CONSTRAINT "DietPlanMealGuidance_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlanGuideline" ADD CONSTRAINT "DietPlanGuideline_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "MealLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLogEntry" ADD CONSTRAINT "WaterLogEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_coachClientConnectionId_fkey" FOREIGN KEY ("coachClientConnectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanSession" ADD CONSTRAINT "WorkoutPlanSession_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanExercise" ADD CONSTRAINT "WorkoutPlanExercise_workoutPlanSessionId_fkey" FOREIGN KEY ("workoutPlanSessionId") REFERENCES "WorkoutPlanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanGuideline" ADD CONSTRAINT "WorkoutPlanGuideline_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YogaPlan" ADD CONSTRAINT "YogaPlan_coachClientConnectionId_fkey" FOREIGN KEY ("coachClientConnectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YogaPlanSequence" ADD CONSTRAINT "YogaPlanSequence_yogaPlanId_fkey" FOREIGN KEY ("yogaPlanId") REFERENCES "YogaPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YogaPlanPose" ADD CONSTRAINT "YogaPlanPose_yogaPlanSequenceId_fkey" FOREIGN KEY ("yogaPlanSequenceId") REFERENCES "YogaPlanSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YogaPlanGuideline" ADD CONSTRAINT "YogaPlanGuideline_yogaPlanId_fkey" FOREIGN KEY ("yogaPlanId") REFERENCES "YogaPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YogaLog" ADD CONSTRAINT "YogaLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurementEntry" ADD CONSTRAINT "BodyMeasurementEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhotoEntry" ADD CONSTRAINT "ProgressPhotoEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitPlan" ADD CONSTRAINT "HabitPlan_coachClientConnectionId_fkey" FOREIGN KEY ("coachClientConnectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitPlanItem" ADD CONSTRAINT "HabitPlanItem_habitPlanId_fkey" FOREIGN KEY ("habitPlanId") REFERENCES "HabitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitPlanGuideline" ADD CONSTRAINT "HabitPlanGuideline_habitPlanId_fkey" FOREIGN KEY ("habitPlanId") REFERENCES "HabitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitPlanItemId_fkey" FOREIGN KEY ("habitPlanItemId") REFERENCES "HabitPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_coachClientConnectionId_fkey" FOREIGN KEY ("coachClientConnectionId") REFERENCES "CoachClientConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_aiConversationId_fkey" FOREIGN KEY ("aiConversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
