"use client";

import { useState } from "react";
import { createPod } from "@/components/api/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface CreatePodDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePodDialog({ open, onClose, onSuccess }: CreatePodDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "institution",
    email: "",
    educationalStatus: "",
    organizationName: "",
    instituteName: "",
    parentPodId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPod(formData);
      toast.success("Pod created successfully!");
      // Reset form
      setFormData({
        name: "",
        type: "institution",
        email: "",
        educationalStatus: "",
        organizationName: "",
        instituteName: "",
        parentPodId: "",
      });
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create pod");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Pod</CardTitle>
          <CardDescription>Create a new pod/group in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Pod Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                required
                disabled={loading}
              >
                <option value="institution">Institution</option>
                <option value="organization">Organization</option>
              </select>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="instituteName">Institute Name</Label>
              <Input
                id="instituteName"
                value={formData.instituteName}
                onChange={(e) =>
                  setFormData({ ...formData, instituteName: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="educationalStatus">Educational Status</Label>
              <select
                id="educationalStatus"
                value={formData.educationalStatus}
                onChange={(e) =>
                  setFormData({ ...formData, educationalStatus: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                disabled={loading}
              >
                <option value="">Select...</option>
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="university">University</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Pod"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

