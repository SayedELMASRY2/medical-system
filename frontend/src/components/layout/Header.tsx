"use client";

import React, { useState, useEffect } from "react";
import { cn, getScopedKey } from "@/lib/utils";
import { Bell, Search, User, Menu, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  className?: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function Header({ className }: HeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("PATIENT");
  const [userEmail, setUserEmail] = useState<string>("user@materna.ai");
  const [userName, setUserName] = useState<string>("User Profile");
  const [userAvatar, setUserAvatar] = useState<string>("/default_avatar.png");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = parseJwt(token);
        if (decoded?.role) setUserRole(decoded.role);
        if (decoded?.sub) setUserEmail(decoded.sub);
      }

      const savedProfile = localStorage.getItem(getScopedKey("materna_user_profile"));
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.avatar) setUserAvatar(parsed.avatar);
          if (parsed.fullName) setUserName(parsed.fullName);
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      document.cookie = "access_token=; path=/; max-age=0;";
    }
    router.push("/login");
  };

  return null;
}
