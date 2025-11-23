"use client";

import { useState, useEffect } from "react";
import { getPodUsers, addPodUser, deletePodUser } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface PodUsersListProps {
  podId: string;
}

export default function PodUsersList({ podId }: PodUsersListProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    qualification: "",
    dob: "",
  });

  useEffect(() => {
    loadUsers();
  }, [podId, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getPodUsers(podId, page, 10);
      setUsers(res.data?.users || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPodUser(podId, newUser);
      toast.success("User added successfully!");
      setShowAddUser(false);
      setNewUser({ name: "", email: "", qualification: "", dob: "" });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deletePodUser(podId, userId);
      toast.success("User deleted successfully!");
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pod Users</CardTitle>
            <CardDescription>Manage users in this pod</CardDescription>
          </div>
          <Button onClick={() => setShowAddUser(true)}>Add User</Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddUser && (
          <form onSubmit={handleAddUser} className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Add</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div>Loading users...</div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user._id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

