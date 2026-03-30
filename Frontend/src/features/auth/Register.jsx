import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: "", // [cite: 18]
    ownerName: "", // [cite: 19]
    email: "", // [cite: 20]
    phone: "", // [cite: 21]
    address: "", // [cite: 22]
    password: "", // [cite: 23]
    confirmPassword: "", // [cite: 24]
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {generateToken
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      console.log("Sending data to backend:", formData);
      const response = await api.post("/api/restaurants/register", formData);

      console.log("Backend Success Response:", response.data);
      // Force the redirect to login
      navigate("/login", {
        state: { message: "Registration successful! Please login." },
      });
    } catch (err) {
      // THIS IS THE CRITICAL DEBUGGING PART
      console.error("Full Error Object:", err);

      if (err.message === "Network Error") {
        setError(
          "Network Error: This is likely a CORS issue in your Node.js backend.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Check the console.",
        );
      }
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Register Your Restaurant
        </h2>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="restaurantName"
            placeholder="Restaurant Name"
            required
            className="w-full p-3 border rounded-md"
            onChange={handleChange}
          />
          <input
            type="text"
            name="ownerName"
            placeholder="Owner Name"
            required
            className="w-full p-3 border rounded-md"
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full p-3 border rounded-md"
              onChange={handleChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              required
              className="w-full p-3 border rounded-md"
              onChange={handleChange}
            />
          </div>

          <textarea
            name="address"
            placeholder="Address"
            required
            className="w-full p-3 border rounded-md"
            onChange={handleChange}
          ></textarea>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full p-3 border rounded-md"
              onChange={handleChange}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              className="w-full p-3 border rounded-md"
              onChange={handleChange}
            />
          </div>

          {/* Button: Start 30 Days Free Trial [cite: 25] */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 font-bold mt-4"
          >
            Start 30 Days Free Trial
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
