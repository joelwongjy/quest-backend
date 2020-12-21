module.exports = {
  apps: [
    {
      name: "staging",
      script: "build/index.js",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "production",
      script: "build/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
