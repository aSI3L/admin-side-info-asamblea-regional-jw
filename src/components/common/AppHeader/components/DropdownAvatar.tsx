import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function DropdownAvatar() {
    const { authUser, logout } = useAuth()
    const initials = authUser?.displayName?.split(" ").map(name => name.charAt(0).toUpperCase()).join("") || "U";
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                className="cursor-pointer hover:bg-secondary/80 focus:bg-secondary/80 transition-colors duration-200"
            >
                <Avatar className="h-8 w-8 rounded-lg ">
                    <AvatarImage src={authUser?.photoURL} alt="Imagen Avatar"/>
                    <AvatarFallback className="bg-white text-primary font-medium">
                        { initials }
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-40 rounded-lg bg-card border-border shadow-lg"
            side="bottom"
            align="end"
        >
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-3 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={authUser?.photoURL} alt="Imagen Avatar" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                            { initials }
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-foreground">{authUser?.displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">{authUser?.email}</span>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-200 mx-1 rounded-sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}