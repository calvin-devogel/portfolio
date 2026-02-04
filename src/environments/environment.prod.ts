export const environment = {
    production: true,
    // how can I pass this as an env variable??
    apiUrl: (window as any).__env?.apiUrl || ''
};
