import { pgTable, text, varchar, serial, integer, timestamp, decimal, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeNumber: varchar("employee_number", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("requester"), // requester, approver, admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Requests table
export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  requestDate: timestamp("request_date").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  businessJustificationCode: varchar("business_justification_code", { length: 50 }).notNull(),
  businessJustificationDetails: text("business_justification_details").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"), // submitted, pending, approved, rejected, returned, cancelled
  currentApprovalLevel: integer("current_approval_level").notNull().default(1),
  totalEstimatedCost: decimal("total_estimated_cost", { precision: 15, scale: 2 }).notNull().default("0"),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  currentApproverId: integer("current_approver_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Line Items table
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  requiredQuantity: integer("required_quantity").notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  requiredByDate: timestamp("required_by_date").notNull(),
  deliveryLocation: varchar("delivery_location", { length: 255 }).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }).notNull(),
  itemJustification: text("item_justification"),
  stockAvailable: integer("stock_available").default(0),
  stockLocation: varchar("stock_location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attachments table
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Approval History table
export const approvalHistory = pgTable("approval_history", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  approverId: integer("approver_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // approve, reject, return, cancel
  comments: text("comments"),
  approvalLevel: integer("approval_level").notNull(),
  actionDate: timestamp("action_date").defaultNow(),
});

// Approval Workflow table
export const approvalWorkflow = pgTable("approval_workflow", {
  id: serial("id").primaryKey(),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  approvalLevel: integer("approval_level").notNull(),
  approverId: integer("approver_id").notNull().references(() => users.id),
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }).default("0"),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }),
  escalationDays: integer("escalation_days").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  purchaseRequestId: integer("purchase_request_id").references(() => purchaseRequests.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // info, warning, success, error
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  purchaseRequests: many(purchaseRequests),
  approvalHistory: many(approvalHistory),
  approvalWorkflow: many(approvalWorkflow),
  notifications: many(notifications),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [purchaseRequests.requesterId],
    references: [users.id],
  }),
  currentApprover: one(users, {
    fields: [purchaseRequests.currentApproverId],
    references: [users.id],
  }),
  lineItems: many(lineItems),
  attachments: many(attachments),
  approvalHistory: many(approvalHistory),
  notifications: many(notifications),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [lineItems.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [attachments.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

export const approvalHistoryRelations = relations(approvalHistory, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [approvalHistory.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
  approver: one(users, {
    fields: [approvalHistory.approverId],
    references: [users.id],
  }),
}));

export const approvalWorkflowRelations = relations(approvalWorkflow, ({ one }) => ({
  approver: one(users, {
    fields: [approvalWorkflow.approverId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  purchaseRequest: one(purchaseRequests, {
    fields: [notifications.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertApprovalHistorySchema = createInsertSchema(approvalHistory).omit({
  id: true,
  actionDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type ApprovalHistory = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistory = z.infer<typeof insertApprovalHistorySchema>;
export type ApprovalWorkflow = typeof approvalWorkflow.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
