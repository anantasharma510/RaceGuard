module.exports = {
  apps: [
    {
      name: 'engine',
      cwd: '/app/engine',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:/app/data/raceguard.db',
      },
    },
    {
      name: 'ui',
      cwd: '/app/ui',
      script: 'node_modules/.bin/next',
      args: 'start -p 3004',
      env: {
        NODE_ENV: 'production',
        PORT: '3004',
        NEXT_PUBLIC_ENGINE_URL: 'http://localhost:7842',
      },
    },
  ],
};
