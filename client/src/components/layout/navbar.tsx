import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Bell, User, ChevronDown, LogOut, Home, FileText, List, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear all queries and cache
      queryClient.clear();
      // Reset the user query to undefined to trigger auth check
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({ title: "Logged out", description: "You have been logged out successfully." });
      // Redirect to root - AuthWrapper will show login page for unauthenticated users
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead) : [];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-[hsl(207,90%,54%)] shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Building className="h-8 w-8 text-white mr-3" />
              <span className="text-white font-bold text-xl">Kandhari Global Beverages</span>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Button
                variant="ghost"
                className="text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent px-3 py-2 text-sm font-medium"
                onClick={() => handleNavigation("/")}
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent px-3 py-2 text-sm font-medium"
                onClick={() => handleNavigation("/new-request")}
              >
                <FileText className="h-4 w-4 mr-1" />
                New Request
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent px-3 py-2 text-sm font-medium"
                onClick={() => handleNavigation("/my-requests")}
              >
                <List className="h-4 w-4 mr-1" />
                My Requests
              </Button>
              {user && user.role === "admin" && (
                <Button
                  variant="ghost"
                  className="text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent px-3 py-2 text-sm font-medium"
                  onClick={() => handleNavigation("/admin")}
                >
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" className="text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent p-2">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-white hover:text-[hsl(32,100%,50%)] hover:bg-transparent">
                  <div className="w-8 h-8 bg-[hsl(32,100%,50%)] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="hidden md:inline">{user?.fullName ?? 'User'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user?.fullName ?? 'User'}</div>
                  <div className="text-gray-500">{user?.email ?? 'No email'}</div>
                  <div className="text-gray-500 text-xs">{user?.employeeNumber ?? 'N/A'}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
