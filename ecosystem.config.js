
module.exports = {
  apps: [
    {
      name: 'margiet-app',
      script: './dist/main.js',
      instances: '2',
      exec_mode: 'cluster',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      pid_file: './pids/pm2.pid',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
