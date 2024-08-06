const API_URL = process.env.NEXT_PUBLIC_URL

const nextConfig = {
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: `${API_URL}/:path*`,
			},
		]
	},
}

module.exports = nextConfig
