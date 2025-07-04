import { navigationData } from '@/data/navigationData';

export function getCurrentMenuItemDescription(pathname: string): string {
    // Search through all navigation items to find the matching URL
    const allItems = [
        ...navigationData.navMimris.flatMap(section => section.items || []),
        ...navigationData.navMain.flatMap(section => section.items || [])
    ];

    const currentItem = allItems.find(item => item.url === pathname);
    return currentItem?.description || '';
}

export function getCurrentMenuItem(pathname: string) {
    const allItems = [
        ...navigationData.navMimris.flatMap(section => section.items || []),
        ...navigationData.navMain.flatMap(section => section.items || [])
    ];

    return allItems.find(item => item.url === pathname);
}