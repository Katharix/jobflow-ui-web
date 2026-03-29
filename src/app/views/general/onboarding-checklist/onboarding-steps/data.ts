export interface PaymentProvider {
    logoPath: string;
    provider: 'Stripe' | 'Square';
    description: string;
    altLogoText: string;
}

export const PaymentProviders: PaymentProvider[] = [
    {
        provider: 'Stripe',
        logoPath: 'assets/admin/images/photos/StripeLogo.png',
        description: 'Connect your Stripe account to start accepting online payments directly from your clients.\nIt\'s fast, secure, and essential for invoicing through the platform.',
        altLogoText: 'Stripe Logo'
    },
    {
        provider: 'Square',
        logoPath: 'assets/admin/images/photos/Square_LogoLockup_Black.png',
        description: 'Connect your Square account to start accepting online payments directly from your clients.\nIt\'s quick, secure, and fully integrated with your invoicing workflow.',
        altLogoText: 'Square Logo'
    }
];