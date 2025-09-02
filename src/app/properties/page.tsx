import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProperties } from "@/lib/data";
import { ArrowRight } from "lucide-react";

export default function PropertiesPage() {
  const properties = getProperties();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Propiedades</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="flex flex-col">
            <CardHeader className="p-0">
               <div className="relative h-48 w-full">
                <Image
                  src={property.imageUrl}
                  alt={`Foto de ${property.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-t-lg object-cover"
                  data-ai-hint="house exterior"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <CardTitle className="font-headline text-xl">{property.name}</CardTitle>
              <p className="text-muted-foreground">{property.address}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/properties/${property.id}`}>
                  Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
