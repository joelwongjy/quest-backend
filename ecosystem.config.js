module.exports = {
  apps: [
    {
      name: "staging",
      script: "./src/index.js",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "production",
      script: "./src/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
