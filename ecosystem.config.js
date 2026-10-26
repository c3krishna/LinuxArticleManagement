// pm2 process for the API. Start or reload with: pm2 startOrReload ecosystem.config.js --update-env
module.exports = {
    apps: [
        {
            name: 'linux',
            cwd: `${__dirname}/linux-api`,
            script: 'linux.js',
            exec_mode: 'fork',
            instances: 1, // the scheduler publishes due articles, so exactly one process must run
            max_memory_restart: '400M',
            time: true
        }
    ]
};
