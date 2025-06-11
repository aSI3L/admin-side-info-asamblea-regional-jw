import { Card, CardContent } from "@/ui/card";
import { LINKS } from "@/src/consts/links.consts";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
      {
        LINKS.map((link) => ( link.href !== '/' &&
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-lg transition-shadow md:cursor-pointer md:hover:scale-105 md:transition md:ease-in-out md:duration-300">
              <CardContent className="flex flex-col items-center justify-center p-4 font-medium text-center">
                <link.icon className="w-8 h-8 mb-2" />
                { link.label }
              </CardContent>
            </Card>
          </Link>
        ))
      }
    </div>
  );
}
