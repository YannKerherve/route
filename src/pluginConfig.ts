import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'nav-tools',
    version: '0.3.8',
    icon: '🗺️',
    title: 'Nav Tools',
    description: 'Display worldwide nautical charts, Measure distances and bearings, Upload and display routes, Add manual waypoints and points',
    author: 'Yann Kerherve (ENSM)',
    repository: 'https://github.com/YannKerherve/route',
    desktopUI: 'embedded',
    mobileUI: 'small',
    routerPath: '/my-plugin',
}; 

export default config;
