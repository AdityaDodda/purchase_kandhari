import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPurchaseRequestSchema, insertLineItemSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendPasswordResetEmail } from "./email";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed.'));
    }
  }
});

export function registerRoutes(app: Express): Server {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.session?.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { employeeNumber, password } = z.object({
        employeeNumber: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmployeeNumber(employeeNumber);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        employeeNumber: user.employeeNumber,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        location: user.location,
        role: user.role,
      };

      res.json({ user: req.session.user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmployeeNumber(userData.employeeNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Employee number already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Store user in session
      req.session.user = {
        id: newUser.id,
        employeeNumber: newUser.employeeNumber,
        fullName: newUser.fullName,
        email: newUser.email,
        department: newUser.department,
        location: newUser.location,
        role: newUser.role,
      };

      res.json({ user: req.session.user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Forgot Password
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (user) {
        const resetLink = `http://${req.headers.host}/reset-password?email=${encodeURIComponent(email)}`;
        await sendPasswordResetEmail(user.email, resetLink);
      }
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or reset link." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const safeUser = {
        id: user.id,
        employeeNumber: user.employeeNumber,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        location: user.location,
        role: user.role,
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase Request routes
  app.post("/api/purchase-requests", requireAuth, async (req: any, res) => {
    try {
      const requestData = insertPurchaseRequestSchema.parse({
        ...req.body,
        requesterId: req.session.user.id,
      });

      // Generate requisition number
      const requisitionNumber = await storage.generateRequisitionNumber(requestData.department);
      
      const newRequest = await storage.createPurchaseRequest({
        ...requestData,
        requisitionNumber,
      });

      // Create notification for requester
      await storage.createNotification({
        userId: req.session.user.id,
        purchaseRequestId: newRequest.id,
        title: "Purchase Request Submitted",
        message: `Your purchase request ${requisitionNumber} has been submitted successfully.`,
        type: "success",
      });

      res.json(newRequest);
    } catch (error) {
      console.error("Create purchase request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequestWithDetails(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Check if user has permission to view this request
      if (request.requesterId !== req.session.user.id && 
          req.session.user.role !== 'admin' && 
          req.session.user.role !== 'approver') {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(request);
    } catch (error) {
      console.error("Get purchase request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests", requireAuth, async (req: any, res) => {
    try {
      const filters = req.query;
      let requests;

      if (req.session.user.role === 'admin') {
        requests = await storage.getAllPurchaseRequests(filters);
      } else {
        requests = await storage.getPurchaseRequestsByUser(req.session.user.id, filters);
      }

      // Apply client-side filtering for "all" values
      if (requests && Array.isArray(requests)) {
        let filteredRequests = requests;

        if (filters.status && filters.status !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.status === filters.status);
        }
        
        if (filters.department && filters.department !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.department === filters.department);
        }
        
        if (filters.location && filters.location !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.location && req.location.includes(filters.location));
        }
        
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredRequests = filteredRequests.filter(req => 
            req.title?.toLowerCase().includes(searchTerm) ||
            req.requisitionNumber?.toLowerCase().includes(searchTerm) ||
            req.businessJustificationDetails?.toLowerCase().includes(searchTerm)
          );
        }

        requests = filteredRequests;
      }

      res.json(requests);
    } catch (error) {
      console.error("Get purchase requests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id/details", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequestWithDetails(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Check if user has permission to view this request
      if (request.requesterId !== req.session.user.id && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Fetch line items
      const lineItems = await storage.getLineItemsByRequest(id);
      
      res.json({
        ...request,
        lineItems
      });
    } catch (error) {
      console.error("Get purchase request details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/purchase-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Check if user has permission to update this request
      if (request.requesterId !== req.session.user.id && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedRequest = await storage.updatePurchaseRequest(id, req.body);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Update purchase request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Line Items routes
  app.post("/api/purchase-requests/:id/line-items", requireAuth, async (req: any, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const lineItemData = insertLineItemSchema.parse({
        ...req.body,
        purchaseRequestId,
      });

      const lineItem = await storage.createLineItem(lineItemData);
      
      // Update total estimated cost
      const allItems = await storage.getLineItemsByRequest(purchaseRequestId);
      const totalCost = allItems.reduce((sum, item) => sum + parseFloat(item.estimatedCost.toString()), 0);
      
      await storage.updatePurchaseRequest(purchaseRequestId, {
        totalEstimatedCost: totalCost.toString(),
      });

      res.json(lineItem);
    } catch (error) {
      console.error("Create line item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id/line-items", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const lineItems = await storage.getLineItemsByRequest(purchaseRequestId);
      res.json(lineItems);
    } catch (error) {
      console.error("Get line items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attachments routes
  app.post("/api/purchase-requests/:id/attachments", requireAuth, upload.array('files', 10), async (req: any, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const attachments = [];
      for (const file of files) {
        const attachment = await storage.createAttachment({
          purchaseRequestId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          filePath: file.path,
        });
        attachments.push(attachment);
      }

      res.json(attachments);
    } catch (error) {
      console.error("Upload attachments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id/attachments", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const attachments = await storage.getAttachmentsByRequest(purchaseRequestId);
      res.json(attachments);
    } catch (error) {
      console.error("Get attachments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Approval routes
  app.post("/api/purchase-requests/:id/approve", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Create approval history
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        action: 'approve',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Update request status
      await storage.updatePurchaseRequest(id, {
        status: 'approved',
        currentApprovalLevel: request.currentApprovalLevel + 1,
      });

      // Create notification
      await storage.createNotification({
        userId: request.requesterId,
        purchaseRequestId: id,
        title: "Purchase Request Approved",
        message: `Your purchase request ${request.requisitionNumber} has been approved.`,
        type: "success",
      });

      res.json({ message: "Request approved successfully" });
    } catch (error) {
      console.error("Approve request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-requests/:id/reject", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Create approval history
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        action: 'reject',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Update request status
      await storage.updatePurchaseRequest(id, {
        status: 'rejected',
      });

      // Create notification
      await storage.createNotification({
        userId: request.requesterId,
        purchaseRequestId: id,
        title: "Purchase Request Rejected",
        message: `Your purchase request ${request.requisitionNumber} has been rejected. ${comments}`,
        type: "error",
      });

      res.json({ message: "Request rejected successfully" });
    } catch (error) {
      console.error("Reject request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Return request route
  app.post("/api/purchase-requests/:id/return", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Create approval history
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        action: 'return',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Update request status - return to submitted so user can edit and resubmit
      await storage.updatePurchaseRequest(id, {
        status: 'returned',
        currentApprovalLevel: 1, // Reset to first level
      });

      // Create notification
      await storage.createNotification({
        userId: request.requesterId,
        purchaseRequestId: id,
        title: "Purchase Request Returned",
        message: `Your purchase request ${request.requisitionNumber} has been returned for revision. Please review the comments and resubmit.`,
        type: "warning",
      });

      res.json({ message: "Request returned successfully" });
    } catch (error) {
      console.error("Return request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics routes
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let stats;
      if (user.role === "admin") {
        // Admin sees all requests
        stats = await storage.getPurchaseRequestStats();
      } else {
        // Regular users see only their own requests
        stats = await storage.getPurchaseRequestStatsByUser(req.session.user.id);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reports API - Get purchase requests for reports with advanced filtering
  app.get('/api/reports/purchase-requests', requireAuth, async (req: any, res) => {
    try {
      const filters = {
        ...req.query,
        includeRequester: true,
        includeLineItems: false
      };
      
      const requests = await storage.getAllPurchaseRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      res.status(500).json({ message: 'Failed to fetch reports data' });
    }
  });

  // Admin Masters API - Get all users for admin masters
  app.get('/api/admin/users', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Admin Masters API - Generic endpoint for master data
  app.get('/api/admin/masters/:type', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type } = req.params;
      let data = [];

      switch (type) {
        case 'users':
          data = await storage.getAllUsers();
          break;
        case 'entities':
          data = await storage.getAllEntities();
          break;
        case 'departments':
          data = await storage.getAllDepartments();
          break;
        case 'locations':
          data = await storage.getAllLocations();
          break;
        case 'roles':
          data = await storage.getAllRoles();
          break;
        case 'approval-matrix':
          data = await storage.getAllApprovalMatrix();
          break;
        case 'escalation-matrix':
          data = await storage.getAllEscalationMatrix();
          break;
        case 'inventory':
          data = await storage.getAllInventory();
          break;
        case 'vendors':
          data = await storage.getAllVendors();
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${req.params.type} master data:`, error);
      res.status(500).json({ message: `Failed to fetch ${req.params.type} data` });
    }
  });

  // Admin Masters API - Create master data
  app.post('/api/admin/masters/:type', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type } = req.params;
      let result;

      switch (type) {
        case 'users':
          result = await storage.createUser(req.body);
          break;
        case 'entities':
          result = await storage.createEntity(req.body);
          break;
        case 'departments':
          result = await storage.createDepartment(req.body);
          break;
        case 'locations':
          result = await storage.createLocation(req.body);
          break;
        case 'roles':
          result = await storage.createRole(req.body);
          break;
        case 'approval-matrix':
          result = await storage.createApprovalMatrix(req.body);
          break;
        case 'escalation-matrix':
          result = await storage.createEscalationMatrix(req.body);
          break;
        case 'inventory':
          result = await storage.createInventory(req.body);
          break;
        case 'vendors':
          result = await storage.createVendor(req.body);
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error(`Error creating ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to create ${req.params.type}` });
    }
  });

  // Admin Masters API - Update master data
  app.put('/api/admin/masters/:type/:id', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type, id } = req.params;
      let result;

      switch (type) {
        case 'users':
          result = await storage.updateUser(parseInt(id), req.body);
          break;
        case 'entities':
          result = await storage.updateEntity(parseInt(id), req.body);
          break;
        case 'departments':
          result = await storage.updateDepartment(parseInt(id), req.body);
          break;
        case 'locations':
          result = await storage.updateLocation(parseInt(id), req.body);
          break;
        case 'roles':
          result = await storage.updateRole(parseInt(id), req.body);
          break;
        case 'approval-matrix':
          result = await storage.updateApprovalMatrix(parseInt(id), req.body);
          break;
        case 'escalation-matrix':
          result = await storage.updateEscalationMatrix(parseInt(id), req.body);
          break;
        case 'inventory':
          result = await storage.updateInventory(parseInt(id), req.body);
          break;
        case 'vendors':
          result = await storage.updateVendor(parseInt(id), req.body);
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json(result);
    } catch (error) {
      console.error(`Error updating ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to update ${req.params.type}` });
    }
  });

  // Admin Masters API - Delete master data
  app.delete('/api/admin/masters/:type/:id', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type, id } = req.params;

      switch (type) {
        case 'users':
          await storage.deleteUser(parseInt(id));
          break;
        case 'entities':
          await storage.deleteEntity(parseInt(id));
          break;
        case 'departments':
          await storage.deleteDepartment(parseInt(id));
          break;
        case 'locations':
          await storage.deleteLocation(parseInt(id));
          break;
        case 'roles':
          await storage.deleteRole(parseInt(id));
          break;
        case 'approval-matrix':
          await storage.deleteApprovalMatrix(parseInt(id));
          break;
        case 'escalation-matrix':
          await storage.deleteEscalationMatrix(parseInt(id));
          break;
        case 'inventory':
          await storage.deleteInventory(parseInt(id));
          break;
        case 'vendors':
          await storage.deleteVendor(parseInt(id));
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error(`Error deleting ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to delete ${req.params.type}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
