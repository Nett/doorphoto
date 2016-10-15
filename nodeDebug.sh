#!/bin/bash
sudo iptables -F
sudo sysctl -w net.ipv4.conf.eth1.route_localnet=1
sudo iptables -t nat -F
sudo iptables -t nat -I PREROUTING -p tcp -i eth1 --dport 5858 -j DNAT --to-destination 127.0.0.1:9595
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
