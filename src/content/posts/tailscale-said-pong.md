---
title: "Tailscale said pong. SSH still had nowhere to go"
description: "The daemon could reach its peers, but tailscale0 had no address and Linux table 52 was empty."
pubDate: 2026-08-02
tags: ["networking", "openwrt", "maintenance"]
---

`tailscale ping` returned `pong`. Plain `ping` dropped every packet. SSH and LuCI over the Tailnet were gone too.

That combination sent me toward ACLs and firewall rules first. The peers could apparently reach each other, so surely the tunnel was alive and something higher up was rejecting traffic. It was a plausible story, and it was wrong.

Three commands made the failure much less mysterious:

```sh
tailscale ip -4
ip address show dev tailscale0
ip route show table 52
```

The first still printed the address assigned to the router by Tailscale's control plane. The second showed no Tailscale IPv4 `/32` or IPv6 `/128` on `tailscale0`. The third printed nothing at all. Linux had neither the address nor the peer routes needed to carry ordinary IP traffic.

I initially described the successful probe as TSMP. That was imprecise: plain `tailscale ping` uses Tailscale's own default ping mode, while `--tsmp` and `--icmp` are separate choices. The [CLI documentation](https://tailscale.com/docs/reference/tailscale-cli) and [ping-type reference](https://tailscale.com/docs/reference/ping-types) spell out the useful distinction: these probes can test Tailscale at different layers, and the default command does not exercise the hosts' normal IP stacks. The [command's help text and implementation](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/ping.go) are blunter: it pings at the Tailscale layer and does not inject packets into either TUN device.

So the pong was real. It just answered a narrower question than the one I cared about.

The missing kernel state led back to a LuCI-generated network section:

```text
network.tailscale.proto='none'
network.tailscale.device='tailscale0'
```

The community LuCI app's [Auto Configure Firewall action](https://github.com/Tokisaki-Galaxy/luci-app-tailscale-community/blob/4dd90ef/luci-app-tailscale-community/root/usr/share/rpcd/ucode/tailscale.uc#L232-L353) creates exactly that interface, then reloads the network and firewall when it changes the configuration. This is not obviously bad configuration. In fact, the current [OpenWrt Tailscale guide](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start) also recommends an unmanaged interface named `tailscale` on device `tailscale0`.

On this router, however, the logs showed two components trying to look after the same device. `tailscaled` created `tailscale0`; netifd noticed it, brought the logical `tailscale` interface up, and triggered network and firewall work. The address and table 52 routes then disappeared. A [closely matching public startup-loop report](https://forum.gl-inet.com/t/tailscale-startup-loop/66076) shows the same uncomfortable sequence—`tailscaled`, netifd, a firewall reload, then the device and Tailscale rules going down—although it does not prove the same root cause.

I kept the logical interface in UCI but stopped netifd from activating it automatically:

```sh
uci set network.tailscale.auto='0'
uci commit network
ifdown tailscale
/etc/init.d/tailscale restart
```

For firewall4, I attached the zone directly to the real `tailscale0` device instead of relying on the inactive logical network. This router only needed remote access to the router itself, so the zone was deliberately boring: input `ACCEPT`, output `ACCEPT`, forward `REJECT`, with no masquerading, MSS clamping, or cross-zone forwarding. A subnet router or exit node would need a different policy; copying this one there would break the feature it is meant to provide.

After the change, `tailscale0` regained its IPv4 `/32` and IPv6 `/128`. Table 52 filled with peer routes again. Ordinary ping, SSH, and LuCI all worked, and another Tailscale service restart produced the same healthy state instead of erasing it.

I still do not know why this OpenWrt build, netifd, and plugin combination turned a documented unmanaged-interface pattern into a fight over `tailscale0`. That is why I am not turning the fix into advice to delete every LuCI interface for Tailscale. The narrower result is repeatable: on this router, disabling automatic activation ended the second ownership path, and the address and routes stayed where `tailscaled` put them.
