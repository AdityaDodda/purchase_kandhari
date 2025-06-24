import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { PurchaseRequestForm } from "@/components/forms/purchase-request-form";

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: "Request Details", completed: false },
    { number: 2, title: "Line Items", completed: false },
    { number: 3, title: "Attachments", completed: false },
    { number: 4, title: "Review", completed: false },
  ];

  const handleRequestSubmit = () => {
    // Reset to step 1 and stay on new request page
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">New Purchase Request</CardTitle>
            <ProgressStepper steps={steps} currentStep={currentStep} />
          </CardHeader>
        </Card>

        {/* Form */}
        <PurchaseRequestForm
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onSubmit={handleRequestSubmit}
        />
      </div>
    </div>
  );
}
