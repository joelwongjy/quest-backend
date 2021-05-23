module.exports = {
  apps: [
    {
      name: "staging",
      script: "./src/index.js",
      env: {
        NODE_ENV: "staging",
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
