FROM nginx:1 AS web-app-serve

LABEL org.opencontainers.image.authors="dev@togglecorp.com" \
      org.opencontainers.image.source="https://github.com/toggle-corp/web-app-serve" \
      org.opencontainers.image.title="web-app-serve"

ARG BIOME_VERSION=2.0.6
ARG RIPGREP_VERSION=14.1.1
ARG JQ_VERSION=1.8.1

RUN mkdir /build && \
    # Installing ripgrep
    curl -L \
        -o /build/ripgrep.tar.gz \
        "https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_VERSION}/ripgrep-${RIPGREP_VERSION}-x86_64-unknown-linux-musl.tar.gz" && \
    mkdir "/build/ripgrep" && \
    tar xf "/build/ripgrep.tar.gz" --directory="/build/ripgrep" && \
    mv "$(find /build/ripgrep -type f -name rg)" "/usr/local/bin/rg" && \
    chmod +x "/usr/local/bin/rg" && \
    rg --version && \
    # Installing jq
    curl -L \
        -o /usr/local/bin/jq \
        "https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/jq-linux-amd64" && \
    chmod +x "/usr/local/bin/jq" && \
    jq --version && \
    # Installing biome
    curl -L \
         -o "/usr/local/bin/biome" \
        "https://github.com/biomejs/biome/releases/download/@biomejs/biome@${BIOME_VERSION}/biome-linux-x64" && \
    chmod +x "/usr/local/bin/biome" && \
    biome --version && \
    # Cleanup
    rm -rf /build

# NOTE: Used by apply-config.sh
ENV APPLY_CONFIG__ENABLE_DEBUG=false
ENV APPLY_CONFIG__DEBUG_USE_BIOME=true

ENV APPLY_CONFIG__DESTINATION_DIRECTORY=/usr/share/nginx/html/
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/web-app-serve/default-app-apply-config.sh

COPY ./src/ /web-app-serve/
RUN ln -sf /web-app-serve/apply-config.sh /docker-entrypoint.d/apply-config.sh && \
    mkdir /etc/nginx/templates && \
    ln -sf /web-app-serve/nginx.conf.template /etc/nginx/templates/default.conf.template

FROM web-app-serve AS web-app-serve-example

LABEL org.opencontainers.image.source="https://github.com/toggle-corp/web-app-serve"
LABEL org.opencontainers.image.authors="dev@togglecorp.com"

# Env for apply-config script
ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY ./example/source "$APPLY_CONFIG__SOURCE_DIRECTORY"