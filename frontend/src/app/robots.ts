import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/company/',
                '/student/',
                '/api/',
                '/maintenance',
                '/login',
                '/signup',
                '/forgot-password',
                '/reset-password'
            ],
        },
        sitemap: 'https://acadintern.mathi.live/sitemap.xml',
    };
}
