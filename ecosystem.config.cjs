module.exports = {
  apps: [
    {
      name: "ternakku-api",
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "500M",
    },
  ],
};