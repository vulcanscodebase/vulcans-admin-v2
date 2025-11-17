"use client";

import { useState, useEffect } from "react";
import { getAllAdmins } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminsList() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAllAdmins();
      setAdmins(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading admins...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Admins</CardTitle>
        <CardDescription>View all admin users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No admins found.</p>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin._id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{admin.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {admin.email} • Role: {admin.role?.name || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

