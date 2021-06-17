#!/bin/sh

alias mockup-client='tezos-client --mode mockup --base-dir /tmp/mockup'
attacker=KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN
attacked=KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7

initial_tt_storage='record [
    storage=record [
        entered=False;
        pairs_count=0n;
        tokens=(big_map[] : big_map(nat, tokens_info));
        token_to_id=(big_map[] : big_map(token_pair, nat));
        pairs=(big_map[] : big_map(nat, pair_info));
        ledger=(big_map[] : big_map((address * nat), account_info));
    ];
    dex_lambdas=( big_map[] : big_map(nat, dex_func));
    metadata=( big_map[] : big_map(string, bytes));
    token_lambdas=( big_map[] : big_map(nat, token_func));
]'

# echo $initial_storage
x=$(ligo compile-storage ./integration_tests/MockTTDex.ligo main $(echo \"$initial_tt_storage\"))
echo "$x"

# mockup-client originate contract ttdex \
#               transferring 0 from bootstrap1 \
#               running ./integration_tests/MockTTDex.tz \
#               --init "(Pair (Pair {} {}) (Pair (Pair (Pair False {}) {} 0) {} {}) {})"  --burn-cap 10


token_fa2_storage='record [
    total_supply = 0n;
    ledger = (big_map[]  : big_map (address, account));
    token_metadata = (big_map[]  : big_map (token_id, token_metadata_info));
    metadata = (big_map[]  : big_map(string, bytes));
]'

istr=$(ligo compile-storage ./contracts/main/TokenFA2.ligo main \""$token_fa2_storage"\")
echo "${istr}"
mockup-client originate contract fa2token \
                transferring 0 from bootstrap1 \
                running ./compiled/token_fa2.tz \
                --init $(echo \"$istr\")  --burn-cap 10



# deploy evil token pair to Quipu
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1PgHxzUXruWG5XAahQzJAjkk4c2sPcM3Ca --entrypoint 'initializeExchange' --arg 'Pair  (Pair  (Pair (Pair (Left (Right Unit)) "KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN")  (Pair 0 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"))  0)  (Pair 100 100)' --burn-cap 0.1

# # allowance
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN --entrypoint 'allow' --arg '"KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"' --burn-cap 0.1

# # attack!
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN --entrypoint 'invest' --arg 'Pair (Pair 95 95) (Pair 95 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")'

# # tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1NkdTysHwwUVxqNUE45fNugXF8bFHRQk27 --entrypoint 'invest' --arg 'Pair (Pair 200 200) (Pair 200 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")'
