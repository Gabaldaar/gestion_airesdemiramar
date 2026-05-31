'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Property, Tenant, Origin, ContratoWithDetails, Contrato, getContratos, getProperties, getTenants, getOrigins } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback, Suspense } from "react";
import { ContratoAddForm } from "@/components/contrato-add-form";
import { Loader2 } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import ContratosClient from "@/components/contratos-client";

interface ContratosData {
    allContratos: ContratoWithDetails[];
    properties: Property[];
    tenants: Tenant[];
    origins: Origin[];
}

function ContratosPageContent() {
  const { user, orgId, appUser } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<ContratosData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [key, setKey] = useState(0);
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const currentOrgId = orgId || 'global';
        
        const [contratosRaw, properties, tenants, origins] = await Promise.all([
            getContratos(currentOrgId),
            getProperties(currentOrgId),
            getTenants(currentOrgId),
            getOrigins(currentOrgId),
        ]);

        const tenantsMap = new Map<string, Tenant>(tenants.map((t: Tenant) => [t.id, t]));

        // DEDUPLICACIÓN ULTRA-ESTRICTA:
        // Usamos una llave normalizada para evitar variaciones sutiles (espacios, mayúsculas, fechas ISO vs cortas)
        const uniqueContratosMap = new Map<string, ContratoWithDetails>();
        
        contratosRaw.forEach((c: Contrato) => {
            if (!c.propertyId || !c.tenantId || !c.fechaInicio) return;

            // Normalizamos cada componente de la llave
            const pId = String(c.propertyId).trim().toLowerCase();
            const tId = String(c.tenantId).trim().toLowerCase();
            const fIn = String(c.fechaInicio).split('T')[0].trim(); // Solo la parte de la fecha YYYY-MM-DD
            
            const fingerprint = `${pId}_${tId}_${fIn}`;
            
            // Si el contrato es nuevo para este mapa, o si el ID del documento es el mismo (seguridad extra)
            if (!uniqueContratosMap.has(fingerprint)) {
                uniqueContratosMap.set(fingerprint, {
                    ...c,
                    tenantName: tenantsMap.get(c.tenantId)?.name || 'Desconocido',
                    tenant: tenantsMap.get(c.tenantId)
                });
            }
        });

        const finalContratos = Array.from(uniqueContratosMap.values()).sort((a, b) => 
            b.fechaInicio.localeCompare(a.fechaInicio)
        );

        setData({ 
            allContratos: finalContratos, 
            properties, 
            tenants, 
            origins 
        });
    } catch (error) {
        console.error("Failed to fetch contratos data:", error);
    } finally {
        setLoading(false);
    }
  }, [user, orgId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, key]);

  const handleDataChanged = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  if (loading && !data) {
      return (
        <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            {t('common.loading')}
        </div>
    );
  }

  if (!data) return null;

  const { allContratos, properties, tenants, origins } = data;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">
                    {t('navigation.contracts')}
                </h2>
                <p className="text-muted-foreground">
                    {t('contratos.description')}
                </p>
          </div>
          {isPersonalFlavor && (
            <div className="flex-shrink-0">
                <ContratoAddForm 
                    tenants={tenants}
                    properties={properties}
                    onDataChanged={handleDataChanged}
                />
            </div>
          )}
      </div>
      <Card>
        <CardContent className="pt-6">
            <ContratosClient 
                initialContratos={allContratos} 
                properties={properties} 
                tenants={tenants} 
                origins={origins}
                onDataChanged={handleDataChanged}
            />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContratosPage() {
    return (
        <Suspense fallback={<div className="flex h-48 items-center justify-center">Cargando...</div>}>
            <ContratosPageContent />
        </Suspense>
    );
}
