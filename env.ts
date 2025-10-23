import {
    defineConfig,
    overrideDefineForWebAppServe,
    Schema,
} from '@togglecorp/vite-plugin-validate-env';

const webAppServeEnabled = process.env.WEB_APP_SERVE_ENABLED?.toLowerCase() === 'true';
if (webAppServeEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Building application for web-app-serve');
}
const overrideDefine = webAppServeEnabled
    ? overrideDefineForWebAppServe
    : undefined;

export default defineConfig({
    overrideDefine,
    validator: 'builtin',
    schema: {
        VITE_FIREBASE_API_KEY: Schema.string.optional(),
        VITE_FIREBASE_AUTH_DOMAIN: Schema.string.optional(),
        VITE_FIREBASE_DATABASE_URL: Schema.string({ format: 'url', protocol: true, tld: false }),
        VITE_FIREBASE_PROJECT_ID: Schema.string.optional(),
        VITE_FIREBASE_STORAGE_BUCKET: Schema.string.optional(),
        VITE_FIREBASE_MESSAGING_SENDER_ID: Schema.string.optional(),
        VITE_FIREBASE_APP_ID: Schema.string.optional(),
        VITE_FIREBASE_MEASUREMENT_ID: Schema.string.optional(),
        VITE_BASE_URL: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        VITE_PRIVACY_POLICY_URL: Schema.string({ format: 'url', protocol: true, tld: false }),
        VITE_IMPRINT_URL: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        VITE_APP_NAME: Schema.string.optional(),
        VITE_APP_ATTRIBUTION_TITLE: Schema.string.optional(),
        VITE_APP_ATTRIBUTION_URL: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        VITE_APP_WEBSITE_URL: Schema.string({ format: 'url', protocol: true, tld: false }),
        VITE_APP_LOGO: Schema.string.optional(),
        VITE_PROJECTS_FALLBACK_IMAGE: Schema.string.optional(),
        VITE_ALLOW_UNVERIFIED_USERS: Schema.boolean(),

        VITE_DEFAULT_LOCALE: Schema.string.optional(),
        VITE_FALLBACK_LOCALE: Schema.string.optional(),
        VITE_SUPPORTED_LOCALES: Schema.string.optional(),

        VITE_THEME_LIGHT_PRIMARY: Schema.string.optional(),
        VITE_THEME_LIGHT_SECONDARY: Schema.string.optional(),
        VITE_THEME_LIGHT_TERTIARY: Schema.string.optional(),
        VITE_THEME_LIGHT_ACCENT: Schema.string.optional(),
        VITE_THEME_LIGHT_ERROR: Schema.string.optional(),
        VITE_THEME_LIGHT_WARNING: Schema.string.optional(),
        VITE_THEME_LIGHT_INFO: Schema.string.optional(),
        VITE_THEME_LIGHT_SUCCESS: Schema.string.optional(),
        VITE_THEME_LIGHT_NEUTRAL: Schema.string.optional(),

        VITE_COMMUNITY_DASHBOARD_URL: Schema.string({ format: 'url', protocol: true, tld: false }),

        VITE_MAPILLARY_API_KEY: Schema.string.optional(),
    },
});
