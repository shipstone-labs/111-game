export function onRequest() {
  return new Response(JSON.stringify([{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.game111.app",
      "sha256_cert_fingerprints": ["F4:3E:9E:41:92:46:65:8A:9A:7B:34:F8:3A:E9:28:B1:06:F7:2E:3E:FA:BC:1D:F1:E3:49:F5:6E:40:0F:2F:D3"]
    }
  }], null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
