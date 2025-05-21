/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  env: {
    UPLOADTHING_TOKEN:
      'eyJhcGlLZXkiOiJza19saXZlX2Y3YTQyMDQ4ZTkwN2Y1YWVjZGM5ZTFmMzdiMzAzYTRlNDUwNjY4MzNlZGQ5NjEwMWI5N2U5MzBlOGE4ZmJiNDMiLCJhcHBJZCI6ImhqdmN5MTRqa3QiLCJyZWdpb25zIjpbInNlYTEiXX0=',
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
  },
};

export default nextConfig;
