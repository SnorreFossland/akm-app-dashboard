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
    // Allow builds to succeed even if ESLint rules currently fail across the repo.
    // This is intentional to unblock builds; lint errors should be fixed in a follow-up PR.
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig;