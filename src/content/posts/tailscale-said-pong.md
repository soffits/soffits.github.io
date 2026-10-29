---
title: "Why tailscale ping worked on OpenWrt when SSH and ICMP didn't"
description: "tailscaled could reach its peers, but netifd and a LuCI interface config were wiping the IP and table 52 routes off tailscale0."
pubDatetime: 2026-08-02
tags: ["networking", "openwrt"]
---

On an OpenWrt router, `tailscale ping` returned `pong` while plain `ping` dropped every packet and SSH and LuCI over the Tailnet timed out. Because `tailscale ping` succeeded, I spent the first few minutes checking ACLs and firewall rules before looking at the network interface itself.

Three commands showed what was actually missing:

```sh
tailscale ip -4
ip address show dev tailscale0
ip route show table 52
```

`tailscale ip -4` printed the router's assigned Tailscale address, `ip address show dev tailscale0` showed no IPv4 `/32` or IPv6 `/128` on the interface, and `ip route show table 52` was completely empty. Default `tailscale ping` probes peers at the [Tailscale layer without injecting packets into either host's TUN device](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/ping.go) (unlike `--icmp`), so it kept working even while Linux had no address or routes on `tailscale0` to carry normal IP traffic.

The missing kernel state traced back to a LuCI-generated network section:

```text
network.tailscale.proto='none'
network.tailscale.device='tailscale0'
```

The community LuCI app's [Auto Configure Firewall action](https://github.com/Tokisaki-Galaxy/luci-app-tailscale-community/blob/4dd90ef/luci-app-tailscale-community/root/usr/share/rpcd/ucode/tailscale.uc#L232-L353) creates that interface and reloads the network and firewall, matching the unmanaged `tailscale` interface pattern in the [OpenWrt Tailscale guide](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start). On this router, though, the logs showed `tailscaled` and `netifd` stepping on each other: `tailscaled` created `tailscale0`, `netifd` noticed the device and brought the logical `tailscale` interface up, and the resulting reload wiped out the address and table 52 routes (similar to [this GL.iNet startup-loop thread](https://forum.gl-inet.com/t/tailscale-startup-loop/66076)).

Keeping the UCI section but telling `netifd` not to bring it up automatically stopped the fight:

```sh
uci set network.tailscale.auto='0'
uci commit network
ifdown tailscale
/etc/init.d/tailscale restart
```

In `firewall4`, I attached the zone directly to the `tailscale0` device rather than the inactive logical network (`input ACCEPT`, `output ACCEPT`, `forward REJECT`, since this router is only accessed directly and does not act as a subnet router or exit node). After restarting Tailscale, `tailscale0` kept its `/32` and `/128` addresses, table 52 stayed populated, and normal `ping`, SSH, and LuCI came back across restarts.
