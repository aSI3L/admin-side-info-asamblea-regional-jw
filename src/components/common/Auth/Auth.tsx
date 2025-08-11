"use client"

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useInitialization } from "@/hooks/useInitialization";

interface AuthProps {
    children: ReactNode
}

export function Auth({ children }: AuthProps) {
    const { isInitializing } = useInitialization()
    const { authUser } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (isInitializing) return

        if (!authUser && pathname !== '/login') {
            router.replace('/login')
        }

        if (authUser && pathname === '/login') {
            router.replace('/')
        }
    }, [isInitializing, authUser, pathname, router])

    if (isInitializing || (!authUser && pathname !== '/login') || (authUser && pathname === '/login')) {
        return <LoadingSpinner />
    }

    return <>{children}</>
}