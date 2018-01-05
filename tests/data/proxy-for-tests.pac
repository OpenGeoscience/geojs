/* global dnsDomainIs */

function FindProxyForURL(url, host) {
  // Redirect tiles to our test server
  if (dnsDomainIs(host, '.tile.openstreetmap.org')) {
    return 'PROXY 127.0.0.1:9876';
  }
  return 'DIRECT';
}
