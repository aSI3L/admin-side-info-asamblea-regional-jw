import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function DropdownAvatar() {
    const { authUser, logout } = useAuth()
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
                <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={authUser?.photoURL || "no-profile-icon.png"} alt="Imagen Avatar"/>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-40 rounded-lg"
            side="bottom"
            align="end"
        >
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={authUser?.photoURL || "no-profile-icon.png"} alt="Imagen Avatar" />
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{authUser?.displayName}</span>
                        <span className="truncate text-xs">{authUser?.email}</span>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}