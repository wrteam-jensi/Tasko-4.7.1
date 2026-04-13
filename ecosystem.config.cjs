/**
 * PM2 Ecosystem Configuration for Next.js Standalone Deployment
 * 
 * This configuration is used with the standalone output mode.
 * After running `npm run build`, the standalone server is available at:
 * .next/standalone/server.js
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart edemand-web
 *   pm2 stop edemand-web
 *   pm2 delete edemand-web
 */
module.exports = {
    apps: [
        {
            name: "edemand-web",
            script: ".next/standalone/server.js",
            cwd: "./",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
                PORT: 8002,
                HOSTNAME: "0.0.0.0"
            },
            // Restart on file changes (disabled for production)
            watch: false,
            // Memory restart threshold
            max_memory_restart: "500M",
            // Logging
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            log_file: "./logs/pm2-combined.log",
            time: true,
            // Restart behavior
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000
        }
    ]
};
