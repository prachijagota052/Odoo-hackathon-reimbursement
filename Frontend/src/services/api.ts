const BASE_URL = import.meta.env.VITE_API_URL;

const request = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error("API error");
  }

  return res.json();
};

// Dashboard
export const getDashboard = () => request("/api/admin/dashboard");

// Users
export const getUsers = () => request("/api/admin/users");
export const updateUser = (id: number, data: any) =>
  request(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// Expenses
export const getExpenses = () => request("/api/admin/expenses");

export const approveExpense = (id: number) =>
  request(`/api/admin/expenses/${id}/approve`, { method: "PUT" });

export const rejectExpense = (id: number) =>
  request(`/api/admin/expenses/${id}/reject`, { method: "PUT" });

// Rules
export const getRules = () => request("/api/admin/rules");

export const createRule = (data: any) =>
  request("/api/admin/rules", {
    method: "POST",
    body: JSON.stringify(data),
  });