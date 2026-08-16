import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads (documents, collaborator write-back) go up to 20 MB; default is 1 MB.
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
