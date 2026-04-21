import { Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import Login from "./auth/Login";
import Register from "./auth/Register";
import FozoreworHome from "./FozoreworHome.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import CheckoutPage from "./cart/CheckoutPage.jsx";
import OrdersPage from "./orders/OrdersPage.jsx";
import TrackingPage from "./orders/TrackingPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/checkout" element={<CheckoutPage />} />

      <Route element={<Layout />}>
        <Route index element={<FozoreworHome />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/tracking/:orderId" element={<TrackingPage />} />
      </Route>

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
