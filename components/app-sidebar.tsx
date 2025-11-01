"use client"

import * as React from "react"
import {
  Calendar1,
  Camera,
  Settings2,
  LayoutDashboard
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"

const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Calendar",
      url: "/calender",
      icon: Calendar1,
    },
    {
      title: "Meetings",
      url: "/meetings",
      icon: Camera,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { userDetails, loading } = useUser()

  // Mark active item based on current pathname
  const navMainItems = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }))

  // Default user data if not loaded yet
  const userData = userDetails
    ? {
        name: userDetails.name || "User",
        email: userDetails.email || "",
        avatar: userDetails.avatar || "",
      }
    : {
        name: "Loading...",
        email: "",
        avatar: "",
      }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        {!loading && userDetails && <NavUser user={userData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
