# -------------------------- Dev ---------------------------------------

FROM node:22-bullseye AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g yarn@1.22.19 --force \
    && git config --global --add safe.directory /code

WORKDIR /code

# Build stage for web app
FROM dev AS web-app-serve-build

COPY ./package.json ./yarn.lock /code/

RUN yarn install
COPY . /code/

ENV VITE_FIREBASE_API_KEY=ExampleF1rebaseAP1k3y
ENV VITE_FIREBASE_AUTH_DOMAIN=example-key.firebaseapp.com
ENV VITE_FIREBASE_DATABASE_URL=https://example-database.firebaseio.com
ENV VITE_FIREBASE_PROJECT_ID=example
ENV VITE_FIREBASE_STORAGE_BUCKET=example.appspot.com
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=123123456123
ENV VITE_FIREBASE_APP_ID=1:23456789:web:1abc234def567
ENV VITE_COMMUNITY_DASHBOARD_URL=https://mapswipe.org

ENV VITE_FIREBASE_MEASUREMENT_ID=
ENV VITE_MAPILLARY_API_KEY=
ENV VITE_BASE_URL=https://mapswipe.org/privacy
ENV VITE_PRIVACY_POLICY_URL=https://mapswipe.org/privacy/
ENV VITE_IMPRINT_URL=https://mapswipe.org/privacy/
ENV VITE_APP_LOGO=./img/mapswipe-white.svg
ENV VITE_PROJECTS_FALLBACK_IMAGE=./img/map-pin-600x400.jpg
ENV VITE_ALLOW_UNVERIFIED_USERS=true

ENV VITE_DEFAULT_LOCALE=en
ENV VITE_FALLBACK_LOCALE=en
ENV VITE_SUPPORTED_LOCALES=en,de,fr

ENV VITE_THEME_LIGHT_PRIMARY=#060E2F
ENV VITE_THEME_LIGHT_SECONDARY=#0D1949
ENV VITE_THEME_LIGHT_TERTIARY=#EEF2FB
ENV VITE_THEME_LIGHT_ACCENT=#589AE3
ENV VITE_THEME_LIGHT_ERROR=#C62828
ENV VITE_THEME_LIGHT_WARNING=#8E0000
ENV VITE_THEME_LIGHT_INFO=#2196f3
ENV VITE_THEME_LIGHT_SUCCESS=#4caf50
ENV VITE_THEME_LIGHT_NEUTRAL=#272727

ENV VITE_APP_NAME=MapSwipe
ENV VITE_APP_WEBSITE_URL=https://mapswipe.org
ENV VITE_APP_ATTRIBUTION_TITLE=MapSwipe
ENV VITE_APP_ATTRIBUTION_URL=https://mapswipe.org/privacy/

RUN WEB_APP_SERVE_ENABLED=true yarn build-only --outDir=/code/build

FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL org.opencontainers.image.source="github.com/mapswipe/mapswipe-web"
LABEL org.opencontainers.image.authors="dev@togglecorp.com"

ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY ./web-app-serve/web-app-apply-config.sh /code/
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/code/web-app-apply-config.sh

COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"
