/** @type {import('next').NextConfig} */
const nextConfig = {
    // ...existing config...
    webpack: (config, { isServer }) => {
        // Add specific rule for Font Awesome
        config.module.rules.push({
            test: /node_modules\/@fortawesome\/fontawesome-free\/css\/.*\.css$/,
            use: ['style-loader', 'css-loader'],
        });

        // Disable the webpack cache
        config.cache = false;

        return config;
    },
}

module.exports = nextConfig;