# Mutation gate

`src/services/mutation-gate.ts` is the only place money rules live. Handlers call it **before** `ClickbusClient` HTTP.

| Tool | `CLICKBUS_ALLOW_MUTATIONS` | `explicit_user_intent` | Guest token |
| --- | --- | --- | --- |
| book / cancel | required | required | rejected |
| logout | no | required | allowed |
