# LocalStorage Key Collision Prevention

## The Problem

**LocalStorage is scoped by origin (protocol + domain + port), NOT by app.**

### Scenario 1: Different Domains (✅ SAFE)

```
Site A: https://site-a.com → localStorage A
Site B: https://site-b.com → localStorage B
```

**No collision** - different domains = different localStorage.

### Scenario 2: Same Domain (⚠️ COLLISION RISK)

```
App 1: https://example.com/app1 → localStorage (shared)
App 2: https://example.com/app2 → localStorage (shared)
```

**Collision risk!** Both apps share the same localStorage.

### Scenario 3: Multiple Instances of @downloader/core (🔴 HIGH RISK)

```
Project A: uses @downloader/core with default key
Project B: uses @downloader/core with default key
Both on: https://example.com
```

**High collision risk!** Both projects would overwrite each other's JWT.

---

## The Solution

### 1. ❌ REMOVED Default Key

**Before (DANGEROUS):**
```typescript
// Default key 'app_jwt' could collide
const store = new LocalStorageJwtStore(); // REMOVED
```

**Now (SAFE):**
```typescript
// Key is REQUIRED
const store = new LocalStorageJwtStore('myapp_downloader_jwt');
```

### 2. ✅ Use createNamespacedKey Helper

```typescript
import { createNamespacedKey, LocalStorageJwtStore } from '@downloader/core';

// Generate unique namespaced key
const key = createNamespacedKey('myapp', 'downloader');
// Result: 'myapp_downloader_jwt'

const store = new LocalStorageJwtStore(key);
```

### 3. ✅ Naming Convention

**Recommended pattern:**
```
{namespace}_{purpose}_jwt
```

**Examples:**
```typescript
// E-commerce site
createNamespacedKey('shopify', 'downloader')
// → 'shopify_downloader_jwt'

// Social media app
createNamespacedKey('social-app', 'media')
// → 'social_app_media_jwt'

// Multiple environments
createNamespacedKey('myapp-dev', 'core')
// → 'myapp_dev_core_jwt'

createNamespacedKey('myapp-prod', 'core')
// → 'myapp_prod_core_jwt'
```

---

## Best Practices

### ✅ DO

1. **Always provide unique key:**
   ```typescript
   new LocalStorageJwtStore(createNamespacedKey('myapp', 'downloader'))
   ```

2. **Use namespace = project/app name:**
   ```typescript
   createNamespacedKey('my-project-name', 'downloader')
   ```

3. **Include environment if needed:**
   ```typescript
   const env = process.env.NODE_ENV; // 'dev', 'staging', 'prod'
   createNamespacedKey(`myapp-${env}`, 'downloader')
   ```

4. **Document your key in code:**
   ```typescript
   // Key: 'myapp_downloader_jwt' - DO NOT CHANGE without data migration
   const store = new LocalStorageJwtStore(
     createNamespacedKey('myapp', 'downloader')
   );
   ```

### ❌ DON'T

1. **Don't use generic keys:**
   ```typescript
   // BAD - too generic
   new LocalStorageJwtStore('jwt')
   new LocalStorageJwtStore('token')
   new LocalStorageJwtStore('auth')
   ```

2. **Don't reuse keys across projects:**
   ```typescript
   // BAD - both projects use 'app_jwt'
   // Project A:
   new LocalStorageJwtStore('app_jwt')

   // Project B:
   new LocalStorageJwtStore('app_jwt') // COLLISION!
   ```

3. **Don't change keys without migration:**
   ```typescript
   // BAD - will lose existing users' JWT
   // Old: new LocalStorageJwtStore('old_key')
   new LocalStorageJwtStore('new_key') // Users logged out!
   ```

---

## Migration Guide

If you need to change the key (e.g., fixing collision):

```typescript
function migrateJwtKey(oldKey: string, newKey: string) {
  if (typeof localStorage === 'undefined') return;

  const oldJwt = localStorage.getItem(oldKey);

  if (oldJwt) {
    // Copy to new key
    localStorage.setItem(newKey, oldJwt);

    // Remove old key
    localStorage.removeItem(oldKey);

    console.log(`Migrated JWT from '${oldKey}' to '${newKey}'`);
  }
}

// Usage
migrateJwtKey('app_jwt', createNamespacedKey('myapp', 'downloader'));
```

---

## Alternative: Use CustomJwtStore

If you have complex requirements or custom storage:

```typescript
import { CustomJwtStore } from '@downloader/core';

// Redux example
const jwtStore = new CustomJwtStore(
  () => store.getState().auth.jwt,
  (jwt) => store.dispatch(setJwt(jwt)),
  () => store.dispatch(clearJwt())
);

// Cookie example with namespace
const jwtStore = new CustomJwtStore(
  () => Cookies.get('myapp_jwt'),
  (jwt) => Cookies.set('myapp_jwt', jwt, {
    expires: 7,
    sameSite: 'strict'
  }),
  () => Cookies.remove('myapp_jwt')
);
```

---

## Testing for Collisions

Check if other apps are using the same key:

```typescript
function checkKeyCollision(key: string) {
  if (typeof localStorage === 'undefined') return false;

  // List all localStorage keys
  const keys = Object.keys(localStorage);

  // Check if our key exists
  if (keys.includes(key)) {
    console.warn(`Key '${key}' already exists in localStorage!`);
    console.warn('All keys:', keys);
    return true;
  }

  return false;
}

// Usage
const myKey = createNamespacedKey('myapp', 'downloader');
if (checkKeyCollision(myKey)) {
  console.error('Key collision detected! Choose a different namespace.');
}
```

---

## Summary

| Scenario | Risk | Solution |
|----------|------|----------|
| Different domains | ✅ Safe | No action needed |
| Same domain, different apps | ⚠️ Medium | Use unique namespace |
| Same domain, same package | 🔴 High | **MUST** use unique key |

**Golden Rule:**
> Always use `createNamespacedKey(namespace, purpose)` where `namespace` is your unique app/project identifier.

**Example:**
```typescript
import { createNamespacedKey, LocalStorageJwtStore, createVerifier } from '@downloader/core';

const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('my-unique-app', 'downloader')
);

const verifier = createVerifier({ jwtStore });
```

This ensures zero collision risk across all apps using `@downloader/core`.
