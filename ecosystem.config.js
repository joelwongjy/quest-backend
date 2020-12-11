module.exports = {
  apps: [
    {
      name: "quest-backend",
      script: "build/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
