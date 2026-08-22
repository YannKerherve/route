import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-route',
    version: '0.4.1',
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
