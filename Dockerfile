# -------------------------- Dev ---------------------------------------

FROM node:22-bullseye AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    # NOTE: yarn > 1.22.19 breaks yarn-install invoked by yarn
    && npm install -g yarn@8.6.0 yarn@1.22.19 --force \
    && git config --global --add safe.directory /code

WORKDIR /code

# Build stage for web app
FROM dev AS web-app-serve-build

COPY ./package.json /code/

RUN yarn install

COPY . /code/

# NOTE: These are set directly in `vite.config.ts`
# We're using raw web-app-serve placeholder values here to treat them as dynamic values
# NOTE: Static env variables:
# These env variables are used during build

ENV VITE_FIREBASE_API_KEY=AIzaSyBuvneRh621iQkac31JNKWOYElhpRA_XYM
ENV VITE_FIREBASE_AUTH_DOMAIN=tc-mapswipe-alpha-2.firebaseapp.com
ENV VITE_FIREBASE_DATABASE_URL=https://tc-mapswipe-alpha-2-default-rtdb.asia-southeast1.firebasedatabase.app
ENV VITE_FIREBASE_PROJECT_ID=tc-mapswipe-alpha-2
ENV VITE_FIREBASE_STORAGE_BUCKET=tc-mapswipe-alpha-2.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=1054350869566
ENV VITE_FIREBASE_APP_ID=1:1054350869566:web:0390a3e635ec6f00d4bd6f
ENV VITE_FIREBASE_MEASUREMENT_ID=123

ENV VITE_COMMUNITY_DASHBOARD_URL=https://community.mapswipe.org
ENV VITE_BASE_URL=https://mapswipe.org/privacy/
ENV VITE_PRIVACY_POLICY_URL=https://mapswipe.org/privacy/
ENV VITE_IMPRINT_URL=https://mapswipe.org/privacy/
ENV VITE_APP_LOGO=./img/mapswipe-white.svg
ENV VITE_PROJECTS_FALLBACK_IMAGE=./img/map-pin-600x400.jpg
ENV VITE_ALLOW_UNVERIFIED_USERS=true

# Locales
ENV VITE_DEFAULT_LOCALE=en
ENV VITE_FALLBACK_LOCALE=en
ENV VITE_SUPPORTED_LOCALES=en,de,fr

# Theme
ENV VITE_THEME_LIGHT_PRIMARY=#060E2F
ENV VITE_THEME_LIGHT_SECONDARY=#0D1949
ENV VITE_THEME_LIGHT_TERTIARY=#EEF2FB
ENV VITE_THEME_LIGHT_ACCENT=#589AE3
ENV VITE_THEME_LIGHT_ERROR=#C62828
ENV VITE_THEME_LIGHT_WARNING=#8E0000
ENV VITE_THEME_LIGHT_INFO=#2196f3
ENV VITE_THEME_LIGHT_SUCCESS=#4caf50
ENV VITE_THEME_LIGHT_NEUTRAL=#272727

# App Attribution
ENV VITE_APP_NAME=MapSwipe
ENV VITE_APP_WEBSITE_URL=https://mapswipe.org
ENV VITE_APP_ATTRIBUTION_TITLE=MapSwipe
ENV VITE_APP_ATTRIBUTION_URL=https://mapswipe.org/privacy/

RUN WEB_APP_SERVE_ENABLED=true yarn build-only --outDir=/code/build

LABEL maintainer="Togglecorp"
LABEL org.opencontainers.image.source="github.com/mapswipe/mapswipe-web"

FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

# Env for apply-config script
ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"
