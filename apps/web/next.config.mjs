/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ให้ Next.js compile package แชร์จาก workspace ได้ (จำเป็นสำหรับ monorepo)
  transpilePackages: ["@easyprint/shared"],
};

export default nextConfig;
