
export const environment = {
  production: false,
  platform: 'mobile',
  apiUrl:'http://172.24.234.179:3000'
  // apiUrls: [
  //   'http://192.168.44.25:3000',    // Local LAN
  //   'http://172.24.234.179:3000', // Replace with your Tailscale server IP
  //   'http://26.131.195.44:3000'     // VPN fallback
  // ],
  // get apiUrl() {
  //   return this.apiUrls[1]; // Default to LAN
  // }
};
