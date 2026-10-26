// Linux and DevOps command reference: { category, icon, commands: [{ cmd, desc }] }
const linuxCheatSheets = [
    {
        category: 'Linux Commands',
        icon: '🐧',
        commands: [
            { cmd: 'ls -la', desc: 'List all files including hidden files' },
            { cmd: 'pwd', desc: 'Show current working directory' },
            { cmd: 'cd /var/log', desc: 'Change directory' },
            { cmd: 'mkdir test', desc: 'Create new directory' },
            { cmd: 'rm -rf folder', desc: 'Delete directory recursively' },
            { cmd: 'cp file1 file2', desc: 'Copy files' },
            { cmd: 'mv file1 file2', desc: 'Move or rename files' },
            { cmd: 'touch file.txt', desc: 'Create empty file' },
            { cmd: 'cat file.txt', desc: 'Read file contents' },
            { cmd: 'grep error log.txt', desc: 'Search text pattern' }
        ]
    },
    {
        category: 'SSH',
        icon: '🔐',
        commands: [
            { cmd: 'ssh user@server', desc: 'Connect remote server' },
            { cmd: 'ssh-keygen', desc: 'Generate SSH keys' },
            { cmd: 'scp file server:/tmp', desc: 'Upload file securely' },
            { cmd: 'scp server:/tmp/file .', desc: 'Download remote file' },
            { cmd: 'ssh-copy-id user@host', desc: 'Copy SSH key' },
            { cmd: 'chmod 600 authorized_keys', desc: 'Set SSH permission' },
            { cmd: 'ssh-add', desc: 'Add SSH key agent' },
            { cmd: 'ssh -p 2222 user@host', desc: 'Connect custom SSH port' }
        ]
    },
    {
        category: 'Networking',
        icon: '🌐',
        commands: [
            { cmd: 'ip addr show', desc: 'Show IP address' },
            { cmd: 'ping google.com', desc: 'Test connectivity' },
            { cmd: 'traceroute google.com', desc: 'Trace route path' },
            { cmd: 'ss -tulpn', desc: 'List listening ports' },
            { cmd: 'netstat -tulpn', desc: 'Show active connections' },
            { cmd: 'tcpdump -i eth0', desc: 'Capture packets' },
            { cmd: 'curl https://site.com', desc: 'Fetch URL' },
            { cmd: 'wget file.zip', desc: 'Download file' }
        ]
    },
    {
        category: 'Docker',
        icon: '🐳',
        commands: [
            { cmd: 'docker ps', desc: 'List running containers' },
            { cmd: 'docker images', desc: 'List images' },
            { cmd: 'docker run nginx', desc: 'Run container' },
            { cmd: 'docker logs container', desc: 'View logs' },
            { cmd: 'docker exec -it c bash', desc: 'Open shell' },
            { cmd: 'docker stop container', desc: 'Stop container' },
            { cmd: 'docker restart container', desc: 'Restart container' }
        ]
    },
    {
        category: 'Kubernetes',
        icon: '☸️',
        commands: [
            { cmd: 'kubectl get pods', desc: 'List pods' },
            { cmd: 'kubectl get nodes', desc: 'List cluster nodes' },
            { cmd: 'kubectl logs pod', desc: 'View pod logs' },
            { cmd: 'kubectl describe pod', desc: 'Describe pod' },
            { cmd: 'kubectl apply -f app.yaml', desc: 'Deploy manifest' },
            { cmd: 'kubectl delete pod pod1', desc: 'Delete pod' }
        ]
    },
    {
        category: 'GPU',
        icon: '🖥️',
        commands: [
            { cmd: 'nvidia-smi', desc: 'GPU usage monitor' },
            { cmd: 'watch -n 1 nvidia-smi', desc: 'Live GPU monitoring' },
            { cmd: 'nvcc --version', desc: 'CUDA version' },
            { cmd: 'nvidia-smi pmon', desc: 'GPU process monitor' },
            { cmd: 'nvidia-smi dmon', desc: 'GPU device monitor' }
        ]
    },
    {
        category: 'MySQL / MariaDB',
        icon: '🗄️',
        commands: [
            { cmd: 'mysql -u root -p', desc: 'Login MySQL' },
            { cmd: 'SHOW DATABASES;', desc: 'List databases' },
            { cmd: 'SHOW TABLES;', desc: 'List tables' },
            { cmd: 'SELECT * FROM users;', desc: 'Read data' },
            { cmd: 'mysqldump db > backup.sql', desc: 'Backup database' },
            { cmd: 'FLUSH PRIVILEGES;', desc: 'Reload privileges' }
        ]
    },
    {
        category: 'Storage',
        icon: '💾',
        commands: [
            { cmd: 'df -h', desc: 'Disk usage' },
            { cmd: 'du -sh /var/log', desc: 'Directory size' },
            { cmd: 'lsblk', desc: 'Block devices' },
            { cmd: 'fdisk -l', desc: 'Partition details' },
            { cmd: 'mount /dev/sdb1 /mnt', desc: 'Mount disk' },
            { cmd: 'umount /mnt', desc: 'Unmount disk' }
        ]
    },
    {
        category: 'Syslog & Crash',
        icon: '📄',
        commands: [
            { cmd: 'journalctl -xe', desc: 'System logs' },
            { cmd: 'dmesg -T', desc: 'Kernel logs' },
            { cmd: 'tail -f /var/log/syslog', desc: 'Watch logs live' },
            { cmd: 'free -h', desc: 'Memory usage' },
            { cmd: 'uptime', desc: 'System uptime' },
            { cmd: 'top', desc: 'System process monitor' }
        ]
    }
];

export default linuxCheatSheets;
