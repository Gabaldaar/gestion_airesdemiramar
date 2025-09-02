import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getProperties } from "@/lib/data"
import { PropertySettingsForm } from "./_components/property-settings-form"

export default function SettingsPage() {
  const properties = getProperties()

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-headline">Configuración de Propiedades</h1>
      <div className="grid gap-6">
        {properties.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle className="font-headline">{property.name}</CardTitle>
              <CardDescription>
                Configura los detalles de esta propiedad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertySettingsForm property={property} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
