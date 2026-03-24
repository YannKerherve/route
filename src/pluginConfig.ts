import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-route',
    version: '0.0.1',
    icon: '🗺️',
    title: 'Route',
    description: 'Export your CSV from tactics and display it on windy',
    author: 'Yann Kerherve (ENSM)',
    repository: 'https://github.com/YannKerherve/route',
    desktopUI: 'embedded',
    mobileUI: 'small',
    routerPath: '/my-plugin',
}; 

export default config;
