import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Filter, TrendingUp, Clock, DollarSign, BarChart3, Package, Calendar, MapPin, Database } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { LineItemsGrid } from "@/components/ui/line-items-grid";
import { CommentsAuditLog } from "@/components/ui/comments-audit-log";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    location: "all",
    search: "",
  });
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/purchase-requests", filters],
  });

  const { data: requestDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/purchase-requests/${selectedRequest?.id}/details`],
    enabled: !!selectedRequest,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleSelectRequest = (requestId: number) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    if (Array.isArray(requests) && selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(Array.isArray(requests) ? requests.map((r: any) => r.id) : []);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage all purchase requests across the organization</p>
        </div>

        {/* Admin Masters Quick Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Master Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-16 border-2 border-dashed border-[hsl(207,90%,54%)] text-[hsl(207,90%,54%)] hover:bg-[hsl(207,75%,95%)]"
                onClick={() => setLocation("/admin-masters")}
              >
                <Database className="h-5 w-5 mr-2" />
                Masters
              </Button>
              <Button
                variant="outline"
                className="h-16 border-2 border-dashed border-green-500 text-green-500 hover:bg-green-50"
              >
                Users
              </Button>
              <Button
                variant="outline"
                className="h-16 border-2 border-dashed border-purple-500 text-purple-500 hover:bg-purple-50"
              >
                Workflows
              </Button>
              <Button
                variant="outline"
                className="h-16 border-2 border-dashed border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalRequests ?? 0}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    12% vs last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-[hsl(207,75%,95%)] rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[hsl(207,90%,54%)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.pendingRequests ?? 0}</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    5 overdue
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900">₹{(stats?.totalValue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    This month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
                  <p className="text-3xl font-bold text-gray-900">4.2</p>
                  <p className="text-xs text-gray-600 mt-1">days</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Input
                    placeholder="Search requests..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(211,100%,29%)]">
                  Filter
                </Button>
                <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Checkbox
                        checked={Array.isArray(requests) && selectedRequests.length === requests.length && requests.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(requests) && requests.length > 0 ? (
                    requests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedRequests.includes(request.id)}
                            onCheckedChange={() => handleSelectRequest(request.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.title}</div>
                            <div className="text-sm text-gray-500">{request.requisitionNumber}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(request.requestDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[hsl(207,90%,54%)] rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-xs font-semibold">
                                {request.requester?.fullName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.requester?.fullName || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.requester?.employeeNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.department}</div>
                          <div className="text-sm text-gray-500">{request.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(request.totalEstimatedCost || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[hsl(207,90%,54%)]"
                              onClick={() => handleViewDetails(request)}
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="sm" className="text-green-600">
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No purchase requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bulk Actions */}
            {selectedRequests.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">{selectedRequests.length} items selected</span>
                    <Button variant="ghost" size="sm" className="text-green-600">
                      Bulk Approve
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Bulk Reject
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[hsl(207,90%,54%)]">
                      Export Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed View Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {selectedRequest?.title}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRequest?.requisitionNumber}
                  </p>
                </div>
                <StatusBadge status={selectedRequest?.status} />
              </div>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse space-y-4 w-full">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Request Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Request Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500">Submitted:</span>
                        <span className="ml-2 font-medium">
                          {selectedRequest && new Date(selectedRequest.requestDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 font-medium">{selectedRequest?.department}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 font-medium">{selectedRequest?.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500">Total Cost:</span>
                        <span className="ml-2 font-medium text-green-600">
                          ₹{selectedRequest && parseFloat(selectedRequest.totalEstimatedCost || 0).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Business Justification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline">{selectedRequest?.businessJustificationCode}</Badge>
                        <p className="text-sm text-gray-700">
                          {selectedRequest?.businessJustificationDetails}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Line Items Grid */}
                <LineItemsGrid 
                  items={requestDetails?.lineItems || []} 
                  onItemsChange={() => {}} 
                  editable={false}
                />

                <Separator />

                {/* Comments and Audit Log */}
                <CommentsAuditLog 
                  purchaseRequestId={selectedRequest?.id} 
                  canComment={true}
                />

                {/* Progress Information */}
                {selectedRequest && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Approval Progress</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Level {selectedRequest.currentApprovalLevel} of 4
                        </span>
                        <span className="text-sm text-gray-500">
                          {((selectedRequest.currentApprovalLevel / 4) * 100).toFixed(0)}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(selectedRequest.currentApprovalLevel / 4) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedRequest.status === "approved" 
                          ? "Request approved - Procurement in progress" 
                          : selectedRequest.status === "rejected"
                          ? "Request has been rejected"
                          : selectedRequest.status === "pending"
                          ? "Awaiting approval from next level"
                          : "Under review"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
