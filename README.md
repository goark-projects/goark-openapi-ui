# Goark OpenAPI UI

[简体中文](README.zh-CN.md)

A maintained Knife4j fork for **OpenAPI 3.2.0**, serving one Goark application and its local groups. No Java service, external CDN, Swagger UI, gateway aggregation or OAuth flow is required.

The active application is in `knife4j-vue3`. Its layout, type display and editor were adapted from the Knife4j v4.5.0 sources; historical upstream modules remain for provenance and are excluded from the build. See [NOTICE](NOTICE).

## Development

Requires Node.js 24.

```sh
cd knife4j-vue3
npm ci
npm test
npm run dev
npm run build
npm run package
```

When a proxy is needed, pass `--proxy=http://172.16.8.171:9444 --https-proxy=http://172.16.8.171:9444` to npm in your own environment. No proxy setting is persisted by this project.

The Go module embeds the compiled assets, so application users do not install Node or build this repository. Release packages contain a source commit, upstream reference, protocol version, OpenAPI support declaration, SHA-256 checksums and license notices.

## Features

- Chinese and English controls; local groups, tag hierarchy and search.
- Native 3.2 models: references, unions, null, compositions, tuples and examples.
- Parameters, JSON, forms, multipart files and JSON parts.
- Basic, Bearer and custom-header API credentials, kept in page memory.
- Separate documentation credentials; cURL credentials are redacted by default.
- Response status, headers, body and elapsed time; JSON/YAML download.
- QUERY and additional operations can be displayed; execution still depends on browser and application support.

Browser-managed cookies cannot be replaced by a custom Cookie header. Sign in to the application normally to use its session. Remote documentation and remote API origins are intentionally rejected.

## Bootstrap protocol

`/openapi-ui/config` returns `protocolVersion: 1`, `openapi: "3.2.0"`, language, local document URLs and the debugging flag. It contains no configured passwords or tokens. The server supplies context-path metadata in the HTML shell.

Apache-2.0. Upstream and third-party notices are preserved in release assets.
