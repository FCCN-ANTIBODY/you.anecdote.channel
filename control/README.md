---
title: you
---
{% assign you = site.data.you %}
{% assign ctl = site.data.control %}

# {{ ctl.greeting | default: "You are holding the whole thing." }}

This page was read out of the bottle in the corner — every byte of it, camera off. Nothing here came
from a server after that. What you can do from here is exactly what the bottle says you can, and this
page walks it in order.

{% if you.secure == false or you.webauthn == false %}
## This browser cannot hold a key

WebAuthn is not available here (no secure context, or no authenticator). You can still read
everything in the bottle; you cannot become a recipient from this device. Open the same address on a
phone or a current browser.
{% elsif you.held %}
## 1 · Your key — held

Your identity for this place is in memory, derived {% if you.source == "prf" %}from your passkey by the gesture you just made{% else %}by the fallback ({{ you.source }}){% endif %}, and it is not stored.
Its public half is:

<p class="recipient"><code>{{ you.recipient }}</code></p>

{% if you.enrolled_here %}That line is already in the arrangement, so you are a recipient here.{% else %}To become a recipient, this string reaches the keeper once — shown as the still in the corner of the key card, or copied — and a person writes it into the arrangement. There is no form for it, on purpose.{% endif %}
{% elsif you.credId %}
## 1 · Your key — make the gesture

A passkey for this place exists on this device. Derive your identity from it now:

<a class="act" href="#you/derive">derive — the gesture</a>

The identity is computed from the passkey and this address, lives only in memory, and goes away when
you leave. No one, including this page, can produce it without you present.
{% else %}
## 1 · Your key — none yet

You do not have a passkey for this place. Make one; it asks for a capability called `prf` at the
moment of creation, which is what lets it derive keys later and cannot be added afterwards.

<a class="act" href="#you/enroll">enroll — mint a passkey</a>

If this device refuses `prf`, there is a weaker path — an identity kept in this browser — and the
page will say plainly that it is weaker:

<a class="act muted" href="#you/fallback">no prf here — mint an at-rest identity</a>
{% endif %}

{% if you.sealed.published %}
## 2 · The sealed bottle

There is a sealed bottle for this place, sealed to {{ you.sealed.stanzas }} recipient{% if you.sealed.stanzas != 1 %}s{% endif %}.
{% if you.sealed.opened %}**It opened with your key.** Its files are below, alongside the open ones.{% elsif you.held %}Your key is not among them, or has not been tried: {% if you.sealed.refused %}**it was refused** — your line is not in the arrangement yet.{% else %}<a class="act" href="#you/open">open it</a>{% endif %}{% else %}Hold a key first (step 1) and it will be tried.{% endif %}
{% else %}
## 2 · Nothing is sealed yet

This bottle is open to anyone who holds it. When there is a sealed one for you, it appears here.
{% endif %}

## 3 · What is in the bottle

{% for f in you.bottle.files %}- [`{{ f.path }}`](#/{{ f.path }}) <span class="muted">{{ f.bytes }} bytes{% if f.sealed %} · sealed{% endif %}</span>
{% endfor %}

The bottle is `{{ you.bottle.ref }}` at `{{ you.bottle.tip_short }}`, {{ you.bottle.frames }} frames, signed by `{{ you.bottle.by_short }}…`.
Read the [constitution](#/CONSTITUTION.md) to know what this place will and will not do.
