module.exports = {
  webpack: {
    configure: {
      devServer: {
        hot: true,
        liveReload: true,
        client: {
          overlay: false,
        },
      },
    },
  },
}; 