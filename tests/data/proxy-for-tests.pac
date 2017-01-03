function FindProxyForURL(url, host) {
 // Don't serve certain remote addresses
 if (dnsDomainIs(host, "fonts.googleapis.com")) {
   return "PROXY http://192.0.2.0";
 }
 return "DIRECT";
}
