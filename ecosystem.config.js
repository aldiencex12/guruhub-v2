module.exports = {
  apps: [
    {
      name: "guruhub-api",
      cwd: "./guruhub-api",
      script: "src/index.ts",
      interpreter: "bun",
      max_memory_restart: "1500M",
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "front-guruhub",
      cwd: "./front-guruhub",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      max_memory_restart: "2000M",
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "front-guruhub-mobile",
      cwd: "./front-guruhub-mobile",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      max_memory_restart: "1500M",
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};

