import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import api from "../../lib/api";

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/users/login", credentials);

      if (response.data?.token) {
        // 1. Log in and get the user data immediately (sync)
        const decodedUser = login(response.data.token);

        if (decodedUser) {
          // REMOVED .toLowerCase() so it exactly matches the DB roles!
          const role = decodedUser.role;

          // 2. Direct Navigation based on role
          if (role === "SuperAdmin") {
            navigate("/admin/dashboard");
          } else if (role === "Owner" || role === "Manager") {
            navigate("/dashboard");
          } else if (role === "Cashier" || role === "Waiter") {
            navigate("/orders");
          } else if (role === "Waiter") {
            navigate("/tables");
          } else if (role === "Kitchen") {
            navigate("/kitchen");
          } else {
            navigate("/unauthorized");
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* Company Logo [cite: 6] */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Omicra</h1>
          <p className="text-gray-500">Restaurant & Café Management</p>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email / Phone Input Field [cite: 7] */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email or Phone
            </label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              onChange={handleChange}
            />
          </div>

          {/* Password Input Field [cite: 8] */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Forgot Password Option [cite: 9] */}
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Login Button [cite: 10] */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Login
          </button>
        </form>

        {/* Register Restaurant Link [cite: 11] */}
        <div className="mt-6 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register your restaurant
          </Link>
        </div>
      </div>
    </div>
  );
}
