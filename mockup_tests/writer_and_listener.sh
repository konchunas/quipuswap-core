alias mockup_client='tezos-client --mode mockup --base-dir /tmp/mockup'
mockup_client create mockup
mockup_client originate contract writer transferring 0 from bootstrap1 running writer.tz --burn-cap 1 --init False
## Address of writer is KT1SbtaJyi5HH86e8jfvvV3AhQcckUvw4gSC
mockup_client originate contract listener transferring 0 from bootstrap1 running listener.tz --burn-cap 1 --init '"KT1SbtaJyi5HH86e8jfvvV3AhQcckUvw4gSC"'
### Address of listener is KT19oR1E5FLVe57b3DCoiiaawmHU9r6FQu5y
mockup_client call writer --entrypoint write --arg '"KT19oR1E5FLVe57b3DCoiiaawmHU9r6FQu5y"'
## Error message: script reached FAILWITH instruction with "State is true"
