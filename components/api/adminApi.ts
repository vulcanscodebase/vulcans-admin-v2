import axios from "axios";

// Create Axios instance for admin API
export const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  withCredentials: true,
  timeout: 120000,
});

// Setup interceptors for token handling
export const setupAdminInterceptors = (
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>
) => {
  // Request interceptor - add token to headers
  adminApiClient.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle token refresh
  adminApiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/refresh-token") &&
        !originalRequest.url?.includes("/logout")
      ) {
        originalRequest._retry = true;

        try {
          const token = await refreshToken();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return adminApiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("adminToken");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
};

// Admin Auth APIs
export const adminLogin = (data: { email: string; password: string }) =>
  adminApiClient.post("/admin/login", data);

export const adminLogout = () => adminApiClient.post("/admin/logout");

export const getCurrentAdmin = () => adminApiClient.get("/admin/me");

export const adminRefreshToken = () =>
  adminApiClient.post("/admin/refresh-token");

export const adminSetupPassword = (data: { token: string; password: string }) =>
  adminApiClient.post("/admin/setup-password", data);

// Admin Management APIs
export const getAllAdmins = () => adminApiClient.get("/admin/");

export const deleteAdmin = (adminId: string) =>
  adminApiClient.delete(`/admin/${adminId}`);

export const getAllUsers = (page = 1, limit = 50, search?: string, verified?: boolean) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (search) params.append("search", search);
  if (verified !== undefined) params.append("verified", verified.toString());
  return adminApiClient.get(`/admin/users?${params.toString()}`);
};

export const createAdmin = (data: { name: string; email: string; roleId: string }) =>
  adminApiClient.post("/admin/create-user", data);

export const createRole = (data: {
  name: string;
  description: string;
  permissions: Array<{ feature: string; actions: string[] }>;
}) => adminApiClient.post("/admin/create-role", data);

// Pod Management APIs
export const createPod = (data: {
  name: string;
  type: string;
  email: string;
  educationalStatus?: string;
  organizationName?: string;
  instituteName?: string;
  parentPodId?: string;
}) => adminApiClient.post("/pods/create", data);

export const getAllPods = (includeDeleted?: boolean) => {
  const params = new URLSearchParams();
  if (includeDeleted) {
    params.append("includeDeleted", "true");
  }
  const queryString = params.toString();
  return adminApiClient.get(`/pods/all${queryString ? `?${queryString}` : ""}`);
};

export const getPodById = (podId: string) =>
  adminApiClient.get(`/pods/${podId}`);

export const getPodByParentId = (parentPodId: string) =>
  adminApiClient.get(`/pods/filter/by-parent/${parentPodId}`);

export const getPodUsers = (podId: string, page = 1, limit = 10, search?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);
  return adminApiClient.get(`/pods/${podId}/users?${params.toString()}`);
};

export const addPodUser = (podId: string, data: {
  name: string;
  email: string;
  qualification?: string;
  dob?: string;
  licenses?: number;
}) => adminApiClient.post(`/pods/${podId}/add-user`, data);

export const deletePodUser = (podId: string, userId: string) =>
  adminApiClient.delete(`/pods/${podId}/users/${userId}`);

export const uploadPodUsersExcel = (podId: string, file: File) => {
  const formData = new FormData();
  formData.append("excel", file);
  return adminApiClient.post(`/pods/upload-users-excel/${podId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const previewPodUsersExcel = (podId: string, file: File) => {
  const formData = new FormData();
  formData.append("excel", file);
  return adminApiClient.post(`/pods/preview-users/${podId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const bulkAddPodUsers = (podId: string, data: {
  newUsers: any[];
  existingUsers: any[];
  invalidEmails: string[];
}) => adminApiClient.post(`/pods/${podId}/bulk-add`, data);

export const getPodAnalytics = (podId: string) =>
  adminApiClient.get(`/pods/${podId}/analytics`);

export const softDeletePod = (podId: string) =>
  adminApiClient.delete(`/pods/${podId}/soft-delete`);

export const restorePod = (podId: string) =>
  adminApiClient.patch(`/pods/${podId}/restore`);

export const permanentlyDeletePod = (podId: string) =>
  adminApiClient.delete(`/pods/${podId}/permanent-delete`);

export const getPodHierarchy = (podId: string) =>
  adminApiClient.get(`/pods/${podId}/hierarchy`);

