import { NavLink, Outlet } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import { buttonVariants } from "src/components/ui/button";
import { cn } from "src/lib/utils";

export default function SettingsLayout() {
  return (
    <>
      <AppHeader
        title="Settings"
        description="Manage your account settings and set e-mail preferences."
      />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          <MenuItem to="/settings">General</MenuItem>
          <MenuItem to="/settings/backup">Backup</MenuItem>
          <MenuItem to="/settings/change-unlock-password">
            Unlock Password
          </MenuItem>
          <MenuItem to="/debug-tools">Debug Tools</MenuItem>
        </nav>
        <div className="flex-1 lg:max-w-2xl">
          <div className="grid gap-6">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

const MenuItem = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode | string;
}) => (
  <>
    <NavLink
      end
      to={to}
      className={({ isActive }) =>
        cn(
          buttonVariants({ variant: "ghost" }),
          isActive
            ? "bg-muted hover:bg-muted"
            : "hover:bg-transparent hover:underline",
          "justify-start"
        )
      }
    >
      {children}
    </NavLink>
  </>
);

MenuItem;
