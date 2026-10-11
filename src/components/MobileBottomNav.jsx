import { NavLink } from "react-router-dom";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useStore } from "../context/StoreContext";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/shop", icon: Search, label: "Shop" },
  { to: "/wishlist", icon: Heart, label: "Saved" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
  { to: "/account", icon: User, label: "Me" },
];

export default function MobileBottomNav() {
  const { state, hydrated } = useStore();
  const cartCount = hydrated ? state.cart.reduce((s, i) => s + i.qty, 0) : 0;
  const wishCount = hydrated ? state.wishlist.length : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="mx-auto mb-3 max-w-md px-3">
        <div className="glass-strong flex items-center justify-around rounded-2xl px-2 py-2 shadow-lift">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                className={({ isActive }) =>
                  `relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition ${
                    isActive ? "text-accent-300" : "text-ink-300 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} />
                    <span>{it.label}</span>
                    {it.to === "/cart" && cartCount > 0 && (
                      <span className="absolute right-2 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-ink-950">
                        {cartCount}
                      </span>
                    )}
                    {it.to === "/wishlist" && wishCount > 0 && (
                      <span className="absolute right-2 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {wishCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-accent-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
