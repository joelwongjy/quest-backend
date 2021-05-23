module.exports = {
  apps: [
    {
      name: "staging",
      script: "./src/index.js",
      env: {
        NODE_ENV: "staging",
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "production",
      script: "./src/index.js",
      env: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
