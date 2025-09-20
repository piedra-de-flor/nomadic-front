module.exports = {
  apps: [{
    name: 'nomadic-front',
    script: 'npx',
    args: 'expo start --web --host 0.0.0.0 --port 3000',
    cwd: '/var/www/html/nomadic-front',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/nomadic-front-error.log',
    out_file: '/var/log/pm2/nomadic-front-out.log',
    log_file: '/var/log/pm2/nomadic-front.log',
    time: true
  }]
};
