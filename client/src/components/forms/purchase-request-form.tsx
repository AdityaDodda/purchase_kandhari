import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Minus, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DEPARTMENTS, LOCATIONS, BUSINESS_JUSTIFICATION_CODES, UNITS_OF_MEASURE } from "@/lib/constants";
import { LineItemsGrid } from "@/components/ui/line-items-grid";
import { FileUpload } from "@/components/ui/file-upload";
import type { LineItemFormData } from "@/lib/types";

const requestDetailsSchema = z.object({
  title: z.string().min(1, "Request title is required"),
  requestDate: z.string().min(1, "Request date is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  businessJustificationCode: z.string().min(1, "Business justification code is required"),
  businessJustificationDetails: z.string().min(50, "Business justification must be at least 50 characters"),
});

type RequestDetailsFormData = z.infer<typeof requestDetailsSchema>;

interface PurchaseRequestFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
}

export function PurchaseRequestForm({ currentStep, onStepChange, onSubmit }: PurchaseRequestFormProps) {
  const [lineItems, setLineItems] = useState<LineItemFormData[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RequestDetailsFormData>({
    resolver: zodResolver(requestDetailsSchema),
    defaultValues: {
      requestDate: new Date().toISOString().split('T')[0],
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/purchase-requests", data);
      return response.json();
    },
    onSuccess: async (request) => {
      // Upload line items
      for (const item of lineItems) {
        await apiRequest("POST", `/api/purchase-requests/${request.id}/line-items`, item);
      }

      // Upload attachments
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((file) => formData.append('files', file));
        await fetch(`/api/purchase-requests/${request.id}/attachments`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/purchase-requests"] });
      toast({ title: "Success!", description: "Purchase request submitted successfully." });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNextStep = () => {
    if (currentStep < 4) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleAddLineItem = (item: LineItemFormData) => {
    setLineItems([...lineItems, item]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that all information is accurate.",
        variant: "destructive",
      });
      return;
    }

    const formData = getValues();
    const totalCost = lineItems.reduce((sum, item) => sum + item.estimatedCost, 0);

    createRequestMutation.mutate({
      ...formData,
      requestDate: new Date(formData.requestDate),
      totalEstimatedCost: totalCost.toString(),
    });
  };

  const onRequestDetailsSubmit = (data: RequestDetailsFormData) => {
    handleNextStep();
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Request Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onRequestDetailsSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter request title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="requestDate">Request Date</Label>
                  <Input
                    id="requestDate"
                    type="date"
                    {...register("requestDate")}
                  />
                  {errors.requestDate && (
                    <p className="text-sm text-destructive mt-1">{errors.requestDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => setValue("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-destructive mt-1">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select onValueChange={(value) => setValue("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="businessJustificationCode">Business Justification Code *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the appropriate business justification for this purchase</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select onValueChange={(value) => setValue("businessJustificationCode", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Justification" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_JUSTIFICATION_CODES.map((code) => (
                        <SelectItem key={code.value} value={code.value}>
                          {code.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessJustificationCode && (
                    <p className="text-sm text-destructive mt-1">{errors.businessJustificationCode.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="businessJustificationDetails">Business Justification Details *</Label>
                  <Textarea
                    id="businessJustificationDetails"
                    {...register("businessJustificationDetails")}
                    rows={4}
                    placeholder="Provide detailed business justification..."
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 50 characters required</p>
                  {errors.businessJustificationDetails && (
                    <p className="text-sm text-destructive mt-1">{errors.businessJustificationDetails.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(211,100%,29%)]"
                >
                  Next Step
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Line Items */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6">
            <LineItemsGrid 
              items={lineItems} 
              onItemsChange={setLineItems}
              editable={true}
            />

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Previous
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(211,100%,29%)]"
                disabled={lineItems.length === 0}
              >
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Attachments */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              files={attachments}
              onFilesChange={setAttachments}
              maxFiles={10}
              maxFileSize={10 * 1024 * 1024} // 10MB
              acceptedFileTypes={[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
                'image/gif'
              ]}
            />

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Previous
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(211,100%,29%)]"
              >
                Review & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Request Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Title:</span>
                    <span className="font-medium ml-2">{getValues("title")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Request Date:</span>
                    <span className="font-medium ml-2">
                      {new Date(getValues("requestDate")).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium ml-2">{getValues("department")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium ml-2">{getValues("location")}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Items Summary</h3>
                <div className="text-sm">
                  <div className="grid grid-cols-4 gap-4 font-medium text-gray-700 mb-2">
                    <span>Item</span>
                    <span>Quantity</span>
                    <span>Unit Cost</span>
                    <span>Total</span>
                  </div>
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 text-gray-900 py-1">
                      <span>{item.itemName}</span>
                      <span>{item.requiredQuantity} {item.unitOfMeasure}</span>
                      <span>₹{item.estimatedCost.toLocaleString()}</span>
                      <span>₹{(item.requiredQuantity * item.estimatedCost).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 mt-3 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total Estimated Cost:</span>
                      <span>₹{lineItems.reduce((sum, item) => sum + (item.requiredQuantity * item.estimatedCost), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments Summary */}
              {attachments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Attachments ({attachments.length})</h3>
                  <div className="space-y-1 text-sm">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{file.name}</span>
                        <span className="text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation */}
              <div className="bg-[hsl(207,75%,95%)] rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="confirmation"
                    checked={confirmed}
                    onCheckedChange={setConfirmed}
                  />
                  <Label htmlFor="confirmation" className="text-sm text-gray-700">
                    I confirm that all information provided is accurate and complete. I understand that this request will be routed for approval based on company policies.
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Previous
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={!confirmed || createRequestMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
