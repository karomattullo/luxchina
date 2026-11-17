import { Route, Routes } from 'react-router-dom'
import AdminApp from './admin/AdminApp'
import Layout from './components/Layout'
import Cart from './pages/Cart'
import Catalog, { Favorites } from './pages/Catalog'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProductPage from './pages/Product'
import Track from './pages/Track'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:orderNumber" element={<Track />} />
        <Route path="track" element={<Track />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/*" element={<AdminApp />} />
    </Routes>
  )
}
