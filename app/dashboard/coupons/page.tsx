"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Ticket, Percent, IndianRupee, CheckCircle, XCircle, Users, ShoppingCart, Hash, Globe, Target } from "lucide-react";
import {
  getAllCoupons,
  createCoupon as createCouponApi,
  toggleCouponStatus,
  deleteCoupon as deleteCouponApi,
} from "@/components/api/adminApi";
import { toast } from "sonner";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  isActive: boolean;
  applicableProducts: string[];
  usageLimit: number | null;
  usageCount: number;
  usageLimitPerUser: number;
  maxProductsPerOrder: number | null;
  createdAt: string;
}

export default function CouponsPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [isUniversal, setIsUniversal] = useState(true);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "0",
    applicableProducts: [] as string[],
    usageLimit: "",
    usageLimitPerUser: "1",
    maxProductsPerOrder: "",
  });

  const AVAILABLE_PRODUCTS = [
    { id: "license", name: "Interview License (Credits)" },
  ];

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error("Access denied. Super admin only.");
      return;
    }
    loadCoupons();
  }, [isSuperAdmin]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await getAllCoupons();
      setCoupons(res.data?.coupons || []);
    } catch (error: any) {
      console.error("Error loading coupons:", error);
      toast.error(error.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error("Code and discount value are required.");
      return;
    }

    try {
      setIsCreating(true);
      await createCouponApi({
        code: formData.code,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        applicableProducts: isUniversal
          ? []
          : formData.applicableProducts,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        usageLimitPerUser: Number(formData.usageLimitPerUser) || 1,
        maxProductsPerOrder: formData.maxProductsPerOrder ? Number(formData.maxProductsPerOrder) : null,
      });

      toast.success("Coupon created successfully!");
      setShowCreateForm(false);
      setIsUniversal(true);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderValue: "0",
        applicableProducts: [],
        usageLimit: "",
        usageLimitPerUser: "1",
        maxProductsPerOrder: "",
      });
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create coupon");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (couponId: string) => {
    try {
      await toggleCouponStatus(couponId);
      toast.success("Coupon status updated.");
      setCoupons((prev) =>
        prev.map((c) =>
          c._id === couponId ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      loadCoupons();
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"? This action cannot be undone.`)) return;

    try {
      await deleteCouponApi(couponId);
      toast.success(`Coupon "${code}" deleted successfully!`);
      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete coupon");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only accessible to super admins.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Coupons</h1>
              <p className="text-muted-foreground">
                Create and manage discount codes for the checkout flow
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </div>

          {/* Create Coupon Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Coupon</CardTitle>
                <CardDescription>
                  Add a new discount code for users to apply during checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. SUMMER2024"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <select
                      id="discountType"
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={formData.discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderValue">Minimum Order Value (₹)</Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.minOrderValue}
                      onChange={(e) =>
                        setFormData({ ...formData, minOrderValue: e.target.value })
                      }
                    />
                  </div>

                  {/* Coupon Scope: Universal vs Product-Specific */}
                  <div className="space-y-2">
                    <Label>Coupon Scope</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsUniversal(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          isUniversal
                            ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Universal
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUniversal(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          !isUniversal
                            ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <Target className="h-3.5 w-3.5" />
                        Product-Specific
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isUniversal ? "Applies to all products" : "Only applies to specified product IDs"}
                    </p>
                  </div>

                  {!isUniversal && (
                    <div className="space-y-3 md:col-span-2 lg:col-span-3 border rounded-md p-4 bg-muted/20">
                      <Label>Select Applicable Products</Label>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {AVAILABLE_PRODUCTS.map((prod) => (
                          <label
                            key={prod.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.applicableProducts.includes(prod.id)
                                ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                                : "bg-card hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                              checked={formData.applicableProducts.includes(prod.id)}
                              onChange={(e) => {
                                const newSelection = e.target.checked
                                  ? [...formData.applicableProducts, prod.id]
                                  : formData.applicableProducts.filter((id) => id !== prod.id);
                                setFormData({ ...formData, applicableProducts: newSelection });
                              }}
                            />
                            <span className="text-sm font-medium">{prod.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">The coupon will only apply to the selected products.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for unlimited uses</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageLimitPerUser">Uses Per User</Label>
                    <Input
                      id="usageLimitPerUser"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.usageLimitPerUser}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimitPerUser: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">How many times each user can use this coupon</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxProductsPerOrder">Max Products Per Order</Label>
                    <Input
                      id="maxProductsPerOrder"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.maxProductsPerOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, maxProductsPerOrder: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Max items discount applies to per order</p>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white"
                    >
                      {isCreating ? "Creating..." : "Create Coupon"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Coupons Table */}
          <Card>
            <CardHeader>
              <CardTitle>Coupon Management</CardTitle>
              <CardDescription>
                View, edit, and manage all discount codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="mb-4 flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Total Coupons: <strong>{coupons.length}</strong>
                </span>
                <span className="text-muted-foreground">
                  Active: <strong>{coupons.filter((c) => c.isActive).length}</strong>
                </span>
                <span className="text-muted-foreground">
                  Inactive: <strong>{coupons.filter((c) => !c.isActive).length}</strong>
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No coupons found. Create your first discount code.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Min. Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Scope
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Per User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Max Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-vulcan-accent-blue/10 flex items-center justify-center">
                                <Ticket className="h-5 w-5 text-vulcan-accent-blue" />
                              </div>
                              <div className="ml-3">
                                <div className="font-semibold">{coupon.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full font-medium ${
                              coupon.discountType === "percentage"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            }`}>
                              {coupon.discountType === "percentage" ? (
                                <><Percent className="h-3 w-3 mr-1" /> Percentage</>
                              ) : (
                                <><IndianRupee className="h-3 w-3 mr-1" /> Fixed</>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-semibold">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}%`
                                : `₹${coupon.discountValue}`}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "None"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{coupon.usageCount || 0}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-muted-foreground">
                                {coupon.usageLimit !== null && coupon.usageLimit !== undefined ? coupon.usageLimit : "∞"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {(!coupon.applicableProducts || coupon.applicableProducts.length === 0) ? (
                              <span className="inline-flex items-center gap-1 text-sm text-blue-700 dark:text-blue-300">
                                <Globe className="h-3.5 w-3.5" /> Universal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-sm text-orange-700 dark:text-orange-300" title={coupon.applicableProducts.join(', ')}>
                                <Target className="h-3.5 w-3.5" /> Specific ({coupon.applicableProducts.length})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{coupon.usageLimitPerUser || 1}x</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {coupon.maxProductsPerOrder !== null && coupon.maxProductsPerOrder !== undefined
                                  ? coupon.maxProductsPerOrder
                                  : "∞"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(coupon._id)}
                              className="focus:outline-none"
                            >
                              {coupon.isActive ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 cursor-pointer hover:bg-red-200 transition-colors">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
