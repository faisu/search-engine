/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable standalone for Railway - use regular next start
  // output: 'standalone',
  
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Make @napi-rs/canvas external so it's not bundled
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals].filter(Boolean)),
        function ({ request, context }, callback) {
          // Externalize @napi-rs/canvas package
          if (request === '@napi-rs/canvas') {
            return callback(null, 'commonjs ' + request);
          }
          
          // Externalize any .node files (native bindings)
          if (/\.node$/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
          
          // Externalize native bindings from @napi-rs/canvas subpackages
          if (request && (request.includes('@napi-rs/canvas') || request.includes('skia.') || request.includes('canvas-'))) {
            return callback(null, 'commonjs ' + request);
          }
          
          callback();
        },
      ];
      
      // Ignore .node files completely - must be added before other plugins
      if (!config.plugins) {
        config.plugins = [];
      }
      
      // Remove any existing IgnorePlugin for .node files to avoid conflicts
      config.plugins = config.plugins.filter(
        (plugin) => !(plugin instanceof webpack.IgnorePlugin && plugin.options && plugin.options.resourceRegExp && /\.node$/.test(plugin.options.resourceRegExp.toString()))
      );
      
      // Add our IgnorePlugin
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource, context) {
            // Ignore .node files
            if (/\.node$/.test(resource)) {
              return true;
            }
            // Ignore native bindings in @napi-rs/canvas
            if (context && (context.includes('@napi-rs/canvas') || context.includes('canvas-'))) {
              if (/skia|binding|\.node/.test(resource)) {
                return true;
              }
            }
            return false;
          },
        })
      );
    }
    
    return config;
  },
}

module.exports = nextConfig


