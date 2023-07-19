/** @type {import('next').NextConfig} */
const nextConfig = {
      reactStrictMode: true,
}


// webpack config added because of socket.io module resolution bug:
// https://github.com/netlify/netlify-lambda/issues/179
module.exports = {
    ...nextConfig,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.externals.push({ bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate", "supports-color": "supports-color" }); 
        }

        return config;
    },
};
