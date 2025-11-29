# User Registration Transaction Errors

## Error 1: Minting Redeemer Type Mismatch

**Error Message:**

```
TxBuilderError: { Complete: "failed script execution Mint[0] unexpected empty list List Con( ProtoList( Data, [], ), )" }
```

**Cause:**
The off-chain code was sending a `Constr(0, [])` (empty constructor) as the minting redeemer, but the Aiken minting policy expected a `ByteArray` (the token name/username).

**Location:**

- File: `web/lib/contracts/userProfile.ts`
- Line: ~112

**Fix:**
Changed from:

```typescript
const mintRedeemer = Data.to(new Constr(0, []));
```

To:

```typescript
const mintRedeemer = Data.to(tokenName);
```

---

## Error 2: Wallet Type Structure Mismatch

**Error Message:**

```
TxBuilderError: { Complete: "failed script execution Mint[0] failed to deserialise PlutusData using UnConstrData Value Con( Data( BoundedBytes..." }
```

**Cause:**
The TypeScript `user_address` schema was using a nested credential structure (`payment_credential.hash`), but the Aiken `Wallet` type from `logical-mechanism-assist` uses a simpler structure with `pkh` and `stake_pkh` fields directly.

**Location:**

- File: `web/types/contracts.ts`
- Lines: 11-20

**Fix:**
Changed from:

```typescript
user_address: Data.Object({
  payment_credential: Data.Object({
    hash: Data.Bytes(),
  }),
  stake_credential: Data.Nullable(
    Data.Object({
      hash: Data.Bytes(),
    })
  ),
}),
```

To:

```typescript
user_address: Data.Object({
  pkh: Data.Bytes(),
  stake_pkh: Data.Nullable(Data.Bytes()),
}),
```

**Additional Note:**
The `registered_at` field should use a custom `Moment` type schema instead of `Data.Integer()` to properly align with the Aiken `Moment` type definition.
