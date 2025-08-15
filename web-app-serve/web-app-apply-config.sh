#!/bin/env bash

set -xe

while IFS='=' read -r KEY VALUE; do
    REPLACEMENT="${VALUE:-undefined}"
    find "$DESTINATION_DIRECTORY" -type f \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$REPLACEMENT|g" {} +
done < <(env | grep '^VITE_')
