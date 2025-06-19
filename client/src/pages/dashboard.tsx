import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, CheckCircle, XCircle, Plus, List, ClipboardCheck, Package, Calendar, MapPin, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentRequests } = useQuery({
    queryKey: ["/api/purchase-requests", { limit: 5 }],
  });

  const { data: requestDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/purchase-requests", selectedRequest?.id, "details"],
    enabled: !!selectedRequest?.id,
  });

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Request Dashboard</h1>
          <p className="text-gray-600">Manage and track your purchase requests efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-[hsl(207,90%,54%)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-[hsl(207,90%,54%)]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalRequests ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[hsl(32,100%,50%)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-[hsl(32,100%,50%)]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingRequests ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.approvedRequests ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.rejectedRequests ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 border-2 border-dashed border-[hsl(207,90%,54%)] text-[hsl(207,90%,54%)] hover:bg-[hsl(207,75%,95%)]"
                onClick={() => setLocation("/new-request")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Request
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-dashed border-[hsl(32,100%,50%)] text-[hsl(32,100%,50%)] hover:bg-amber-50"
                onClick={() => setLocation("/my-requests")}
              >
                <List className="h-5 w-5 mr-2" />
                View My Requests
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-dashed border-green-500 text-green-500 hover:bg-green-50"
                onClick={() => setLocation("/admin")}
              >
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Pending Approvals
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(recentRequests) && recentRequests.length > 0 ? (
                    recentRequests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.requisitionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.requestDate).toLocaleDateString()}
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
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No recent requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

                {/* Line Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Line Items ({requestDetails?.lineItems?.length || 0})
                  </h3>
                  
                  <div className="space-y-3">
                    {requestDetails?.lineItems && requestDetails.lineItems.length > 0 ? (
                      requestDetails.lineItems.map((item: any, index: number) => (
                        <Card key={item.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {index + 1}. {item.itemName}
                                </h4>
                                {item.itemJustification && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {item.itemJustification}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <span>Quantity: <strong>{item.requiredQuantity} {item.unitOfMeasure}</strong></span>
                                  <span>Required by: <strong>{new Date(item.requiredByDate).toLocaleDateString()}</strong></span>
                                  <span>Delivery: <strong>{item.deliveryLocation}</strong></span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  ₹{parseFloat(item.estimatedCost || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ₹{(parseFloat(item.estimatedCost || 0) / item.requiredQuantity).toFixed(2)} per {item.unitOfMeasure}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No line items found for this request</p>
                      </div>
                    )}
                  </div>
                </div>

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
