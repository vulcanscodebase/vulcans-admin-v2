"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Award, Plus, Settings } from "lucide-react";
import { adminApiClient } from "@/components/api/adminApi";

interface PodLicenseManagementProps {
  podId: string;
  podName: string;
  totalLicenses: number;
  assignedLicenses: number;
  availableLicenses: number;
  onUpdate: () => void;
}

export default function PodLicenseManagement({
  podId,
  podName,
  totalLicenses,
  assignedLicenses,
  availableLicenses,
  onUpdate,
}: PodLicenseManagementProps) {
  const [showSetLicenses, setShowSetLicenses] = useState(false);
  const [showAddLicenses, setShowAddLicenses] = useState(false);
  const [setAmount, setSetAmount] = useState(totalLicenses);
  const [addAmount, setAddAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSetLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setAmount < assignedLicenses) {
      toast.error(`Cannot set total below ${assignedLicenses} (already assigned to users)`);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.put(`/pods/${podId}/licenses/set`, {
        totalLicenses: setAmount,
      });
      toast.success(`Pod license pool set to ${setAmount}!`);
      setShowSetLicenses(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to set licenses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addAmount <= 0) {
      toast.error("Please enter a positive number");
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.post(`/pods/${podId}/licenses/add`, {
        amount: addAmount,
      });
      toast.success(`Added ${addAmount} licenses to pod!`);
      setShowAddLicenses(false);
      setAddAmount(0);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add licenses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Pod License Management
        </CardTitle>
        <CardDescription>Manage interview licenses for "{podName}"</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* License Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Licenses</p>
            <p className="text-2xl font-bold">{totalLicenses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
            <p className="text-2xl font-bold text-orange-600">{assignedLicenses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
            <p className="text-2xl font-bold text-green-600">{availableLicenses}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {!showSetLicenses && !showAddLicenses && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSetAmount(totalLicenses);
                setShowSetLicenses(true);
              }}
              variant="outline"
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Set Total Licenses
            </Button>
            <Button
              onClick={() => setShowAddLicenses(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Licenses
            </Button>
          </div>
        )}

        {/* Set Licenses Form */}
        {showSetLicenses && (
          <form onSubmit={handleSetLicenses} className="p-4 border rounded-lg space-y-4">
            <div>
              <Label htmlFor="setAmount">Set Total Licenses</Label>
              <Input
                id="setAmount"
                type="number"
                min={assignedLicenses}
                value={setAmount}
                onChange={(e) => setSetAmount(parseInt(e.target.value) || 0)}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {assignedLicenses} (already assigned to users)
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Setting..." : "Set Licenses"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSetLicenses(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Add Licenses Form */}
        {showAddLicenses && (
          <form onSubmit={handleAddLicenses} className="p-4 border rounded-lg space-y-4">
            <div>
              <Label htmlFor="addAmount">Add Licenses</Label>
              <Input
                id="addAmount"
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                required
                disabled={loading}
                placeholder="Enter number of licenses to add"
              />
              <p className="text-xs text-gray-500 mt-1">
                New total will be: {totalLicenses + addAmount}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Licenses"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddLicenses(false);
                  setAddAmount(0);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Info Message */}
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            ℹ️ How It Works
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Set the total license pool for this pod</li>
            <li>Admins can assign licenses to users from this pool</li>
            <li>You can add more licenses anytime as needed</li>
            <li>Super admins can bypass license limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

