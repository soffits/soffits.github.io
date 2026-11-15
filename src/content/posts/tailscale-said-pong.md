---
title: "tailscale ping said pong, and nothing else would go through"
description: "On an OpenWrt router, tailscaled could reach its peers while netifd and a LuCI interface config kept wiping the IP and table 52 routes off tailscale0."
pubDatetime: 2026-08-02
modDatetime: 2026-11-15
tags: ["networking", "openwrt"]
---

I look after an OpenWrt router, and Tailscale is how I get into it when I'm not on its Wi-Fi. One evening I couldn't. SSH timed out, LuCI timed out, and a plain `ping` to its Tailscale address dropped every packet.

So I ran `tailscale ping`, mostly to confirm the router was down. It answered `pong`.

That sent me the wrong way for the next few minutes. If Tailscale can reach the peer, the tunnel is fine, so the problem has to be something filtering the traffic on top of it. I went through the tailnet ACLs, then the firewall rules on the router, and found nothing wrong in either. Then I stopped staring at policy and looked at the interface itself:

```sh
tailscale ip -4
ip address show dev tailscale0
ip route show table 52
```

`tailscale ip -4` printed the router's Tailscale address, so Tailscale knew who it was. `ip address show dev tailscale0` showed no IPv4 `/32` and no IPv6 `/128` on the interface. `ip route show table 52` was completely empty. Linux had nowhere to put the packets.

That's also why `pong` had fooled me. By default, `tailscale ping` probes the peer [at the Tailscale layer without injecting packets into either host's TUN device](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/ping.go) (`--icmp` is the one that goes through it). So it kept working with no address or routes on `tailscale0`, which is the exact situation where nothing else can. In hindsight `pong` was telling me the truth, just about a different layer than the one I cared about.

## Who was removing the address

The missing kernel state traced back to a network section that LuCI had written:

```text
network.tailscale.proto='none'
network.tailscale.device='tailscale0'
```

I'd clicked Auto Configure Firewall in the community LuCI app at some point. That [action](https://github.com/Tokisaki-Galaxy/luci-app-tailscale-community/blob/4dd90ef/luci-app-tailscale-community/root/usr/share/rpcd/ucode/tailscale.uc#L232-L353) creates the interface and reloads the network and firewall, and it matches the unmanaged `tailscale` interface pattern in the [OpenWrt Tailscale guide](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start). It's a reasonable thing to do. On this router, though, the logs showed `tailscaled` and `netifd` stepping on each other: `tailscaled` created `tailscale0`, `netifd` noticed the device and brought the logical `tailscale` interface up, and the reload that followed wiped out the address and the table 52 routes. Then it could happen again on the next restart. Someone on a GL.iNet router [hit something similar](https://forum.gl-inet.com/t/tailscale-startup-loop/66076), which made me feel a bit better about not seeing it sooner.

I kept the UCI section but told `netifd` not to bring it up on its own:

```sh
uci set network.tailscale.auto='0'
uci commit network
ifdown tailscale
/etc/init.d/tailscale restart
```

In `firewall4`, I attached the zone directly to the `tailscale0` device instead of the now-inactive logical network, with `input ACCEPT`, `output ACCEPT` and `forward REJECT`. I only ever reach this router directly, and it isn't a subnet router or an exit node, so there's nothing for it to forward.

After restarting Tailscale, `tailscale0` kept its `/32` and `/128`, table 52 stayed filled, and plain `ping`, SSH and LuCI all came back, and stayed back across restarts.

If you land here with the same symptom, I'd skip the part where I read ACLs. When `tailscale ping` works and normal traffic doesn't, look at `tailscale0`'s addresses and table 52 first; it's three commands, and they'd have saved me those minutes. I haven't clicked Auto Configure Firewall on that router since.
