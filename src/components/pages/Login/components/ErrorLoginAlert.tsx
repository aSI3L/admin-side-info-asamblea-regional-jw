"use client"

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";

export function ErrorLoginAlert() {
    const { loginError, setLoginError } = useAuth()
    const [openAlert, setOpenAlert] = useState(false)

    useEffect(() => {
        if (loginError?.type === "not-authorized" || loginError?.type === "needs-password-creation" || loginError?.type === "error") {
            setOpenAlert(true)
        }
    }, [loginError])

    return (
        <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{ loginError?.title }</AlertDialogTitle>
                    <AlertDialogDescription>{ loginError?.message }</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction className="cursor-pointer" onClick={() => { if (loginError?.type !== 'needs-password-creation') setLoginError(null) }}>Aceptar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}