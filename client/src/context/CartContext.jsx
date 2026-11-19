import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './contexts.js';
import useAuth from '../hooks/useAuth.js';
import useToast from '../hooks/useToast.js';
import {
  addCartItemRequest,
  clearCartRequest,
  getCartRequest,
  mergeCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from '../services/cartService.js';
import { extractApiError } from '../utils/formatters.js';

const GUEST_CART_KEY = 'koramarket_guest_cart';
const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING_FEE = 9.99;
const TAX_RATE = 0.08;

function computeTotals(items) {
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = Number(
    items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0).toFixed(2)
  );
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));
  const totalAmount = Number((subtotal + shippingFee + taxAmount).toFixed(2));
  return { itemCount, subtotal, shippingFee, taxAmount, totalAmount };
}

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [], ...computeTotals([]) };
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return { items: [], ...computeTotals([]) };
    return { items, ...computeTotals(items) };
  } catch {
    return { items: [], ...computeTotals([]) };
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const [cart, setCart] = useState(() => loadGuestCart());
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Fetch or merge cart on auth change
  const refreshCart = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setCart(loadGuestCart());
      return;
    }

    setLoading(true);
    try {
      const guestCart = loadGuestCart();
      if (guestCart.items.length > 0) {
        const payload = guestCart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        }));
        const merged = await mergeCartRequest(payload);
        localStorage.removeItem(GUEST_CART_KEY);
        setCart(merged);
        toast.info('Your guest items have been added to your account cart.');
      } else {
        const serverCart = await getCartRequest();
        setCart(serverCart);
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Unable to sync shopping cart.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      const requestedQty = Math.max(1, Number(quantity) || 1);

      if (isAuthenticated) {
        setLoading(true);
        try {
          const updated = await addCartItemRequest({
            productId: product.id,
            quantity: requestedQty,
          });
          setCart(updated);
          toast.success(`Added ${product.name} to cart.`);
          openDrawer();
        } catch (err) {
          toast.error(extractApiError(err, 'Could not add to cart.'));
        } finally {
          setLoading(false);
        }
        return;
      }

      // Guest cart mode
      const current = loadGuestCart();
      const existingIdx = current.items.findIndex((i) => i.productId === product.id);
      let updatedItems = [];

      if (existingIdx >= 0) {
        const nextQty = current.items[existingIdx].quantity + requestedQty;
        if (product.stockQuantity && nextQty > product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} available in stock.`);
          return;
        }
        updatedItems = [...current.items];
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          quantity: nextQty,
          lineTotal: Number((nextQty * product.price).toFixed(2)),
        };
      } else {
        if (product.stockQuantity && requestedQty > product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} available in stock.`);
          return;
        }
        updatedItems = [
          ...current.items,
          {
            itemId: `guest-${product.id}`,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            primaryImage: product.primaryImage || product.images?.[0]?.imageUrl || null,
            stockQuantity: product.stockQuantity || 99,
            isAvailable: true,
            quantity: requestedQty,
            lineTotal: Number((requestedQty * Number(product.price)).toFixed(2)),
          },
        ];
      }

      const nextCart = { items: updatedItems, ...computeTotals(updatedItems) };
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
      setCart(nextCart);
      toast.success(`Added ${product.name} to cart.`);
      openDrawer();
    },
    [isAuthenticated, openDrawer, toast]
  );

  const updateQuantity = useCallback(
    async (item, newQuantity) => {
      const qty = Math.max(1, Number(newQuantity) || 1);

      if (isAuthenticated) {
        setLoading(true);
        try {
          const updated = await updateCartItemRequest(item.itemId, qty);
          setCart(updated);
        } catch (err) {
          toast.error(extractApiError(err, 'Could not update quantity.'));
        } finally {
          setLoading(false);
        }
        return;
      }

      // Guest mode
      const current = loadGuestCart();
      const updatedItems = current.items.map((i) => {
        if (i.productId === item.productId) {
          return {
            ...i,
            quantity: qty,
            lineTotal: Number((qty * i.price).toFixed(2)),
          };
        }
        return i;
      });

      const nextCart = { items: updatedItems, ...computeTotals(updatedItems) };
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
      setCart(nextCart);
    },
    [isAuthenticated, toast]
  );

  const removeItem = useCallback(
    async (item) => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const updated = await removeCartItemRequest(item.itemId);
          setCart(updated);
          toast.info(`Removed ${item.name} from cart.`);
        } catch (err) {
          toast.error(extractApiError(err, 'Could not remove item.'));
        } finally {
          setLoading(false);
        }
        return;
      }

      // Guest mode
      const current = loadGuestCart();
      const updatedItems = current.items.filter((i) => i.productId !== item.productId);
      const nextCart = { items: updatedItems, ...computeTotals(updatedItems) };
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
      setCart(nextCart);
      toast.info(`Removed ${item.name} from cart.`);
    },
    [isAuthenticated, toast]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        const updated = await clearCartRequest();
        setCart(updated);
        toast.info('Cart cleared.');
      } catch (err) {
        toast.error(extractApiError(err, 'Could not clear cart.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    localStorage.removeItem(GUEST_CART_KEY);
    setCart({ items: [], ...computeTotals([]) });
    toast.info('Cart cleared.');
  }, [isAuthenticated, toast]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [
      cart,
      loading,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
