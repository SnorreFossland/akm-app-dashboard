/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Add specific rule for Font Awesome
        config.module.rules.push({
            test: /node_modules\/@fortawesome\/fontawesome-free\/css\/.*\.css$/,
            use: ['style-loader', 'css-loader'],
        });

        return config;
    },
    // Remove conflicting experimental options
    transpilePackages: ['class-variance-authority'],
    eslint: {
        // Warning: this will skip lint checks during build on Vercel
        ignoreDuringBuilds: true
    }
}

module.exports = nextConfig;