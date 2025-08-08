#!/bin/env bash

set -xe

while IFS='=' read -r KEY VALUE; do
    # FIXME: If js and value is empty string, replace it with undefined?
    find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$VALUE|g" {} +
done < <(env | grep '^VITE_')