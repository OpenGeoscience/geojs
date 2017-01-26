/* global dnsDomainIs */

function FindProxyForURL(url, host) {
  // Don't serve certain remote addresses
  if (dnsDomainIs(host, 'fonts.googleapis.com')) {
    // If we use a testing address such as 192.0.2.0, requests will take a
    // long time to fail.  Using an address starting with 0 fails promptly.
    return 'PROXY 0.0.0.1';
  }
  // Redirect tiles to our test server
  if (dnsDomainIs(host, '.tile.openstreetmap.org')) {
    return 'PROXY 127.0.0.1:9876';
  }
  return 'DIRECT';
}
