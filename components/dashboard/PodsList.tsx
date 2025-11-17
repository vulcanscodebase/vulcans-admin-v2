"use client";

import { useState, useEffect } from "react";
import { getAllPods } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PodsList() {
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPods();
  }, []);

  const loadPods = async () => {
    try {
      setLoading(true);
      const res = await getAllPods();
      setPods(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pods");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading pods...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Pods</CardTitle>
        <CardDescription>Manage and view all pods in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {pods.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No pods found. Create your first pod to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {pods.map((pod) => (
              <div
                key={pod._id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{pod.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pod.type} • {pod.email}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

