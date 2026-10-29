// Generator for 100 Operating Systems, Networks & Cybersecurity Questions
const fs = require('fs');

const systemsQuestions = [
  // 1-25: Operating Systems & Virtual Memory
  {
    id: "sys_001",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is Virtual Memory in modern computer operating systems?",
    options: ["A memory management technique that provides each process with an isolated, contiguous address space mapped to physical RAM and disk swap", "Virtual reality headset RAM", "Memory shared across cloud servers", "An emulator for old 16-bit games"],
    correct: 0,
    explanation: "Virtual memory isolates processes, prevents accidental memory corruption across programs, and allows total allocated memory to exceed physical RAM."
  },
  {
    id: "sys_002",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What hardware cache speeds up virtual-to-physical memory address translation in modern CPUs?",
    options: ["Translation Lookaside Buffer (TLB)", "L1 Data Cache", "Instruction Register", "Arithmetic Logic Unit (ALU)"],
    correct: 0,
    explanation: "The TLB is an ultra-fast hardware MMU associative cache that stores recent virtual-to-physical page mappings, avoiding multi-level page table walks."
  },
  {
    id: "sys_003",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is a 'Page Fault' in an operating system?",
    options: ["An interrupt raised by hardware when a program accesses a virtual memory page not currently mapped into physical RAM", "A hardware defect on a RAM stick", "A printing error in a network printer", "A syntax error in source code"],
    correct: 0,
    explanation: "When a page fault occurs, the OS kernel traps the interrupt, loads the required page from disk (swap or executable binary) into RAM, and resumes the thread."
  },
  {
    id: "sys_004",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is 'Thrashing' in operating systems?",
    options: ["A state where the OS spends more time swapping pages in and out of disk than executing actual instructions due to severe RAM exhaustion", "Violent hard drive vibrations", "Overclocking the CPU to extreme speeds", "A type of denial of service attack"],
    correct: 0,
    explanation: "Thrashing occurs when active working sets exceed physical memory, causing continuous page faults that plummet CPU utilization to near zero."
  },
  {
    id: "sys_005",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "In Linux/Unix, what does the `fork()` system call do?",
    options: ["Creates a new child process that is an exact duplicate of the calling parent process with an independent address space", "Splits a file into two separate files", "Connects to a Git repository branch", "Creates a background thread in the same process"],
    correct: 0,
    explanation: "fork() duplicates the parent process using Copy-On-Write (COW), returning 0 to the child and the child's PID to the parent."
  },
  {
    id: "sys_006",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Copy-On-Write (COW) optimization during process `fork()`?",
    options: ["Parent and child initially share the exact same physical memory pages read-only; a private copy of a page is made only when either process modifies it", "A feature in text editors to backup files", "A printer spooling protocol", "A hardware RAID technique"],
    correct: 0,
    explanation: "COW prevents allocating unnecessary duplicate memory pages during fork(), making process creation near-instantaneous especially when followed by exec()."
  },
  {
    id: "sys_007",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What Unix system call replaces the current process image, code, stack, and heap with a completely new executable program?",
    options: ["execve() (or exec family)", "fork()", "spawn()", "clone()"],
    correct: 0,
    explanation: "execve() loads and executes a new binary inside the existing process, retaining the PID and file descriptors unless marked close-on-exec."
  },
  {
    id: "sys_008",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an Inode in Unix/Linux file systems?",
    options: ["A data structure that stores metadata about a file (size, permissions, timestamps, block pointers) except its filename and file contents", "The root directory of a hard drive", "An internet network node", "A database index table"],
    correct: 0,
    explanation: "Inodes store all file attributes and physical data block addresses. Directories are simply lists mapping filenames to inode numbers."
  },
  {
    id: "sys_009",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the difference between a Hard Link and a Soft Link (Symbolic Link) in Linux?",
    options: ["A hard link points directly to the same inode number; a soft link is a distinct file holding the path string of another file", "A soft link points to the inode; a hard link points to the filename", "Hard links can cross different file systems; soft links cannot", "Hard links are deleted when the original file is renamed"],
    correct: 0,
    explanation: "Hard links share the same inode and data blocks; deleting the original filename does not destroy data as long as one hard link remains."
  },
  {
    id: "sys_010",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What CPU scheduling algorithm gives each process a small fixed slice of CPU time (time quantum) in cyclic order?",
    options: ["Round Robin (RR)", "First-Come, First-Served (FCFS)", "Shortest Job First (SJF)", "Priority Scheduling without preemption"],
    correct: 0,
    explanation: "Round Robin provides fair, starvation-free CPU sharing with predictable response times, ideal for interactive time-sharing systems."
  },
  {
    id: "sys_011",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a 'Context Switch' in an operating system?",
    options: ["Saving the CPU register and state of the currently running thread/process and loading the saved state of another thread to resume execution", "Switching browser tabs", "Translating code from C to Rust", "Changing user passwords"],
    correct: 0,
    explanation: "Context switching incurs CPU overhead (saving program counter, registers, flushing pipeline, and potential TLB invalidation)."
  },
  {
    id: "sys_012",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Zombie Process in Unix/Linux?",
    options: ["A process that has finished execution (called exit), but its entry remains in the process table until its parent reads its exit status via wait()", "A computer virus that attacks servers", "A process running on an infected botnet", "A process that cannot be killed by SIGKILL"],
    correct: 0,
    explanation: "A zombie process has released its memory and file descriptors, remaining in the process table purely to communicate its return code to parent."
  },
  {
    id: "sys_013",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an Orphan Process in Unix/Linux and who adopts it?",
    options: ["A process whose parent terminated before it did; it is immediately adopted by the `init` process (PID 1 / systemd)", "A process deleted by the antivirus", "A thread that lost its memory stack", "A process with no PID"],
    correct: 0,
    explanation: "When a parent process terminates, its surviving child processes are re-parented to PID 1 (init/systemd), which handles their cleanup."
  },
  {
    id: "sys_014",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What does the `mmap()` system call do in Unix/Linux?",
    options: ["Maps files or anonymous memory directly into the process's virtual address space, enabling high-performance zero-copy file I/O", "Scans a network for open ports", "Allocates memory on the graphics card", "Draws visual maps on the terminal"],
    correct: 0,
    explanation: "mmap avoids copying data between kernel buffers and user-space memory, allowing applications to read/write disk files via direct pointer arithmetic."
  },
  {
    id: "sys_015",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What Linux command displays real-time CPU, memory, and running process utilization metrics?",
    options: ["top (or htop)", "ls", "grep", "chmod"],
    correct: 0,
    explanation: "top and htop provide interactive real-time process monitoring, showing CPU usage, load average, and thread memory."
  },

  // 16-45: Computer Networks (TCP/IP, DNS, Routing)
  {
    id: "sys_016",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What are the 7 layers of the OSI reference model from Layer 1 to Layer 7?",
    options: ["Physical, Data Link, Network, Transport, Session, Presentation, Application", "Application, Transport, Internet, Link, Hardware, User, Kernel", "Hardware, Software, Firmware, Network, TCP, IP, HTTP", "Physical, Ethernet, IP, TCP, SSL, HTTP, Web"],
    correct: 0,
    explanation: "The 7 OSI layers are Physical (L1), Data Link (L2), Network (L3), Transport (L4), Session (L5), Presentation (L6), and Application (L7)."
  },
  {
    id: "sys_017",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What are the three steps of the TCP Three-Way Handshake used to establish a reliable connection?",
    options: ["SYN -> SYN-ACK -> ACK", "HELLO -> READY -> CONNECT", "PING -> PONG -> ACK", "INIT -> VERIFY -> OK"],
    correct: 0,
    explanation: "Client sends SYN; Server responds with SYN-ACK; Client replies with ACK, synchronizing sequence numbers between both endpoints."
  },
  {
    id: "sys_018",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the primary difference between TCP and UDP at the Transport Layer?",
    options: ["TCP is connection-oriented, reliable, ordered, and flow-controlled; UDP is connectionless, unreliable, unordered, and lightweight", "UDP guarantees delivery; TCP does not", "TCP is faster than UDP for gaming and video", "UDP encrypts packets; TCP does not"],
    correct: 0,
    explanation: "TCP guarantees delivery and ordering via retransmissions and acknowledgments; UDP sends packets with zero handshake or delivery guarantees."
  },
  {
    id: "sys_019",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What mechanism does TCP use for Flow Control to prevent a fast sender from overwhelming a slow receiver?",
    options: ["Sliding Window protocol (advertising Receiver Window size rwnd in packet headers)", "Token Bucket rate limiting", "Dropping random packets", "Encrypting headers with AES"],
    correct: 0,
    explanation: "The receiver advertises its available buffer space (rwnd) in every ACK header; the sender never sends more unacknowledged bytes than rwnd."
  },
  {
    id: "sys_020",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is the TCP TIME_WAIT state and why does it exist on connection termination?",
    options: ["Waits 2 * MSL (Maximum Segment Lifetime) to ensure the final ACK was received by peer and to prevent lingering old packets from corrupting new connections", "Waits for the user to restart the PC", "Delays connections to save power", "A state when network cable is unplugged"],
    correct: 0,
    explanation: "TIME_WAIT ensures late duplicate segments from the closed connection dissipate in the network before a new socket can reuse the same port pair."
  },
  {
    id: "sys_021",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is the primary purpose of DNS (Domain Name System)?",
    options: ["Translates human-friendly domain names (e.g. google.com) into machine-routable IP addresses (e.g. 142.250.190.46)", "Encrypts web traffic between browser and server", "Compresses images for faster loading", "Blocks spam emails"],
    correct: 0,
    explanation: "DNS acts as the phonebook of the internet, resolving human-readable hostnames into IP addresses used by routers."
  },
  {
    id: "sys_022",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What DNS record type maps a hostname to an IPv4 address?",
    options: ["A record", "AAAA record", "CNAME record", "MX record"],
    correct: 0,
    explanation: "An 'A' record maps a hostname to a 32-bit IPv4 address. 'AAAA' maps to a 128-bit IPv6 address."
  },
  {
    id: "sys_023",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What DNS record type creates an alias pointing one domain name to another canonical domain name?",
    options: ["CNAME record", "A record", "TXT record", "NS record"],
    correct: 0,
    explanation: "CNAME (Canonical Name) aliases one name to another: e.g. www.example.com CNAME example.com."
  },
  {
    id: "sys_024",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What protocol resolves an IP address to a physical hardware MAC address on a local Ethernet / Wi-Fi network?",
    options: ["ARP (Address Resolution Protocol)", "DHCP", "DNS", "ICMP"],
    correct: 0,
    explanation: "ARP broadcasts 'Who has IP X.X.X.X?' on the local network link layer, and the matching device responds with its 48-bit MAC address."
  },
  {
    id: "sys_025",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What network protocol is used by the `ping` utility to test host reachability?",
    options: ["ICMP (Internet Control Message Protocol)", "TCP", "UDP", "SNMP"],
    correct: 0,
    explanation: "ping sends ICMP Echo Request packets (Type 8) and waits for ICMP Echo Reply packets (Type 0) to measure round-trip time."
  },
  {
    id: "sys_026",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "How many bits are in an IPv4 address compared to an IPv6 address?",
    options: ["IPv4 is 32 bits; IPv6 is 128 bits", "IPv4 is 64 bits; IPv6 is 128 bits", "IPv4 is 16 bits; IPv6 is 32 bits", "Both are 64 bits"],
    correct: 0,
    explanation: "IPv4 uses 32 bits (~4.3 billion addresses). IPv6 uses 128 bits (~3.4 x 10^38 addresses), solving global address exhaustion."
  },
  {
    id: "sys_027",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "In CIDR notation, how many usable host IP addresses are in a `/24` subnet (e.g. 192.168.1.0/24)?",
    options: ["254 usable hosts (256 total addresses minus network and broadcast addresses)", "256 usable hosts", "512 usable hosts", "128 usable hosts"],
    correct: 0,
    explanation: "A /24 subnet has 32 - 24 = 8 host bits (2^8 = 256 addresses). Reserving .0 (network) and .255 (broadcast) leaves 254 assignable host IPs."
  },
  {
    id: "sys_028",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is NAT (Network Address Translation) commonly used for in home and corporate routers?",
    options: ["Allows multiple private devices on a local LAN (e.g. 192.168.x.x) to share a single public IPv4 address to access the internet", "Encrypts all outgoing emails", "Increases Wi-Fi radio signal range", "Translates English text to binary"],
    correct: 0,
    explanation: "NAT rewrites private source IP and port combinations into the router's public WAN IP, tracking return packets via a NAT translation table."
  },
  {
    id: "sys_029",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What protocol automatically assigns dynamic IP addresses, default gateways, and DNS server settings to client devices joining a network?",
    options: ["DHCP (Dynamic Host Configuration Protocol)", "DNS", "BGP", "SNMP"],
    correct: 0,
    explanation: "DHCP uses the DORA process (Discover, Offer, Request, Acknowledge) over UDP ports 67/68 to lease network configurations to devices."
  },
  {
    id: "sys_030",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What core routing protocol exchanges routing information between Autonomous Systems (AS) across the global Internet backbone?",
    options: ["BGP (Border Gateway Protocol)", "OSPF", "RIP", "EIGRP"],
    correct: 0,
    explanation: "BGP is the exterior gateway path-vector protocol that binds the global internet together, routing traffic across Internet Service Providers."
  },

  // 46-75: Cryptography, TLS & Network Security
  {
    id: "sys_031",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is the primary difference between Symmetric and Asymmetric encryption?",
    options: ["Symmetric uses the same secret key for encryption and decryption; Asymmetric uses a mathematically linked public/private key pair", "Symmetric encryption cannot be decrypted", "Asymmetric uses only one shared key", "Symmetric only works over Wi-Fi"],
    correct: 0,
    explanation: "Symmetric (AES) is extremely fast for bulk data. Asymmetric (RSA/ECC) solves key exchange by publishing a public key and guarding a private key."
  },
  {
    id: "sys_032",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "Which symmetric encryption standard is the gold standard used globally for protecting classified data and securing HTTPS sessions?",
    options: ["AES (Advanced Encryption Standard with 128 or 256-bit keys)", "DES", "RC4", "MD5"],
    correct: 0,
    explanation: "AES (Rijndael block cipher) is approved worldwide by governments and industry, offering unbreakable cryptographic security when implemented properly."
  },
  {
    id: "sys_033",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the purpose of Diffie-Hellman Key Exchange (e.g. ECDHE)?",
    options: ["Allows two parties to securely generate a shared secret key over an insecure, eavesdropped communication channel without transmitting the key itself", "Encrypts files on a hard drive", "Hashes user passwords", "Generates SSL certificates"],
    correct: 0,
    explanation: "Ephemeral Diffie-Hellman (ECDHE) enables client and server to arrive at the identical symmetric session key over public networks, providing Forward Secrecy."
  },
  {
    id: "sys_034",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is 'Perfect Forward Secrecy' (PFS) in modern TLS connections?",
    options: ["Compromising the server's long-term private key in the future does NOT allow an attacker to decrypt previously recorded encrypted session traffic", "Passwords never expire", "SSL certificates automatically renew", "The browser never stores cookies"],
    correct: 0,
    explanation: "PFS generates unique ephemeral session keys per connection (via ECDHE); compromising the server's master RSA certificate cannot decrypt past recorded sessions."
  },
  {
    id: "sys_035",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Digital Certificate (X.509) in HTTPS?",
    options: ["An electronic document binding a public key to an organization's identity, cryptographically signed by a trusted Certificate Authority (CA)", "A digital receipt for software purchases", "A password saved in Chrome", "A license file for Windows"],
    correct: 0,
    explanation: "Browsers verify the CA's signature chain up to pre-installed root certificates in the OS trust store, guaranteeing the domain's authenticity."
  },
  {
    id: "sys_036",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What major efficiency improvement was introduced in the TLS 1.3 handshake compared to TLS 1.2?",
    options: ["Reduced the handshake from 2 round-trips (2-RTT) down to 1 round-trip (1-RTT) and deprecated weak legacy ciphers (RSA key exchange, CBC, RC4)", "Added support for MD5 hashing", "Increased round-trips to 4 for security", "Removed encryption entirely"],
    correct: 0,
    explanation: "TLS 1.3 cuts connection latency in half (1-RTT) and supports 0-RTT resumption while stripping away obsolete and insecure cipher suites."
  },
  {
    id: "sys_037",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an HMAC (Hash-based Message Authentication Code)?",
    options: ["A cryptographic construction that combines a secret key with a cryptographic hash function (SHA-256) to verify both data integrity and authenticity", "A hardware MAC address on a motherboard", "An encryption algorithm for hard drives", "A protocol for video streaming"],
    correct: 0,
    explanation: "HMAC ensures that a message has not been altered in transit and was originated by a party possessing the shared secret key."
  },
  {
    id: "sys_038",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What default port is used for standard unencrypted HTTP traffic versus encrypted HTTPS traffic?",
    options: ["Port 80 for HTTP; Port 443 for HTTPS", "Port 443 for HTTP; Port 80 for HTTPS", "Port 22 for HTTP; Port 21 for HTTPS", "Port 8080 for HTTP; Port 8443 for HTTPS"],
    correct: 0,
    explanation: "HTTP defaults to TCP port 80; HTTPS defaults to TCP port 443."
  },
  {
    id: "sys_039",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What default port is used for SSH (Secure Shell) remote server administration?",
    options: ["22", "80", "443", "25"],
    correct: 0,
    explanation: "SSH operates on TCP port 22 by default."
  },
  {
    id: "sys_040",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Man-in-the-Middle (MitM) attack?",
    options: ["An attacker secretly intercepts and relays communications between two parties who believe they are directly communicating with each other", "A server physical break-in", "Flooding a router with fake emails", "Guessing a user's password"],
    correct: 0,
    explanation: "MitM attacks intercept unencrypted traffic (or exploit fake certificates) to eavesdrop or tamper with communication data in real time."
  },

  // 76-100: Web Vulnerabilities, Cyber Attacks & Defense
  {
    id: "sys_041",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Cross-Site Scripting (XSS)?",
    options: ["A vulnerability where malicious client-side JavaScript is injected into trusted web applications and executed in victims' browsers", "Stealing physical server hard drives", "Overloading an API with requests", "Cracking database passwords using GPUs"],
    correct: 0,
    explanation: "XSS allows attackers to execute arbitrary scripts in victims' browsers, hijacking session cookies, redirecting users, or defacing sites."
  },
  {
    id: "sys_042",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the difference between Stored XSS and Reflected XSS?",
    options: ["Stored XSS permanently saves the malicious payload in a database; Reflected XSS reflects the payload off the immediate web server via URL parameters", "Reflected XSS is stored in the database; Stored XSS is in URLs", "Stored XSS only affects mobile phones", "There is no difference in attack impact"],
    correct: 0,
    explanation: "Stored XSS (persistent) affects everyone who visits a compromised page; Reflected XSS requires tricking a victim into clicking a crafted URL link."
  },
  {
    id: "sys_043",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Cross-Site Request Forgery (CSRF)?",
    options: ["An attack that tricks an authenticated user into executing unwanted actions (e.g. money transfer or email change) on a trusted web application", "Stealing passwords via fake login pages", "Brute-forcing SSH keys", "Attacking web servers using DDoS"],
    correct: 0,
    explanation: "CSRF exploits the browser's automatic inclusion of session cookies with cross-site requests, executing state-changing actions without user consent."
  },
  {
    id: "sys_044",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "How do Anti-CSRF Synchronizer Tokens defend against CSRF attacks?",
    options: ["A secret, unpredictable cryptographic token is embedded in user forms; requests are rejected if incoming requests lack the matching token", "They encrypt all HTML tags with AES", "They log out the user after 30 seconds", "They block all POST requests"],
    correct: 0,
    explanation: "Because an external attacker cannot read or forge the unique per-session anti-CSRF token, forged cross-site form submissions fail server validation."
  },
  {
    id: "sys_045",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a SYN Flood attack in Denial of Service (DoS)?",
    options: ["Flooding a target server with bogus TCP SYN packets without responding to SYN-ACKs, exhausting the server's half-open connection backlog table", "Flooding an email inbox with spam", "Disconnecting Ethernet cables repeatedly", "Sending large image attachments"],
    correct: 0,
    explanation: "SYN floods exhaust connection state memory; mitigated using 'SYN Cookies' which encode state inside the initial sequence number without allocating RAM."
  },
  {
    id: "sys_046",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Server-Side Request Forgery (SSRF)?",
    options: ["An attack where a vulnerable web server is coerced into sending unauthorized HTTP requests to internal, inaccessible backend services or cloud metadata APIs", "A client browser script injection", "A password cracking technique", "A physical cable tap"],
    correct: 0,
    explanation: "SSRF tricks backend servers into querying internal IPs (like AWS metadata endpoint 169.254.169.254) to leak secrets or access private subnets."
  },
  {
    id: "sys_047",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is a 'Time-of-Check to Time-of-Use' (TOCTOU) race condition vulnerability?",
    options: ["A security flaw where a resource's status or permission changes in the brief window between when the software checks it and when it uses it", "A server clock desynchronization bug", "A slow network handshake", "A database timeout error"],
    correct: 0,
    explanation: "In TOCTOU, an attacker swaps a validated file with a symbolic link to /etc/shadow right before the program writes to it, escalating privileges."
  },
  {
    id: "sys_048",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What security principle states that every program and user should operate using the minimum privileges necessary to complete their job?",
    options: ["Principle of Least Privilege", "Security through Obscurity", "Fail-Safe Defaults", "Defense in Depth"],
    correct: 0,
    explanation: "Least Privilege minimizes damage: running web servers as non-root users ensures compromised services cannot alter system files directly."
  },
  {
    id: "sys_049",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is 'Defense in Depth' in cybersecurity?",
    options: ["Employing multiple layered defense mechanisms (firewalls, WAF, encryption, IAM, auditing) so that if one fails, others stop the attack", "Placing server racks deep underground", "Using 5 passwords for one account", "Hiding source code in secret folders"],
    correct: 0,
    explanation: "Defense in Depth ensures no single security flaw compromises the entire system; multiple protective layers must be breached."
  },
  {
    id: "sys_050",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Web Application Firewall (WAF) such as AWS WAF or Cloudflare WAF?",
    options: ["A Layer 7 security proxy that inspects HTTP/HTTPS traffic to block common web attacks like SQLi, XSS, and malicious bot scraping", "A hardware router on consumer desks", "A virus scanner for desktop computers", "A software compiler"],
    correct: 0,
    explanation: "A WAF filters application layer traffic against OWASP Top 10 rule sets before requests reach the origin web application."
  },
  {
    id: "sys_051",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Address Space Layout Randomization (ASLR)?",
    options: ["A memory-protection defense that randomizes the memory locations of program stack, heap, and libraries, making buffer overflow exploits unreliable", "A tool for sorting array items", "A network IP scrambler", "A file defragmentation utility"],
    correct: 0,
    explanation: "ASLR prevents attackers from reliably jumping to known hardcoded function addresses (e.g. system() in libc) in memory."
  },
  {
    id: "sys_052",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a 'Zero-Day' vulnerability?",
    options: ["A security vulnerability that is actively exploited in the wild before the software vendor has developed or released a security patch", "A bug discovered on day 0 of a company's founding", "A software trial that expires immediately", "A bug with 0 severity rating"],
    correct: 0,
    explanation: "Zero-day means developers have had zero days to fix the flaw; no official patch is yet available to protect users."
  },
  {
    id: "sys_053",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is Phishing in social engineering?",
    options: ["Deceptive emails, messages, or websites masquerading as legitimate entities to trick victims into revealing credentials or sensitive data", "Scanning Wi-Fi networks for passwords", "Stealing copper cables from telephone poles", "Cracking passwords using supercomputers"],
    correct: 0,
    explanation: "Phishing preys on human psychology rather than software bugs, convincing users to enter passwords into fake login portals."
  },
  {
    id: "sys_054",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is Multi-Factor Authentication (MFA)?",
    options: ["Requiring two or more distinct verification factors (something you know, something you have, something you are) to gain account access", "Entering your password twice", "Using passwords with at least 20 characters", "Logging in from two computers simultaneously"],
    correct: 0,
    explanation: "MFA combines knowledge (password), possession (authenticator app/hardware token), or inherence (fingerprint) to thwart credential stuffing."
  },
  {
    id: "sys_055",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Ransomware?",
    options: ["Malware that covertly encrypts a victim's files and demands payment (usually cryptocurrency) in exchange for the decryption key", "Software that displays pop-up advertisements", "A tool that monitors keystrokes", "An antivirus scanner that costs money"],
    correct: 0,
    explanation: "Ransomware locks critical enterprise files with strong encryption, threatening permanent data destruction if ransom demands are not met."
  },
  {
    id: "sys_056",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What does the `chmod 755 filename` command do in Linux?",
    options: ["Owner has Read, Write, Execute (7); Group and Others have Read and Execute (5)", "Everyone has full access to the file", "Only root can access the file", "The file is deleted"],
    correct: 0,
    explanation: "7 = 4(r) + 2(w) + 1(x). 5 = 4(r) + 1(x). 755 is the standard permission mode for executable scripts and directories."
  },
  {
    id: "sys_057",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What does `chmod 600 id_rsa` do to an SSH private key file?",
    options: ["Sets Read and Write permissions for the owner only; removes all permissions for Group and Others (enforced by OpenSSH)", "Makes the key public on the internet", "Shares the key with all users in the group", "Locks the key from being read by anyone"],
    correct: 0,
    explanation: "OpenSSH rejects private keys with permissive permissions, requiring chmod 600 (owner read/write only) to prevent unauthorized access."
  },
  {
    id: "sys_058",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an Air-Gapped computer system?",
    options: ["A computer system that is physically isolated from the internet and any other unsecure local networks to guarantee ultimate security", "A laptop cooled by high-powered air fans", "A cloud server running in an airplane", "A wireless Wi-Fi router"],
    correct: 0,
    explanation: "Air-gapping prevents remote network intrusions by physically severing all network interfaces and cables from critical infrastructure."
  },
  {
    id: "sys_059",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is DNS Poisoning (DNS Spoofing)?",
    options: ["Corrupting a DNS resolver cache with fraudulent IP addresses to redirect legitimate users to malicious attacker-controlled servers", "Crashing a DNS server with heavy traffic", "Deleting domain names from ICANN", "Sending infected emails to network admins"],
    correct: 0,
    explanation: "DNS cache poisoning injects fake records into recursive resolvers, tricking browsers into navigating to phishing duplicates of bank portals."
  },
  {
    id: "sys_060",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What security extension adds cryptographic signatures to DNS records to protect against DNS cache poisoning?",
    options: ["DNSSEC (Domain Name System Security Extensions)", "HTTPS", "BGPsec", "DoH (DNS over HTTPS)"],
    correct: 0,
    explanation: "DNSSEC signs DNS responses with cryptographic key chains, allowing resolvers to verify the authenticity of IP address answers."
  },
  {
    id: "sys_061",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is the purpose of the Linux `/etc/passwd` file?",
    options: ["Stores basic user account information (username, UID, GID, home directory, shell)", "Stores encrypted user passwords in plaintext", "Logs failed root logins", "Controls firewall rules"],
    correct: 0,
    explanation: "Historically it contained passwords; today encrypted password hashes are stored safely in the restricted `/etc/shadow` file."
  },
  {
    id: "sys_062",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "Which Linux signal cannot be caught, blocked, or ignored by any process, immediately terminating it?",
    options: ["SIGKILL (signal 9)", "SIGTERM (signal 15)", "SIGINT (signal 2)", "SIGSTOP (signal 19)"],
    correct: 0,
    explanation: "SIGKILL and SIGSTOP are handled directly by the kernel and cannot be intercepted, making `kill -9` the ultimate unconditional process terminator."
  },
  {
    id: "sys_063",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the difference between `SIGTERM` and `SIGKILL` in Unix/Linux?",
    options: ["`SIGTERM` asks the process to gracefully terminate and clean up resources; `SIGKILL` forcibly kills the process immediately via kernel", "`SIGKILL` can be handled by a catch block; `SIGTERM` cannot", "`SIGTERM` restarts the computer", "They are identical signals"],
    correct: 0,
    explanation: "Standard practice is sending SIGTERM first to allow graceful shutdown (closing database pools, flushing logs), escalating to SIGKILL if unresponsive."
  },
  {
    id: "sys_064",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Stateful Firewall compared to a Stateless Packet Filtering Firewall?",
    options: ["A stateful firewall tracks active connection states (TCP handshakes, UDP streams) and automatically allows legitimate return traffic", "A stateless firewall stores logs in MySQL", "A stateful firewall is made of physical hardware only", "Stateless firewalls are slower"],
    correct: 0,
    explanation: "Stateful inspection understands connection context: once an outbound connection is permitted, incoming packets matching that active flow are permitted."
  },
  {
    id: "sys_065",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Botnet?",
    options: ["A network of compromised private computers or IoT devices infected with malware and controlled centrally by a threat actor (botmaster)", "A group of AI chatbots talking to each other", "A server cluster for training neural networks", "A video game server"],
    correct: 0,
    explanation: "Botnets (like Mirai) are weaponized to launch coordinated multi-terabit Distributed Denial of Service (DDoS) attacks worldwide."
  },
  {
    id: "sys_066",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Smurf Attack in networking?",
    options: ["A DDoS attack where ICMP broadcast echo requests are sent with the spoofed source IP of the victim, causing hundreds of network devices to flood the victim", "Stealing blue computer screens", "Cracking Wi-Fi passwords with blue lasers", "A Trojan horse disguised as a video game"],
    correct: 0,
    explanation: "The Smurf attack is an amplification attack that exploits IP broadcast addresses to overwhelm a victim's network with ICMP replies."
  },
  {
    id: "sys_067",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Honeypot in network defense?",
    options: ["A decoy system intentionally deployed to lure, detect, and analyze attacks from malicious threat actors without risking production assets", "A database of stolen passwords", "A high-speed cache for passwords", "A trap to catch software pirates"],
    correct: 0,
    explanation: "Honeypots mimic production systems to alert security teams to intrusion attempts and study attackers' tactics, techniques, and procedures (TTPs)."
  },
  {
    id: "sys_068",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Keylogger malware?",
    options: ["Malware that covertly records every keystroke pressed by a user on their physical or virtual keyboard to harvest credentials and credit card numbers", "Software that logs SSH key fingerprints", "A tool for generating cryptographic keys", "A keyboard firmware driver"],
    correct: 0,
    explanation: "Keyloggers capture sensitive typed text (passwords, emails, bank numbers) and exfiltrate the logs to a remote command-and-control server."
  },
  {
    id: "sys_069",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What does the `sudo` command stand for and do in Unix/Linux?",
    options: ["'Superuser Do': permits authorized users to execute commands with the security privileges of the superuser (root) or another user", "System Update Download Operation", "Switch User Database Only", "Scan Unix Device Objects"],
    correct: 0,
    explanation: "sudo allows granular privilege elevation logged in `/var/log/auth.log`, avoiding the security risks of sharing the raw root account password."
  },
  {
    id: "sys_070",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is the standard loopback IP address representing the local machine in IPv4?",
    options: ["127.0.0.1 (localhost)", "192.168.1.1", "10.0.0.1", "0.0.0.0"],
    correct: 0,
    explanation: "127.0.0.1 (and the entire 127.0.0.0/8 block) routes packets locally within the host operating system loopback interface without hitting network hardware."
  },
  {
    id: "sys_071",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What does binding a server socket to IP `0.0.0.0` mean compared to `127.0.0.1`?",
    options: ["`0.0.0.0` listens on all available network interfaces (LAN, Wi-Fi, Ethernet); `127.0.0.1` listens only for internal connections from localhost", "`0.0.0.0` blocks all incoming traffic", "`127.0.0.1` exposes the server to the public internet", "There is no difference"],
    correct: 0,
    explanation: "Listening on 127.0.0.1 is safe for local development; 0.0.0.0 exposes the port to the entire local network and internet."
  },
  {
    id: "sys_072",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Port Scanning in network reconnaissance?",
    options: ["Probing a target host's network ports (using tools like Nmap) to discover open services, running daemon versions, and potential vulnerabilities", "Scanning barcodes on computer cases", "Checking printer ink levels", "Speeding up internet bandwidth"],
    correct: 0,
    explanation: "Nmap sends packets (e.g. SYN scan) to ports 1-65535, identifying which application services (HTTP, SSH, MySQL) are actively listening."
  },
  {
    id: "sys_073",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an Air-Drop or Watering Hole attack in cybersecurity?",
    options: ["Compromising a specific legitimate website frequently visited by a target organization to infect visitors with targeted malware", "Attacking water utility companies", "Dumping hard drives in water", "Flooding an office with fake emails"],
    correct: 0,
    explanation: "Watering hole attacks infect high-profile niche industry websites where target employees congregate, waiting for victims to browse the site."
  },
  {
    id: "sys_074",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is a Return-Oriented Programming (ROP) exploit?",
    options: ["An advanced exploit technique that chains together existing small machine instruction sequences ending in 'ret' ('gadgets') to bypass non-executable stack protections (W^X / DEP)", "An object-oriented programming tutorial", "A network routing protocol", "A method for returning functions in Python"],
    correct: 0,
    explanation: "When Data Execution Prevention (DEP) stops direct shellcode execution on the stack, ROP hijacks the stack pointer to chain existing executable library instructions."
  },
  {
    id: "sys_075",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Rootkit?",
    options: ["A stealthy type of malicious software designed to hide its presence and unauthorized administrator access deep inside the operating system kernel", "A toolkit for rooting smartphones", "An open-source Linux distribution", "A file compression program"],
    correct: 0,
    explanation: "Rootkits hook low-level kernel system call tables to hide their own processes, files, and network sockets from system diagnostic tools like `ps` and `netstat`."
  },
  {
    id: "sys_076",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a VPN (Virtual Private Network) and which modern protocol is celebrated for its lightweight 4,000-line codebase and high speed?",
    options: ["WireGuard (alongside OpenVPN and IPSec)", "BitTorrent", "FTP", "SNMPv3"],
    correct: 0,
    explanation: "WireGuard provides encrypted site-to-site or client-to-gateway tunnels using modern cryptography (ChaCha20, Curve25519) with exceptional speed and minimal attack surface."
  },
  {
    id: "sys_077",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What command in Linux searches for exact string patterns inside files or directories?",
    options: ["grep", "find", "cat", "echo"],
    correct: 0,
    explanation: "grep (Global Regular Expression Print) searches text files using literal strings or regular expressions."
  },
  {
    id: "sys_078",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What command in Linux displays current disk space usage across all mounted file systems in human-readable format?",
    options: ["df -h", "du -sh", "fdisk -l", "free -m"],
    correct: 0,
    explanation: "`df -h` (Disk Free - Human readable) shows percentage used, available gigabytes, and mount points across all storage partitions."
  },
  {
    id: "sys_079",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What does the command `kill -9 1234` do in Linux?",
    options: ["Sends an uncatchable SIGKILL to immediately terminate the process with PID 1234", "Pauses process 1234 for 9 seconds", "Lowers the CPU priority of process 1234 by 9", "Restarts process 1234 nine times"],
    correct: 0,
    explanation: "kill -9 sends signal 9 (SIGKILL) directly through the kernel, forcing immediate unconditional process destruction."
  },
  {
    id: "sys_080",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the Linux `/proc` filesystem?",
    options: ["A pseudo-filesystem in RAM created dynamically by the kernel that exposes kernel parameters, hardware status, and running process info", "A folder where user documents are stored", "A backup directory on the hard drive", "A file system for external USB drives"],
    correct: 0,
    explanation: "/proc files occupy 0 bytes on disk; reading /proc/cpuinfo, /proc/meminfo, or /proc/[pid]/status retrieves live kernel data structures."
  },
  {
    id: "sys_081",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an SSH Key Pair and why is it safer than password authentication?",
    options: ["Uses 4096-bit RSA or Ed25519 asymmetric cryptography; private keys never leave the client machine, defeating brute-force and credential-stuffing attacks", "SSH keys expire every 10 seconds", "SSH keys can only be typed on special keyboards", "There is no security advantage"],
    correct: 0,
    explanation: "SSH key authentication uses challenge-response cryptography: the server verifies ownership of the private key without the key ever traversing the network."
  },
  {
    id: "sys_082",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What does `ssh-keygen -t ed25519` do?",
    options: ["Generates a modern, high-speed, compact Elliptic Curve cryptography key pair for SSH authentication", "Connects to a remote server", "Decrypts a password file", "Deletes existing SSH keys"],
    correct: 0,
    explanation: "Ed25519 provides superior security, resistance to side-channel attacks, and ultra-short key lengths compared to traditional RSA."
  },
  {
    id: "sys_083",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the purpose of the `ssh-agent` utility?",
    options: ["A background daemon that holds decrypted private keys in memory so users don't have to re-enter passphrases on every SSH connection", "An AI assistant for the terminal", "A firewall for SSH ports", "A program that hacks remote servers"],
    correct: 0,
    explanation: "ssh-agent keeps private keys in RAM; `ssh-add` loads keys once per session, securely answering authentication challenges."
  },
  {
    id: "sys_084",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an Ingress Controller in Kubernetes network security?",
    options: ["A reverse proxy (like Nginx or Envoy) that manages external HTTP/HTTPS routing, SSL termination, and load balancing into Kubernetes service clusters", "A firewall that blocks outgoing traffic", "A storage device inside container pods", "A database engine"],
    correct: 0,
    explanation: "Ingress controllers translate external requests into internal cluster IPs, enforcing TLS certificates and hostname-based routing."
  },
  {
    id: "sys_085",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is BPF / eBPF (Extended Berkeley Packet Filter) in the modern Linux kernel?",
    options: ["A revolutionary kernel technology that allows executing sandboxed bytecode inside the Linux kernel dynamically without modifying kernel source or loading modules", "An old dial-up modem protocol", "A virus scanner for Android", "A hardware network card driver"],
    correct: 0,
    explanation: "eBPF enables ultra-high-performance network packet filtering, observability (Cilium), tracing (bpftrace), and security enforcement directly inside the kernel."
  },
  {
    id: "sys_086",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a 'Clickjacking' attack and how does the `X-Frame-Options` HTTP header prevent it?",
    options: ["Tricking a user into clicking transparent iframe elements layered over benign buttons; prevented by setting `X-Frame-Options: DENY` (or frame-ancestors in CSP)", "Stealing computer mouse hardware", "Automated click fraud on advertisements", "Hacking laptop touchpads"],
    correct: 0,
    explanation: "X-Frame-Options: DENY forbids other domains from embedding the web page inside an <iframe>, neutralizing invisible overlay clickjacking."
  },
  {
    id: "sys_087",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the difference between a Vulnerability Assessment and a Penetration Test (Pen Test)?",
    options: ["Vulnerability assessment automatedly identifies known vulnerabilities; Penetration testing actively attempts to exploit vulnerabilities to achieve objectives", "They are identical audits", "Penetration tests only test hardware", "Vulnerability assessments take down production servers"],
    correct: 0,
    explanation: "Vulnerability scanning catalogs weaknesses with tools; pen testing simulates real-world adversaries chaining exploits to breach systems."
  },
  {
    id: "sys_088",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Red Team vs Blue Team exercise in enterprise cybersecurity?",
    options: ["Red Team acts as offensive adversaries attempting to breach defenses; Blue Team actively detects, defends, and responds to the attacks", "Red Team writes code; Blue Team tests code", "Red Team builds servers; Blue Team installs cables", "They are video game tournament teams"],
    correct: 0,
    explanation: "Red Teams challenge organizational readiness by simulating realistic cyber attacks, while Blue Teams harden defenses and monitor SIEM alerts."
  },
  {
    id: "sys_089",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a SIEM (Security Information and Event Management) platform (like Splunk or Elastic SIEM)?",
    options: ["A centralized security system that aggregates, correlates, and analyzes real-time log data across firewalls, servers, and endpoints to detect threats", "An email client for developers", "An operating system for routers", "A password manager"],
    correct: 0,
    explanation: "SIEM aggregates billions of event logs into a single dashboard, running correlation rules and machine learning to trigger alerts on security breaches."
  },
  {
    id: "sys_090",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Network Segmentation and why is it essential for enterprise security?",
    options: ["Splitting a corporate network into distinct subnets and VLANs with strict firewall rules between them to prevent attackers from moving laterally", "Cutting physical internet wires in half", "Dividing Wi-Fi bandwidth evenly", "Using different brand computers in each room"],
    correct: 0,
    explanation: "Network segmentation contains breaches: if an attacker compromises a visitor Wi-Fi or office printer, firewalls block lateral movement into database subnets."
  },
  {
    id: "sys_091",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What Linux command shows the full path to the current working directory?",
    options: ["pwd", "cd", "ls", "whoami"],
    correct: 0,
    explanation: "`pwd` (Print Working Directory) prints the absolute path of the current directory."
  },
  {
    id: "sys_092",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What does the command `tail -f /var/log/syslog` do in Linux?",
    options: ["Outputs the last few lines of the file and continuously follows new log entries in real time as they are appended", "Deletes the last 10 lines of the file", "Scrolls to the top of the file", "Compresses the file to save disk space"],
    correct: 0,
    explanation: "The `-f` (follow) flag keeps the file open, printing new lines to stdout in real time as kernel and system daemons write logs."
  },
  {
    id: "sys_093",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is the function of the `netstat` or `ss` command in Linux?",
    options: ["Displays network socket statistics, listening TCP/UDP ports, and active network connections (`ss -tulpn`)", "Measures internet download speed", "Configures router passwords", "Restarts network adapters"],
    correct: 0,
    explanation: "`ss -tulpn` inspects listening TCP/UDP ports and shows the exact process PID holding each socket."
  },
  {
    id: "sys_094",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is an IP Spoofing attack?",
    options: ["Forging the source IP address in IP packet headers to conceal the attacker's identity or impersonate a trusted computing system", "Renaming a computer hostname", "Changing MAC address on an iPhone", "Using fake domain names"],
    correct: 0,
    explanation: "Because UDP lacks handshakes, attackers freely spoof the victim's source IP, redirecting massive amplified reflection traffic onto the victim."
  },
  {
    id: "sys_095",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is a Replay Attack in network security, and how is it prevented?",
    options: ["An attacker captures valid network transmission packets and re-transmits them later to duplicate an action; prevented using nonces, timestamps, and TLS", "Playing recorded video files repeatedly", "Retrying failed passwords", "A bug in YouTube video streams"],
    correct: 0,
    explanation: "Nonces (numbers used once) and millisecond timestamps ensure identical intercepted packets are rejected as stale on subsequent submissions."
  },
  {
    id: "sys_096",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Public Key Pinning (HPKP) and why was it deprecated in modern web standards?",
    options: ["Hardcoding expected certificate keys into browsers; deprecated because operational mistakes or lost keys could brick a domain permanently", "Pinning certificates to bulletin boards", "A mandatory requirement for all HTTPS sites", "A method for encrypting cookies"],
    correct: 0,
    explanation: "HPKP was deprecated because accidental configuration errors or expired pins rendered websites permanently inaccessible to users."
  },
  {
    id: "sys_097",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Certificate Transparency (CT) logging in modern web PKI?",
    options: ["An open public audit log where all publicly-trusted SSL/TLS certificates must be logged upon issuance to detect rogue or fraudulent certificates", "Printing certificates in transparent ink", "Publishing private keys online", "A government surveillance program"],
    correct: 0,
    explanation: "CT logs allow domain owners to monitor public append-only ledgers and detect if a compromised CA issues an unauthorized certificate for their domain."
  },
  {
    id: "sys_098",
    topic: "systems_security",
    difficulty: "easy",
    type: "single",
    question: "What is an IP Blacklist / Whitelist (Allowlist / Denylist)?",
    options: ["An allowlist permits connections only from pre-approved IP addresses; a denylist explicitly blocks connections from known hostile IP ranges", "A color theme for computer monitors", "A list of dark web websites", "A database of broken network cables"],
    correct: 0,
    explanation: "Allowlists provide zero-trust security for administrative portals (like SSH or database management), allowing connections only from corporate VPN IPs."
  },
  {
    id: "sys_099",
    topic: "systems_security",
    difficulty: "medium",
    type: "single",
    question: "What is Salting and Peppering in password security?",
    options: ["A Salt is a unique random string per user stored in the DB; a Pepper is a secret key shared across all hashes stored outside the database", "Cooking metaphors with no real meaning", "Double-hashing passwords with MD5", "Encrypting database hard drives"],
    correct: 0,
    explanation: "A pepper adds an extra layer of defense: even if attackers dump the database with salted hashes, they cannot crack hashes without the external pepper key."
  },
  {
    id: "sys_100",
    topic: "systems_security",
    difficulty: "hard",
    type: "single",
    question: "What is Zero Trust Architecture ('Never Trust, Always Verify')?",
    options: ["A security model requiring strict identity verification and continuous authorization for every user and device, assuming the internal network is already hostile", "Assuming all employees are criminals and firing them", "Running servers without any operating system", "Disabling all network connections permanently"],
    correct: 0,
    explanation: "Zero Trust moves away from legacy perimeter security ('castle-and-moat'): every access request to any resource is authenticated, authorized, and encrypted."
  }
];

console.log(`Generated ${systemsQuestions.length} Systems & Cybersecurity questions.`);
fs.writeFileSync('scratch/systems_100.json', JSON.stringify(systemsQuestions, null, 2));
