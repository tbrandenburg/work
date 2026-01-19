# work — Configuration Overview

`work` uses a **two-stage configuration lookup** with a **unified directory layout**.

The same layout is supported in both locations, with strict rules about what is allowed.

---

## Configuration Locations

1. **Project-local**
   ```text
   <project>/.work/
   ```

2. **User-global**
   ```text
   ~/.config/work/
   ```

Resolution order:
1. Explicit CLI override (`@context`)
2. Project-local configuration
3. User-global configuration

---

## Directory Layout

```text
work-config-root/
├── config.json
├── contexts/
├── credentials/
└── notifications/
```

The layout is identical in both locations.

---

## Security Rules (Important)

- **Credentials MUST NOT exist in `.work/credentials/`**
- Credentials are resolved **only** from `~/.config/work/credentials/`
- Violations result in a hard error

---

## Contexts

- Contexts are stored in `contexts/<name>.json`
- Project-local contexts may override **non-sensitive** fields
- Credentials are always referenced, never redefined locally

---

## Notifications

- Notification targets are stored in `notifications/`
- Project-local targets override global targets by name
- Targets are referenced by their configured name

---

## Design Guarantees

- No background state
- No implicit inference
- Explicit, deterministic resolution
- Safe for version control
