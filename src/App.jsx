import { useEffect, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAdd, onBuyNow }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <img src={product.image} alt={product.title} className="w-full h-48 object-cover" />
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-800 line-clamp-2">{product.title}</h3>
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <span>{'★'.repeat(Math.round(product.rating || 4))}</span>
          <span className="text-gray-500">{product.rating?.toFixed(1) || '4.5'}</span>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          <div className="flex items-center gap-2">
            {product.buy_url && (
              <button
                onClick={() => onBuyNow(product.buy_url)}
                className="bg-black hover:bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm"
              >
                Buy now
              </button>
            )}
            <button
              onClick={() => onAdd(product)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Cart({ items, onCheckout }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const shipping = subtotal >= 50 ? 0 : 6.99
  const taxes = +(subtotal * 0.07).toFixed(2)
  const total = +(subtotal + shipping + taxes).toFixed(2)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 sticky top-4">
      <h3 className="text-lg font-semibold">Cart</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Your cart is empty.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="line-clamp-1">{it.title} × {it.quantity}</span>
              <span>${(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between"><span>Taxes</span><span>${taxes.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-gray-800"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <button onClick={() => onCheckout({ subtotal, shipping, taxes, total })} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md">
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}

function AddProduct({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', price: '', category: '', image: '', buy_url: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.price) {
      setError('Title and price are required')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          price: parseFloat(form.price),
          category: form.category || 'Other',
          image: form.image || undefined,
          buy_url: form.buy_url || undefined,
          description: form.description || undefined,
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Failed to add product')
      setForm({ title: '', price: '', category: '', image: '', buy_url: '', description: '' })
      setOpen(false)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <button onClick={() => setOpen(o => !o)} className="text-sm underline">
        {open ? 'Close add product' : 'Add a new product'}
      </button>
      {open && (
        <form className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title *" className="border rounded-md px-3 py-2" />
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price *" type="number" step="0.01" className="border rounded-md px-3 py-2" />
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" className="border rounded-md px-3 py-2" />
          <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="border rounded-md px-3 py-2" />
          <input value={form.buy_url} onChange={e => setForm({ ...form, buy_url: e.target.value })} placeholder="External Buy URL (Buy now)" className="border rounded-md px-3 py-2 md:col-span-2" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border rounded-md px-3 py-2 md:col-span-2" />
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <div className="md:col-span-2 flex justify-end">
            <button disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded-md disabled:opacity-60">
              {saving ? 'Saving...' : 'Add product'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')

  const loadProducts = async () => {
    try {
      setLoading(true)
      const url = new URL(`${BACKEND_URL}/api/products`)
      if (query) url.searchParams.set('q', query)
      if (category) url.searchParams.set('category', category)
      const res = await fetch(url)
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      setMessage('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category])

  const addToCart = (p) => {
    setCart(prev => {
      const existing = prev.find(it => it.id === p.id || it.title === p.title)
      if (existing) {
        return prev.map(it => it === existing ? { ...it, quantity: it.quantity + 1 } : it)
      }
      return [...prev, { ...p, quantity: 1 }]
    })
  }

  const buyNow = (url) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const checkout = async (totals) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ product_id: c.id, title: c.title, price: c.price, quantity: c.quantity, image: c.image })),
          customer_name: 'Guest',
          customer_email: 'guest@example.com',
          customer_address: '123 Demo St, Web City',
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Order placed! ID: ${data.order_id}`)
        setCart([])
      } else {
        setMessage(data.detail || 'Order failed')
      }
    } catch (e) {
      setMessage('Checkout failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-500">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-2xl font-black text-white">ShopClone</a>
          <div className="flex-1 max-w-xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anything..."
              className="w-full rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-md px-2 py-2">
            <option value="">All</option>
            <option>Electronics</option>
            <option>Home</option>
            <option>Outdoors</option>
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <AddProduct onCreated={loadProducts} />
          {loading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-500">No products found.</p>
              <button onClick={async () => { await fetch(`${BACKEND_URL}/api/products/seed`, { method: 'POST' }); window.location.reload() }} className="bg-gray-800 text-white px-4 py-2 rounded-md">
                Seed demo products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p, idx) => (
                <ProductCard key={p.id || idx} product={p} onAdd={addToCart} onBuyNow={buyNow} />
              ))}
            </div>
          )}
        </div>
        <div>
          <Cart items={cart} onCheckout={checkout} />
          {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
          <a href="/test" className="block mt-4 text-sm text-gray-600 underline">Backend status</a>
        </div>
      </main>

      <footer className="py-10 text-center text-xs text-gray-500">© {new Date().getFullYear()} ShopClone. Built for demo purposes.</footer>
    </div>
  )
}

export default App
