
'use client';

import { useEffect, useCallback } from 'react';
import { driver, type DriveStep, type Side } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from './auth-provider';
import { useTranslation } from '@/i18n/useTranslation';
import { usePathname, useRouter } from 'next/navigation';
import useWindowSize from '@/hooks/use-window-size';

export function ProductTour() {
    const { activeRole, appUser } = useAuth();
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const { width } = useWindowSize();
    const isMobile = typeof width === 'number' ? width < 768 : false;
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

    const startTour = useCallback((type: 'main' | 'property' | 'settings' = 'main') => {
        const isPropertyDetailPage = pathname.startsWith('/properties/') && pathname.length > 12;

        const mainSteps: DriveStep[] = [
            ...(isMobile ? [
                { 
                    element: '#nav-home-mobile', 
                    popover: { title: t('tour.home.title'), description: t('tour.home.desc'), side: "top" as Side } 
                },
                { 
                    element: '#nav-properties-mobile', 
                    popover: { title: t('tour.properties.title'), description: t('tour.properties.desc'), side: "top" as Side } 
                },
                { 
                    element: '#nav-tenants-mobile', 
                    popover: { title: t('tour.tenants.title'), description: t('tour.tenants.desc'), side: "top" as Side } 
                },
                { 
                    element: '#nav-bookings-mobile', 
                    popover: { title: t('tour.bookings.title'), description: t('tour.bookings.desc'), side: "top" as Side } 
                },
                { 
                    element: '#nav-contratos-mobile', 
                    popover: { title: t('tour.contracts.title'), description: t('tour.contracts.desc'), side: "top" as Side } 
                },
                { 
                    element: '#mobile-menu-trigger', 
                    popover: { title: t('tour.mobile_menu.title'), description: t('tour.mobile_menu.desc'), side: "bottom" as Side } 
                }
            ] : [
                { element: '#nav-home', popover: { title: t('tour.home.title'), description: t('tour.home.desc'), side: "right" as Side, align: 'start' } },
                { element: '#nav-properties', popover: { title: t('tour.properties.title'), description: t('tour.properties.desc'), side: "right" as Side, align: 'start' } },
                { element: '#nav-tenants', popover: { title: t('tour.tenants.title'), description: t('tour.tenants.desc'), side: "right" as Side, align: 'start' } },
                ...(isPersonalFlavor ? [{ element: '#nav-providers', popover: { title: t('tour.providers.title'), description: t('tour.providers.desc'), side: "right" as Side, align: 'start' } } as DriveStep] : []),
                { element: '#nav-bookings', popover: { title: t('tour.bookings.title'), description: t('tour.bookings.desc'), side: "right" as Side, align: 'start' } },
                { element: '#nav-contratos', popover: { title: t('tour.contracts.title'), description: t('tour.contracts.desc'), side: "right" as Side, align: 'start' } },
                ...(isPersonalFlavor ? [
                    { element: '#nav-tasks', popover: { title: t('tour.tasks.title'), description: t('tour.tasks.desc'), side: "right" as Side, align: 'start' } } as DriveStep,
                    { element: '#nav-expenses', popover: { title: t('tour.expenses.title'), description: t('tour.expenses.desc'), side: "right" as Side, align: 'start' } } as DriveStep,
                    { element: '#nav-liquidations', popover: { title: t('tour.liquidations.title'), description: t('tour.liquidations.desc'), side: "right" as Side, align: 'start' } } as DriveStep
                ] : []),
                { element: '#nav-informes', popover: { title: t('tour.informes.title'), description: t('tour.informes.desc'), side: "right" as Side, align: 'start' } },
                { element: '#nav-help', popover: { title: t('tour.help.title'), description: t('tour.help.desc'), side: "right" as Side, align: 'start' } },
                { element: '#nav-settings', popover: { title: t('tour.settings.title'), description: t('tour.settings.desc'), side: "right" as Side, align: 'start' } }
            ]),
            { 
                element: '#user-menu-trigger', 
                popover: { 
                    title: t('tour.user_menu.title'), 
                    description: t('tour.user_menu.desc'), 
                    side: "bottom" as Side,
                    align: "end"
                } 
            }
        ];

        const propertySteps: DriveStep[] = [
            { element: '#tab-temporarios', popover: { title: t('tour.property_detail.temporarios_title'), description: t('tour.property_detail.temporarios_desc'), side: "bottom" as Side } },
            { element: '#tab-contratos', popover: { title: t('tour.property_detail.contratos_title'), description: t('tour.property_detail.contratos_desc'), side: "bottom" as Side } },
            { element: '#tab-blocks', popover: { title: t('tour.property_detail.blocks_title'), description: t('tour.property_detail.blocks_desc'), side: "bottom" as Side } },
            { element: '#tab-calendar', popover: { title: t('tour.property_detail.calendar_title'), description: t('tour.property_detail.calendar_desc'), side: "bottom" as Side } },
            { element: '#tab-tasks', popover: { title: t('tour.property_detail.tasks_title'), description: t('tour.property_detail.tasks_desc'), side: "bottom" as Side } },
            ...(isPersonalFlavor ? [{ element: '#tab-expenses', popover: { title: t('tour.property_detail.expenses_title'), description: t('tour.property_detail.expenses_desc'), side: "bottom" as Side } } as DriveStep] : []),
            { element: '#tab-liquidations', popover: { title: t('tour.property_detail.liquidations_title'), description: t('tour.property_detail.liquidations_desc'), side: "bottom" as Side } }
        ];

        const settingsSteps: DriveStep[] = [
            { element: '#tab-branding', popover: { title: t('tour.settings_page.branding_title'), description: t('tour.settings_page.branding_desc'), side: "bottom" as Side } },
            { element: '#tab-team', popover: { title: t('tour.settings_page.team_title'), description: t('tour.settings_page.team_desc'), side: "bottom" as Side } },
            { element: '#tab-owners', popover: { title: t('tour.settings_page.owners_title'), description: t('tour.settings_page.owners_desc'), side: "bottom" as Side } },
            { element: '#tab-templates', popover: { title: t('tour.settings_page.templates_title'), description: t('tour.settings_page.templates_desc'), side: "bottom" as Side } }
        ];

        let finalSteps = mainSteps;
        if (type === 'property' || isPropertyDetailPage) {
            finalSteps = propertySteps;
        } else if (type === 'settings' || pathname === '/settings') {
            finalSteps = settingsSteps;
        }

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            popoverClass: 'driverjs-theme',
            nextBtnText: t('common.next') || 'Siguiente',
            prevBtnText: t('common.back') || 'Anterior',
            doneBtnText: (() => {
                if (type === 'main' && !isPropertyDetailPage) return t('navigation.properties') || 'Ir a Propiedades';
                if (type === 'property' || isPropertyDetailPage) return t('tour.property_detail.done_button') || 'Continuar';
                return t('common.close') || 'Finalizar';
            })(),
            steps: finalSteps,
            onDestroyStarted: () => {
                const isMainTour = type === 'main' && pathname === '/';
                const isPropertyTour = type === 'property' || isPropertyDetailPage;
                const isSettingsTour = type === 'settings' || pathname === '/settings';

                driverObj.destroy();

                if (isMainTour) {
                    localStorage.setItem('regentum_tour_redirect_to_props', 'true');
                    setTimeout(() => { router.push('/properties'); }, 200);
                } else if (isPropertyTour) {
                    localStorage.setItem('regentum_tour_redirect_to_settings', 'true');
                    setTimeout(() => { router.push('/settings'); }, 200);
                } else if (isSettingsTour) {
                    localStorage.removeItem('regentum_tour_manual_active');
                }
            }
        });

        driverObj.drive();
    }, [t, isPersonalFlavor, pathname, router, isMobile]);

    useEffect(() => {
        if (activeRole !== 'admin') return;

        const handleManualTour = () => {
            localStorage.setItem('regentum_tour_manual_active', 'true');
            if (pathname !== '/') { router.push('/'); } else { startTour('main'); }
        };
        
        window.addEventListener('start-product-tour', handleManualTour);

        const isManualActive = localStorage.getItem('regentum_tour_manual_active') === 'true';
        const needsRedirectToProps = localStorage.getItem('regentum_tour_redirect_to_props') === 'true';
        const needsRedirectToSettings = localStorage.getItem('regentum_tour_redirect_to_settings') === 'true';

        if (isManualActive && pathname === '/') { 
            startTour('main'); 
        }

        if (isManualActive && needsRedirectToProps && pathname === '/properties') {
            localStorage.removeItem('regentum_tour_redirect_to_props');
            setTimeout(() => {
                const d = driver({
                    popoverClass: 'driverjs-theme',
                    steps: [{
                        element: isMobile ? '#nav-properties-mobile' : '#nav-properties',
                        popover: {
                            title: t('tour.properties.title'),
                            description: t('tour.properties.continue_desc'),
                            side: (isMobile ? "top" : "right") as Side
                        }
                    }]
                });
                d.drive();
            }, 1000);
        }

        const isPropertyDetail = pathname.startsWith('/properties/') && pathname.length > 12;
        if (isManualActive && isPropertyDetail) {
            startTour('property');
        }

        if (isManualActive && needsRedirectToSettings && pathname === '/settings') {
            localStorage.removeItem('regentum_tour_redirect_to_settings');
            startTour('settings');
        }

        const tourSeen = localStorage.getItem('regentum_tour_seen_v1');
        if (!tourSeen && pathname === '/' && !isManualActive) {
            setTimeout(() => {
                startTour('main');
                localStorage.setItem('regentum_tour_seen_v1', 'true');
            }, 2000);
        }

        return () => window.removeEventListener('start-product-tour', handleManualTour);
    }, [activeRole, startTour, pathname, router, t, isMobile]);

    return null;
}
