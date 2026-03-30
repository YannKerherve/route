import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-route',
    version: '0.0.2',
    icon: '🗺️',
    title: 'Boat Route Tracker',
    description: 'Export your CSV files from Tactics and Simsail, then display them on Windy. If you require a different CSV type, please contact me with an example or a licence for the relevant software.',
    author: 'Yann Kerherve (ENSM)',
    repository: 'https://github.com/YannKerherve/route',
    desktopUI: 'embedded',
    mobileUI: 'small',
    routerPath: '/my-plugin',
}; 

export default config;
