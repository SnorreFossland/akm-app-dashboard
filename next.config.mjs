/** @type {import('next').NextConfig} */
const nextConfig = {
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    }
};
export default nextConfig;
