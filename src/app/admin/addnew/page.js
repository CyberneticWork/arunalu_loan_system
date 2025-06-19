"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  User,
  BadgeCheck,
  X,
  Mail,
  Phone,
  Building2,
  Lock,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import rollData from "@/lib/jsons/roll.json";

export default function AddEmployee() {
  const [formData, setFormData] = useState({
    username: "",
    empid: "",
    name: "",
    email: "",
    roll: "",
    password: "",
    tellno: "",
    branchID: "",
    addby: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : ""
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [empidAvailable, setEmpidAvailable] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [empidChecking, setEmpidChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const json = await response.json();
      if (json.code === "SUCCESS") {
        setBranches(json.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const checkAvailability = async (type, value) => {
    try {
      const response = await fetch('/api/employees/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: type,
          value: value
        })
      });
      const json = await response.json();

      if (json.code === "SUCCESS") {
        return json.available;
      } else {
        throw new Error(json.message);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
    }
  };

  const handleUsernameChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, username: value }));

    if (value.trim()) {
      setUsernameChecking(true);
      const isAvailable = await checkAvailability('username', value);
      setUsernameAvailable(isAvailable);
      setUsernameChecking(false);
    } else {
      setUsernameAvailable(true);
      setUsernameChecking(false);
    }
  };

  const handleEmpidChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, empid: value }));

    if (value.trim()) {
      setEmpidChecking(true);
      const isAvailable = await checkAvailability('empid', value);
      setEmpidAvailable(isAvailable);
      setEmpidChecking(false);
    } else {
      setEmpidAvailable(true);
      setEmpidChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate form data
      if (!formData.username.trim()) {
        throw new Error("Username is required");
      }
      if (!formData.empid.trim()) {
        throw new Error("Employee ID is required");
      }
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.roll) {
        throw new Error("Role is required");
      }
      if (!formData.password.trim()) {
        throw new Error("Password is required");
      }
      if (!formData.tellno.trim()) {
        throw new Error("Phone number is required");
      }
      if (!formData.branchID) {
        throw new Error("Branch is required");
      }
      if (!formData.addby) {
        throw new Error("Added by is required");
      }

      // Validate phone number format
      if (!formData.tellno.match(/^[0-9]{10}$/)) {
        throw new Error("Invalid phone number. Must be 10 digits");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Check if username and empid are still available
      if (await checkAvailability('username', formData.username) === false) {
        throw new Error("Username is already taken");
      }
      if (await checkAvailability('empid', formData.empid) === false) {
        throw new Error("Employee ID is already taken");
      }

      // Submit the form
      const response = await fetch('/api/employees/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const json = await response.json();

      if (json.code === "SUCCESS") {
        setSuccess(true);
        // Reset form
        setFormData({
          username: "",
          empid: "",
          name: "",
          email: "",
          roll: "",
          password: "",
          tellno: "",
          branchID: "",
          addby: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : ""
        });
        setUsernameAvailable(true);
        setEmpidAvailable(true);
      } else {
        throw new Error(json.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-8 mx-auto max-w-5xl">
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-2xl font-bold">Add New Employee</CardTitle>
          </div>
          <CardDescription>Fill in the details to add a new employee to the system</CardDescription>
          <Separator />
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Employee added successfully!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-500" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    className={`pr-20 ${!usernameAvailable && !usernameChecking ? 'border-red-300 focus:ring-red-300' : ''}`}
                    placeholder="Enter username"
                  />
                  {usernameChecking ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : formData.username && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {usernameAvailable ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Taken
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="empid" className="flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4 text-gray-500" />
                  Employee ID
                </Label>
                <div className="relative">
                  <Input
                    id="empid"
                    type="text"
                    value={formData.empid}
                    onChange={handleEmpidChange}
                    className={`pr-20 ${!empidAvailable && !empidChecking ? 'border-red-300 focus:ring-red-300' : ''}`}
                    placeholder="Enter employee ID"
                  />
                  {empidChecking ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : formData.empid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {empidAvailable ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Taken
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-500" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4 text-gray-500" />
                  Role
                </Label>
                <Select
                  value={formData.roll}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, roll: value }))}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(rollData).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Set a secure password"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.tellno}
                  onChange={(e) => setFormData(prev => ({ ...prev, tellno: e.target.value }))}
                  placeholder="10-digit phone number"
                  className="appearance-none"
                />
                <p className="text-xs text-gray-500">Must be a 10-digit number</p>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label htmlFor="branch" className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Branch
                </Label>
                <Select
                  value={String(formData.branchID)} // Ensure it's a string
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branchID: value }))}
                >
                  <SelectTrigger id="branch" className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.branch} ({branch.shortcode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Added By */}
              <div className="space-y-2">
                <Label htmlFor="addby" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4 text-gray-500" />
                  Added By
                </Label>
                <Input
                  id="addby"
                  type="text"
                  value={formData.addby}
                  disabled
                  className="bg-gray-50"
                  placeholder="Current admin ID"
                />
                {formData.addby && (
                  <p className="text-xs text-gray-500">
                    Added by: {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : ''}
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end pt-2 pb-6 px-6 border-t">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !usernameAvailable || !empidAvailable}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Add Employee</span>
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}