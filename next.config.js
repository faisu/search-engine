/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Ignore .node files completely - they're native bindings
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\.node$/,
        })
      );
      
      // Make @napi-rs/canvas external so it's not bundled
      config.externals = config.externals || [];
      config.externals.push('@napi-rs/canvas');
    }
    
    return config;
  },
}

module.exports = nextConfig


