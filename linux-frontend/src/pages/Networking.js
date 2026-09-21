
function Networking() {

    return (

        <div className='max-w-6xl mx-auto py-10 px-6'>

            <h1 className='text-5xl font-bold mb-8'>

                Linux Networking

            </h1>

            <pre className='bg-black text-green-400 p-6 rounded-2xl overflow-auto'>

{`

Linux networking commands allow you to configure network interfaces, troubleshoot connectivity, and monitor data traffic 
directly from the terminal.While older tools like ifconfig are still common, modern Linux distributions favor the ip suite
for more robust management.

Essential Connectivity & Troubleshooting

ping: Tests connectivity between two nodes by sending ICMP echo requests. It is the most common way to check if a remote server is reachable.

traceroute: Displays the path packets take to reach a destination, showing each "hop" (router) along the way.

mtr: A real-time diagnostic tool that combines the functionality of ping and traceroute.

nc (Netcat): Often called the "Swiss Army knife" of networking, it is used for port scanning, port listening, and basic data transfer. 

ip: The modern replacement for many legacy tools. Common subcommands include:

ip addr: Displays all network interfaces and their assigned IP addresses.

ip route: Shows and manages the system's routing table.

ip link set [interface] up/down: Enables or disables a specific network interface.

ifconfig: A legacy command used to view or configure network interfaces. It provides similar information to ip addr but in a different format.

nmcli: A command-line tool for controlling NetworkManager, commonly used for managing Wi-Fi and Ethernet profiles on desktop systems.

Monitoring & Statistics
==========   ==========
ss: The modern replacement for netstat. It provides detailed statistics on network sockets, including which ports are listening and which connections are active.

netstat: An older utility that displays network connections, routing tables, and interface statistics.

tcpdump: A powerful packet analyzer that allows you to capture and inspect real-time network traffic at a granular level.

iftop: Provides a real-time view of bandwidth usage per network interface, similar to how top works for CPU usage. 

DNS & Name Resolution
====================
dig: The preferred tool for DNS lookups. It provides detailed responses from DNS servers, useful for troubleshooting domain name issues.

nslookup: An older, simpler tool for querying DNS records to find the IP address associated with a domain.

host: A quick utility for performing DNS lookups (e.g., converting a hostname to an IP address or vice versa). 

Remote Access & File Transfer 
=============================
ssh: Securely logs into remote systems over an encrypted connection.

scp / rsync: Tools for securely copying or synchronizing files between local and remote machines.

curl / wget: Commands used to download files or interact with web services (API testing) directly from the terminal. 

`}
            </pre>

        </div>
    );
}

export default Networking;
