import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Catalog from "./Catalog";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ProfilePage from "./ProfilePage";
import Navbar from "./Navbar";
import AdminPage from "./AdminPage";
import ProductPage from "./ProductPage";
import CartPage from "./CartPage";
import { CartProvider } from "./CartContext";
import OrderPage from "./OrderPage";
import StarRating from "./StarRating";
import Wallet from "./Wallet";
import ChatWidget from "./ChatWidget";

function App() {
  return (
    <Router>
      <CartProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/product/:category/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/delivery" element={<OrderPage />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
        <ChatWidget />
      </CartProvider>
    </Router>
  );
}

export default App;
